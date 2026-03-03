# SORT — Algorithm Visualizer

A React-based sorting algorithm visualizer with a retro cyberpunk aesthetic. Watch 8 different sorting algorithms come to life in real time, with support for side-by-side comparison mode and 10 visual themes.

## Algorithms

| Algorithm | Time Complexity | Space Complexity |
|-----------|----------------|-----------------|
| Bubble Sort | O(n²) | O(1) |
| Selection Sort | O(n²) | O(1) |
| Insertion Sort | O(n²) | O(1) |
| Merge Sort | O(n log n) | O(n) |
| Quick Sort | O(n log n) | O(log n) |
| Heap Sort | O(n log n) | O(1) |
| Shell Sort | O(n log² n) | O(1) |
| Counting Sort | O(n + k) | O(k) |

## Features

- **Real-time canvas visualization** with color-coded bar states
- **Compare mode** — run two algorithms side by side on the same array for a fair head-to-head
- **10 visual themes** — Cyberpunk, Synthwave, Matrix, Blood Moon, Arctic, Sandstorm, Ocean, Lava, Mint, Void
- **Live stats** — comparisons, swaps, and elapsed time tracked per algorithm
- **Adjustable array size** — 5 to 500 elements
- **Four speed modes** — Slow, Normal, Fast, Extreme
- Scanline overlay and glitch header animation

## Themes

| Theme | Style |
|-------|-------|
| Cyberpunk | Dark, cyan accent |
| Synthwave | Dark purple, magenta accent |
| Matrix | Black, green accent |
| Blood Moon | Dark red, orange accent |
| Arctic | Light blue, navy accent |
| Sandstorm | Dark amber, gold accent |
| Ocean | Deep navy, blue accent |
| Lava | Dark brown, orange accent |
| Mint | Light green, emerald accent |
| Void | Pure black, white accent |

## Getting Started
```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

Live demo: [https://dizzie42.github.io/algorithm-visualizer/](https://dizzie42.github.io/algorithm-visualizer/)

Live demo: [https://dizzie42.github.io/algorithm-visualizer/](https://dizzie42.github.io/algorithm-visualizer/)

## Running Tests
```bash
# Run all tests
npm test

# Run a specific test file
npm test -- --testPathPattern=algorithms
npm test -- --testPathPattern=themes
npm test -- --testPathPattern=App
```

## Project Structure
```
src/
├── App.js                  # Root component
├── App.css                 # Global styles, animations, fonts
├── index.js                # Entry point
├── SortVisualizer.jsx      # Main visualizer — canvas, controls, stats, compare mode
├── algorithms.js           # All 8 sorting algorithm implementations
├── themes.js               # 10 visual theme definitions
└── tests/
    ├── App.test.js         # Component rendering and interaction tests
    ├── algorithms.test.js  # Unit tests for all sorting algorithms
    └── themes.test.js      # Theme structure and color validation tests
```

## Color Legend

| Color | Meaning |
|-------|---------|
| Dark (default) | Unsorted element |
| Cyan / Accent | Active element being placed |
| Red / Compare | Elements being compared |
| Amber / Pivot | Current pivot element |
| Green / Sorted | Element in final sorted position |

## Test Coverage

- **487 tests** across 3 test suites
- Correctness verified for all 8 algorithms across 7 input cases (random, sorted, reversed, duplicates, single, two elements, all identical)
- Edge cases: single element, two elements, all identical, large arrays (200 elements)
- Stop flag behavior validated per algorithm
- Theme structure, color validity, uniqueness, and contrast sanity checks