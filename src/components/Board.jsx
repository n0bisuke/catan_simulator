import React, { useState, useEffect, useMemo } from 'react';
import { generateBoard, RESOURCE_COLORS, RESOURCES, PROBABILITIES, RESOURCE_NAMES_JP, RESOURCE_ICONS } from '../utils/boardUtils';
import Hex from './Hex';

const Board = () => {
    const [hexes, setHexes] = useState([]);
    const [ports, setPorts] = useState([]); // Randomized ports
    const [hexSize, setHexSize] = useState(60); // Default hex size
    const [hoveredIntersection, setHoveredIntersection] = useState(null);

    // Center the board constants
    const width = 800;
    const height = 650;
    const centerX = width / 2;
    const centerY = height / 2;

    useEffect(() => {
        handleNewBoard();
    }, []);

    const handleNewBoard = () => {
        const { board, ports } = generateBoard();
        setHexes(board);
        setPorts(ports);
        setHoveredIntersection(null);
    };

    // Calculate hex positions for Point-Topped Hexes
    const getHexPosition = (q, r, size) => {
        const x = size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r);
        const y = size * (3 / 2 * r);
        return { x, y };
    };

    // Calculate intersections (settlement spots)
    const intersections = useMemo(() => {
        if (hexes.length === 0) return [];

        const uniqueVertices = [];
        const threshold = 2; // pixel tolerance for deduplication

        hexes.forEach(hex => {
            const { x: hx, y: hy } = getHexPosition(hex.q, hex.r, hexSize);

            for (let i = 0; i < 6; i++) {
                // Point-topped angles corresponding to Hex.jsx logic
                const angle_deg = 60 * i - 30;
                const angle_rad = Math.PI / 180 * angle_deg;
                const vx = hx + hexSize * Math.cos(angle_rad);
                const vy = hy + hexSize * Math.sin(angle_rad);

                // Check existing
                let found = uniqueVertices.find(v => Math.hypot(v.x - vx, v.y - vy) < threshold);
                if (!found) {
                    found = { x: vx, y: vy, hexes: [] };
                    uniqueVertices.push(found);
                }
                found.hexes.push(hex);
            }
        });

        // Determine stats for each vertex
        return uniqueVertices.map((v, idx) => {
            let totalDots = 0;
            const resourceCounts = {};

            v.hexes.forEach(h => {
                const dots = h.number ? (PROBABILITIES[h.number] || 0) : 0;
                totalDots += dots;
                if (h.resource !== RESOURCES.DESERT) {
                    resourceCounts[h.resource] = (resourceCounts[h.resource] || 0) + 1;
                }
            });

            return { ...v, id: idx, totalDots, resourceCounts, resources: Object.keys(resourceCounts) };
        });

    }, [hexes, hexSize]);

    // Calculate Port Positions and Rendering
    const renderedPorts = useMemo(() => {
        return ports.map((port, index) => {
            // Find the hex from the board state that matches the layout index
            const hex = hexes[port.layoutIndex];
            if (!hex) return null;

            // Get Hex Position (Local)
            const { x: rawX, y: rawY } = getHexPosition(hex.q, hex.r, hexSize);

            // Apply Center Offset immediately so all calculations are in SVG Space
            const hx = centerX + rawX;
            const hy = centerY + rawY;

            // Calculate edge points (for line drawing)
            // Edge index i connects vertex i and (i+1)%6
            const angle1 = (60 * port.edgeIndex - 30) * Math.PI / 180;
            const angle2 = (60 * ((port.edgeIndex + 1) % 6) - 30) * Math.PI / 180;

            const x1 = hx + hexSize * Math.cos(angle1);
            const y1 = hy + hexSize * Math.sin(angle1);
            const x2 = hx + hexSize * Math.cos(angle2);
            const y2 = hy + hexSize * Math.sin(angle2);

            // Midpoint of the edge
            const ex = (x1 + x2) / 2;
            const ey = (y1 + y2) / 2;

            // Direction vector OUTWARDS from center to edge midpoint
            const dx = ex - hx;
            const dy = ey - hy;
            const len = Math.sqrt(dx * dx + dy * dy);

            // Push out for the icon position
            const offset = 35; // increased distance for clearer separation
            const px = ex + (dx / len) * offset;
            const py = ey + (dy / len) * offset;

            // Label, Color, and Icon
            const ratioLabel = port.type === 'generic' ? '3:1' : '2:1';

            const isDark = [RESOURCES.WOOD, RESOURCES.BRICK, RESOURCES.ORE].includes(port.type);
            // Port structure color (Wood-like or Rope-like)
            const portLineColor = '#654321';

            const resourceIcon = port.type === 'generic' ? '?' : RESOURCE_ICONS[port.type];
            // Background circle color matches resource
            const circleColor = port.type === 'generic' ? '#fff' : RESOURCE_COLORS[port.type];
            const iconTextColor = isDark ? '#fff' : '#000'; // Contrast text

            return (
                <g key={`port-${index}`}>
                    {/* Port Lines (Ropes/Paths) - Thin and clean */}
                    <line x1={x1} y1={y1} x2={px} y2={py} stroke={portLineColor} strokeWidth="3" strokeLinecap="round" strokeDasharray="5,3" />
                    <line x2={x2} y2={y2} x1={px} y1={py} stroke={portLineColor} strokeWidth="3" strokeLinecap="round" strokeDasharray="5,3" />

                    {/* Port Station Circle */}
                    <circle cx={px} cy={py} r={16} fill={circleColor} stroke={portLineColor} strokeWidth="2" />

                    {/* Ratio Text (Top) */}
                    <text x={px} y={py - 4} textAnchor="middle" fontSize="10" fill={iconTextColor} fontWeight="bold" style={{ pointerEvents: 'none', textShadow: '0 0 2px rgba(0,0,0,0.5)' }}>
                        {ratioLabel}
                    </text>
                    {/* Resource Icon (Bottom) */}
                    <text x={px} y={py + 9} textAnchor="middle" fontSize="12" fill={iconTextColor} style={{ pointerEvents: 'none' }}>
                        {resourceIcon}
                    </text>
                </g>
            );
        });
    }, [ports, hexes, hexSize, centerX, centerY]);

    // Mobile Responsiveness: Removed manual scale logic in favor of SVG viewBox

    // Tooltip State with Position
    const [tooltipData, setTooltipData] = useState(null); // { content: intersection, x: 0, y: 0 }

    const handleMouseEnter = (e, intersection) => {
        const rect = e.target.getBoundingClientRect();
        // Calculate center of the target element relative to the viewport
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2; // Bottom of element? Or Center. Center is better.
        setTooltipData({ intersection, x, y });
    };

    return (
        <div style={{
            textAlign: 'center',
            position: 'relative',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            width: '100%',
            overflowX: 'hidden',
            padding: '10px',
            boxSizing: 'border-box'
        }}>
            <h2 style={{ fontSize: '2rem', color: '#333', marginBottom: '1rem', textShadow: '1px 1px 2px #ccc' }}>カタン 盤面シミュレーター</h2>
            <button
                onClick={handleNewBoard}
                style={{
                    marginBottom: '20px',
                    padding: '12px 24px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    background: 'linear-gradient(to bottom, #8B4513, #603000)',
                    color: '#fff',
                    border: '2px solid #3e1f00',
                    borderRadius: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                    fontWeight: 'bold'
                }}
            >
                盤面を生成
            </button>

            {/* SVG Container: width 100%, max-width 800px, aspect-ratio automatic via viewBox */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '800px',
                margin: '0 auto'
            }}>
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block', // prevent inline whitespace
                        background: '#4fa4b8',
                        borderRadius: '20px',
                        border: '8px solid #cfaa70',
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.2)'
                    }}
                >

                    <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
                        </filter>
                        <filter id="inner-glow">
                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* --- Terrain Patterns (Improved) --- */}

                        {/* 1. Forest (Wood) - Tree tops */}
                        <pattern id="pattern-wood" width="10" height="10" patternUnits="userSpaceOnUse" viewBox="0 0 10 10">
                            <rect width="10" height="10" fill="#2F5927" />
                            <circle cx="5" cy="5" r="3" fill="#204018" opacity="0.6" />
                            <circle cx="2" cy="2" r="1.5" fill="#3D7032" opacity="0.4" />
                            <circle cx="8" cy="8" r="1.5" fill="#3D7032" opacity="0.4" />
                        </pattern>

                        {/* 2. Hills (Brick) - Curved Layers */}
                        <pattern id="pattern-brick" width="20" height="10" patternUnits="userSpaceOnUse" viewBox="0 0 20 10">
                            <rect width="20" height="10" fill="#A84323" />
                            <path d="M0,8 Q10,12 20,8" fill="none" stroke="#752B13" strokeWidth="1.5" opacity="0.6" />
                            <path d="M0,3 Q10,7 20,3" fill="none" stroke="#752B13" strokeWidth="1.5" opacity="0.4" />
                        </pattern>

                        {/* 3. Pasture (Sheep) - Grass */}
                        <pattern id="pattern-sheep" width="15" height="15" patternUnits="userSpaceOnUse" viewBox="0 0 15 15">
                            <rect width="15" height="15" fill="#8CBA51" />
                            <path d="M3,12 L5,8 L7,12" stroke="#5C8A21" strokeWidth="1.5" fill="none" />
                            <path d="M10,6 L11,4 L12,6" stroke="#5C8A21" strokeWidth="1.5" fill="none" />
                        </pattern>

                        {/* 4. Fields (Wheat) - Grain Sheaves (MORE WHEAT-LIKE) */}
                        <pattern id="pattern-wheat" width="12" height="12" patternUnits="userSpaceOnUse" viewBox="0 0 12 12">
                            <rect width="12" height="12" fill="#F2CA4C" />
                            {/* Simple Sheaf shape: V shape with central line */}
                            <path d="M6,10 L6,2" stroke="#D9B036" strokeWidth="1" strokeLinecap="round" />
                            <path d="M6,4 L4,2" stroke="#D9B036" strokeWidth="1" strokeLinecap="round" />
                            <path d="M6,4 L8,2" stroke="#D9B036" strokeWidth="1" strokeLinecap="round" />
                            <path d="M6,6 L3,3" stroke="#D9B036" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                            <path d="M6,6 L9,3" stroke="#D9B036" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
                        </pattern>

                        {/* 5. Mountains (Ore) - jagged rocks */}
                        <pattern id="pattern-ore" width="20" height="20" patternUnits="userSpaceOnUse" viewBox="0 0 20 20">
                            <rect width="20" height="20" fill="#6E7C85" />
                            <path d="M5,15 L10,5 L15,15 Z" fill="#505C63" opacity="0.8" />
                            <path d="M0,20 L5,12 L10,20 Z" fill="#505C63" opacity="0.6" />
                        </pattern>

                        {/* 6. Desert - Dunes */}
                        <pattern id="pattern-desert" width="20" height="20" patternUnits="userSpaceOnUse" viewBox="0 0 20 20">
                            <rect width="20" height="20" fill="#D6B878" />
                            <path d="M0,10 Q10,5 20,10" fill="none" stroke="#C1A365" strokeWidth="1.5" opacity="0.7" />
                        </pattern>
                    </defs>

                    {hexes.map((hex) => {
                        const { x, y } = getHexPosition(hex.q, hex.r, hexSize);
                        return (
                            <Hex
                                key={hex.id}
                                id={hex.id}
                                x={centerX + x} // Shift to center
                                y={centerY + y} // Shift to center
                                size={hexSize}
                                resource={hex.resource}
                                number={hex.number}
                            />
                        );
                    })}

                    {/* Render Ports */}
                    {renderedPorts}

                    {/* Render Intersections */}
                    {intersections.map((v) => (
                        <circle
                            key={v.id}
                            cx={centerX + v.x}
                            cy={centerY + v.y}
                            r={8}
                            fill={tooltipData && tooltipData.intersection.id === v.id ? "#fff" : "rgba(255,255,255,0.2)"}
                            stroke={tooltipData && tooltipData.intersection.id === v.id ? "#000" : "none"}
                            strokeWidth={2}
                            style={{ cursor: 'pointer', transition: 'all 0.2s', touchAction: 'none' }}
                            onMouseEnter={(e) => handleMouseEnter(e, v)}
                            onMouseLeave={() => setTooltipData(null)}
                            onTouchStart={(e) => handleMouseEnter(e, v)} // Mobile touch support
                        />
                    ))}
                </svg>

                {/* Tooltip (Fixed/Absolute Positioning) */}
                {tooltipData && (
                    <div style={{
                        position: 'fixed', // Use fixed to be relative to screen
                        top: Math.max(10, tooltipData.y - 120), // Prevent off-screen top
                        left: Math.max(10, Math.min(window.innerWidth - 170, tooltipData.x - 80)), // Centered horizontally, clamped
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#333',
                        padding: '12px',
                        borderRadius: '8px',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        textAlign: 'left',
                        minWidth: '160px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                        border: '1px solid #ddd'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                            確率の合計: <span style={{ fontSize: '1.2em', color: '#d32f2f' }}>{tooltipData.intersection.totalDots}</span>
                        </div>
                        {Object.entries(tooltipData.intersection.resourceCounts).map(([res, count]) => (
                            <div key={res} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: RESOURCE_COLORS[res], border: '1px solid #999' }}></div>
                                <span style={{ fontSize: '13px' }}>{RESOURCE_NAMES_JP[res]} x{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '30px', background: '#f9f9f9', padding: '20px', borderRadius: '8px', maxWidth: '800px', margin: '30px auto', boxSizing: 'border-box' }}>
                <h3 style={{ margin: '0 0 15px 0' }}>凡例</h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    {Object.entries(RESOURCE_COLORS).map(([key, color]) => (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '5px 10px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: color, marginRight: '8px', border: '1px solid #ccc' }}></div>
                            <span style={{ fontSize: '14px' }}>{RESOURCE_NAMES_JP[key]} {RESOURCE_ICONS[key]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Board;
