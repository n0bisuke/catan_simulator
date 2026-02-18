import React from 'react';
import { PROBABILITIES } from '../utils/boardUtils';

const Hex = ({ x, y, size, resource, number, id }) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle_deg = 60 * i - 30;
        const angle_rad = Math.PI / 180 * angle_deg;
        points.push(`${x + size * Math.cos(angle_rad)},${y + size * Math.sin(angle_rad)}`);
    }

    // Map resource to pattern ID defined in Board.jsx
    const getPatternId = (res) => {
        switch (res) {
            case 'wood': return 'url(#pattern-wood)';
            case 'brick': return 'url(#pattern-brick)';
            case 'sheep': return 'url(#pattern-sheep)';
            case 'wheat': return 'url(#pattern-wheat)';
            case 'ore': return 'url(#pattern-ore)';
            case 'desert': return 'url(#pattern-desert)';
            default: return '#eee'; // Fallback
        }
    };

    const fill = getPatternId(resource);

    // Number Token Logic
    const isHighProb = number === 6 || number === 8;
    const numberColor = isHighProb ? '#D32F2F' : '#333';

    // Adjusted sizes for better visibility (Token size ~50% of hex)
    const tokenRadius = size * 0.4;
    const fontSize = size * 0.35;
    const pipsYOffset = size * 0.25;

    const dotsCount = number ? PROBABILITIES[number] : 0;

    // Calculate Pips (Dots)
    const renderPips = () => {
        if (!dotsCount) return null;
        const dots = [];
        const dotRadius = size * 0.04; // scale dot with size
        const spacing = dotRadius * 3;
        // Start X such that dots are centered
        const totalWidth = (dotsCount - 1) * spacing;
        const startX = x - totalWidth / 2;

        for (let i = 0; i < dotsCount; i++) {
            dots.push(
                <circle
                    key={i}
                    cx={startX + i * spacing}
                    cy={y + pipsYOffset}
                    r={dotRadius}
                    fill={numberColor}
                />
            );
        }
        return dots;
    };

    return (
        <g>
            {/* Main Hex Polygon with Pattern Fill */}
            <polygon points={points.join(' ')} fill={fill} stroke="#555" strokeWidth="1" />

            {/* Inner Bevel/Edge Highlight for 3D effect */}
            <polygon points={points.join(' ')} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" transform={`scale(0.95)`} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />

            {number && (
                <g filter="url(#shadow)">
                    {/* Token Circle (Beige) */}
                    <circle cx={x} cy={y} r={tokenRadius} fill="#F9F6E8" stroke="#5d5341" strokeWidth="1.5" />
                    {/* Inner dashed ring for style */}
                    <circle cx={x} cy={y} r={tokenRadius * 0.9} fill="none" stroke="#dcb" strokeWidth="1" strokeDasharray="3,2" />

                    {/* Number */}
                    <text
                        x={x}
                        y={y}
                        dy="-0.05em" // Move up slightly to make room for dots
                        textAnchor="middle"
                        fontSize={fontSize}
                        fill={numberColor}
                        fontWeight="bold"
                        fontFamily="Georgia, serif"
                    >
                        {number}
                    </text>

                    {/* Probability Pips */}
                    {renderPips()}
                </g>
            )}

            {/* Debug ID - Tiny and unobtrusive */}
            <text
                x={x}
                y={y - size * 0.75}
                textAnchor="middle"
                fontSize={8}
                fill="rgba(0,0,0,0.3)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
                {id}
            </text>
        </g>
    );
};

export default Hex;
