export const RESOURCES = {
    WOOD: 'wood',
    BRICK: 'brick',
    SHEEP: 'sheep',
    WHEAT: 'wheat',
    ORE: 'ore',
    DESERT: 'desert',
};

export const RESOURCE_COLORS = {
    [RESOURCES.WOOD]: '#2F5927',   // Shinrin-yoku Green (Darker)
    [RESOURCES.BRICK]: '#A84323',  // Clay/Brick Red
    [RESOURCES.SHEEP]: '#8CBA51',  // Pasture Green
    [RESOURCES.WHEAT]: '#F2CA4C',  // Wheat Yellow
    [RESOURCES.ORE]: '#6E7C85',    // Stone/Ore Grey
    [RESOURCES.DESERT]: '#D6B878', // Sand/Desert
};

export const RESOURCE_NAMES_JP = {
    [RESOURCES.WOOD]: '木材',
    [RESOURCES.BRICK]: 'レンガ',
    [RESOURCES.SHEEP]: '羊毛',
    [RESOURCES.WHEAT]: '小麦',
    [RESOURCES.ORE]: '鉄鉱石',
    [RESOURCES.DESERT]: '砂漠',
};

export const RESOURCE_ICONS = {
    [RESOURCES.WOOD]: '🌲',
    [RESOURCES.BRICK]: '🧱',
    [RESOURCES.SHEEP]: '🐑',
    [RESOURCES.WHEAT]: '🌾',
    [RESOURCES.ORE]: '⛰️',
    [RESOURCES.DESERT]: '🌵',
};

export const NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

export const PROBABILITIES = {
    2: 1, 3: 2, 4: 3, 5: 4, 6: 5,
    8: 5, 9: 4, 10: 3, 11: 2, 12: 1,
    0: 0 // Desert or None
};

const TERRAIN_COUNTS = {
    [RESOURCES.WOOD]: 4,
    [RESOURCES.BRICK]: 3,
    [RESOURCES.SHEEP]: 4,
    [RESOURCES.WHEAT]: 4,
    [RESOURCES.ORE]: 3,
    [RESOURCES.DESERT]: 1,
};

// Standard Spiral Layout Order (0 is Top Left in Row-major? No, Spiral is usually different)
// This is Row-Major layout
const LAYOUT = [
    { q: 0, r: -2, s: 2 }, { q: 1, r: -2, s: 1 }, { q: 2, r: -2, s: 0 },
    { q: -1, r: -1, s: 2 }, { q: 0, r: -1, s: 1 }, { q: 1, r: -1, s: 0 }, { q: 2, r: -1, s: -1 },
    { q: -2, r: 0, s: 2 }, { q: -1, r: 0, s: 1 }, { q: 0, r: 0, s: 0 }, { q: 1, r: 0, s: -1 }, { q: 2, r: 0, s: -2 },
    { q: -2, r: 1, s: 1 }, { q: -1, r: 1, s: 0 }, { q: 0, r: 1, s: -1 }, { q: 1, r: 1, s: -2 },
    { q: -2, r: 2, s: 0 }, { q: -1, r: 2, s: -1 }, { q: 0, r: 2, s: -2 }
];

// Fixed Port Sites (Location only, type is placeholder/initial)
export const OFFICIAL_PORTS = [
    { layoutIndex: 0, edgeIndex: 4, type: 'generic' },  // Top Left
    { layoutIndex: 1, edgeIndex: 5, type: 'generic' }, // Top Mid (Placeholder)
    { layoutIndex: 6, edgeIndex: 0, type: 'generic' },  // Right Top
    { layoutIndex: 11, edgeIndex: 1, type: 'generic' }, // Right Mid
    { layoutIndex: 15, edgeIndex: 1, type: 'generic' }, // Right Bot
    { layoutIndex: 18, edgeIndex: 2, type: 'generic' }, // Bot Mid
    { layoutIndex: 16, edgeIndex: 3, type: 'generic' }, // Bot Left
    { layoutIndex: 12, edgeIndex: 3, type: 'generic' },   // Left Bot
    { layoutIndex: 3, edgeIndex: 4, type: 'generic' }   // Left Top
];

// Adjacency Map for 6/8 check
// Based on LAYOUT indices.
// Generated dynamically if needed, but hardcoding critical adjacencies is safer/possible.
// But 19 hexes is small. We can compute neighbor list.

const getNeighbors = (index) => {
    const q = LAYOUT[index].q;
    const r = LAYOUT[index].r;
    // Neighbors have diff (dq, dr) in:
    // (+1, 0), (+1, -1), (0, -1), (-1, 0), (-1, +1), (0, +1)
    const deltas = [
        { dq: 1, dr: 0 }, { dq: 1, dr: -1 }, { dq: 0, dr: -1 },
        { dq: -1, dr: 0 }, { dq: -1, dr: 1 }, { dq: 0, dr: 1 }
    ];

    return deltas.map(d => {
        const nq = q + d.dq;
        const nr = r + d.dr;
        return LAYOUT.findIndex(h => h.q === nq && h.r === nr);
    }).filter(idx => idx !== -1);
};

// Precompute neighbors for efficiency
const NEIGHBORS = LAYOUT.map((_, i) => getNeighbors(i));

export const generateBoard = () => {
    // 1. Create resources (19 total)
    let resources = [];
    Object.entries(TERRAIN_COUNTS).forEach(([type, count]) => {
        for (let i = 0; i < count; i++) {
            resources.push(type);
        }
    });

    // Shuffle resources
    resources = shuffle(resources);

    // 2. Create numbers and enforce 6/8 rule
    // Try to shuffle valid numbers until a valid configuration is found.
    let validNumbers;
    let assignment = new Array(19).fill(null);
    let attempts = 0;
    const maxAttempts = 1000;

    while (attempts < maxAttempts) {
        attempts++;
        validNumbers = shuffle([...NUMBERS]); // 18 numbers

        // Assign temporarily
        let numIdx = 0;
        let tempAssignment = [];
        let isValid = true;

        for (let i = 0; i < 19; i++) {
            if (resources[i] === RESOURCES.DESERT) {
                tempAssignment[i] = null;
            } else {
                tempAssignment[i] = validNumbers[numIdx];
                numIdx++;
            }
        }

        // Check adjacency
        for (let i = 0; i < 19; i++) {
            const val = tempAssignment[i];
            if (val === 6 || val === 8) {
                const neighbors = NEIGHBORS[i];
                for (const nIdx of neighbors) {
                    const nVal = tempAssignment[nIdx];
                    if (nVal === 6 || nVal === 8) {
                        isValid = false;
                        break;
                    }
                }
            }
            if (!isValid) break;
        }

        if (isValid) {
            assignment = tempAssignment;
            break;
        }
    }

    if (attempts >= maxAttempts) {
        console.warn("Could not find valid 6/8 placement in 1000 attempts. Using last random.");
    }

    // 3. Generate Board Object
    const board = LAYOUT.map((coord, index) => {
        return {
            id: index,
            ...coord,
            resource: resources[index],
            number: assignment[index] // From our validated assignment
        };
    });

    // 4. Generate Random Ports
    // 4 Generic, 1 of each Resource
    let portTypes = [
        'generic', 'generic', 'generic', 'generic',
        RESOURCES.WOOD,
        RESOURCES.BRICK,
        RESOURCES.SHEEP,
        RESOURCES.WHEAT,
        RESOURCES.ORE
    ];
    portTypes = shuffle(portTypes);

    const ports = OFFICIAL_PORTS.map((site, index) => ({
        ...site,
        type: portTypes[index]
    }));

    return { board, ports };
};

// Fisher-Yates shuffle
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}
