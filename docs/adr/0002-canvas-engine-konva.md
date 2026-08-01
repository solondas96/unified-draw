# 2. Canvas Engine with Konva.js

Date: 2026-08-01

## Status
Accepted

## Context
Rendering a digital whiteboard requires high performance, support for thousands of vector nodes, panning, zooming, and hit detection. Using standard DOM elements (HTML/CSS) is too slow for thousands of objects, and writing raw WebGL or Canvas API code from scratch is error-prone and time-consuming.

## Decision
We chose **Konva.js** (via `react-konva`) as the 2D canvas rendering engine.

## Consequences
- **Pros:**
  - Excellent abstraction over the native HTML5 Canvas API.
  - Declarative React-like syntax via `react-konva`.
  - Built-in support for hit detection, event handling (`onClick`, `onDrag`), layers, and zooming.
- **Cons:**
  - Standard HTML elements (like textareas or popups) cannot be rendered *inside* the Konva stage easily. They must be overlaid as absolute sibling DOM nodes, which requires manual calculation of zoom and pan offsets.
