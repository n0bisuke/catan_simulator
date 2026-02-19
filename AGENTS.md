# Catan Simulator Project Context for AI Agents

## Project Overview
This project is a web-based simulator for the board game **Catan (The Settlers of Catan)**.
The primary goal is to generate and visualize fair and random Catan maps, helping players set up their games or practice initial placement strategies.

## Target Audience & Platform
- **Primary Platform**: Mobile (Smartphones). The UI must be "Mobile First".
- **Usage**: Players using their phones to generate a map setup, then potentially sharing the result to social media (X/Twitter).

## Technical Stack
- **Framework**: React (Vite)
- **Language**: JavaScript/JSX
- **Styling**: Vanilla CSS (inline styles and CSS files), SVG for the board graphics.
- **State Management**: React `useState`, `useReducer` (if needed).
- **No Backend**: purely client-side logic.

## Game Logic & Rules (See `RULES.md`)
- **Board Layout**: Standard hex grid (3-4-5-4-3 rows).
- **Resources**: Wood (Forest), Brick (Hills), Sheep (Pasture), Wheat (Fields), Ore (Mountains), Desert.
- **Number Tokens**: 2-12 (skipping 7), with specific probabilities.
- **Constraints**:
    - **Red Numbers (6 & 8)** must NOT be adjacent (Implementation priority).
    - **Resource Distribution**: Should be balanced (or truly random, depending on mode).
    - **Ports**: Fixed locations, but types can be randomized.

## Current status
- Basic board generation works.
- SVG rendering is implemented.
- Mobile responsiveness is a priority.

## Future Agents Tasks
If you are an AI assistant working on this project, please focus on:
1. **Refining the Generation Algorithm**: Ensure 6/8 separation constraints are strictly met.
2. **UI/UX Improvements**: Enhance the "premium" feel, smooth animations, and touch interactions.
3. **Feature Additions**: 
   - Statistical analysis of starting spots.
   - "First pick" simulation/recommendation.
   - Social sharing capabilities.

## Code Style
- Use `src/components/` for React components.
- Use `src/utils/` for game logic and helper functions.
- Keep components functional and clean.
- **Mobile First**: Always test/visualize for narrow screens (375px width).
