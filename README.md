# 🎨 UnifiedDraw

A lightweight, blazing-fast, browser-based diagramming tool that combines the best features of Excalidraw, draw.io, and Miro. Built for developers, designers, and system architects who need a frictionless whiteboarding experience.

![UnifiedDraw Preview](public/favicon.svg)

## ✨ Features

- **Infinite Canvas Workspace**: Seamless zooming (up to 400%) and panning across an endless digital whiteboard.
- **Rich Shape Library & Search**: Over 500 pre-built shapes. Search by name or category, and "Star" your favorite shapes to pin them to the top.
- **Excalidraw-Inspired UX**: Fluid drag-and-drop shape creation directly from the sidebar to the canvas.
- **Smart Connectors**: Easily link shapes together with smart dynamic connecting lines (Straight or Curved Bezier) that snap to 8-point bounding boxes.
- **Context-Aware Floating Toolbar**: Select any element to instantly access quick actions (Font Size, Weight, Alignment, Colors, Copy/Paste) right above it.
- **Beautiful Dark & Light Modes**: Eye-soothing, meticulously crafted design tokens for both light and dark environments with a smooth toggle animation.
- **100% Local Privacy**: All your diagrams and persistent text preferences are saved locally using IndexedDB and localStorage. No servers, no tracking.
- **Advanced Export Engine**: Export your masterpieces to high-res PNG, infinitely scalable SVG, or **Mermaid Flowchart Markdown**!
- **Multi-Selection & Alignment**: Rubber-band selection to move, group, or align multiple elements at once.
- **Extensive Keyboard Shortcuts**: Pro-level workflows designed for speed (press `V` for Select, `/` to search shapes, `Ctrl+L` to lock, etc.).

## 🛠️ Technology Stack

- **Frontend Framework**: [React 18](https://reactjs.org/) powered by [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) for bulletproof code
- **Canvas Engine**: [Konva.js](https://konvajs.org/) via `react-konva` for 60fps rendering performance
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) for unopinionated, fast state architecture
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) mapped to dynamic CSS variables for theme switching
- **Icons**: [Lucide React](https://lucide.dev/)
- **Storage**: `idb-keyval` for fast asynchronous IndexedDB storage

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18+) and `npm` installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/solondas96/unified-draw.git
   cd unified-draw
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Production Build
To create an optimized production build:
```bash
npm run build
npm run preview
```

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `V` | Select Tool |
| `H` / `Space` | Pan (Hand Tool) |
| `P` | Freehand (Pencil) |
| `R` | Rectangle |
| `C` | Circle |
| `D` | Diamond |
| `A` | Arrow |
| `T` | Text |
| `X` | Connector |
| `/` | Search Shape Library |
| `Ctrl + S` | Save Diagram |
| `Ctrl + L` | Lock / Unlock Selected |
| `Ctrl + Z` | Undo |
| `Ctrl + Y` | Redo |
| `Ctrl + C` / `V` | Copy & Paste |
| `Ctrl + D` | Duplicate selection |
| `Ctrl + Shift + ↑` | Bring to Front |
| `Ctrl + Shift + ↓` | Send to Back |
| `Del` / `Backspace` | Delete selected elements |
| `Double Click` | Edit shape/text inline |
| `Right Click` | Context Menu |

## 🏗️ Project Structure

- `src/components/` - Core UI components (`CanvasWorkspace`, `Toolbar`, `Sidebar`, `StatusBar`)
- `src/store.ts` - Centralized Zustand state for canvas manipulation, history, and theming
- `src/ShapeRenderer.tsx` - Konva-based rendering logic mapping state elements to canvas nodes
- `src/shapeLibrary.ts` - Master definitions for 500+ available SVG shapes and paths
- `src/db.ts` - IndexedDB integration layer for auto-saving
- `src/types.ts` - Core TypeScript interfaces for Elements, Styles, and Store State
- `src/index.css` - Global styles and custom property definitions for Dark/Light mode

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/solondas96/unified-draw/issues).

## 📄 License
This project is licensed under the MIT License.
