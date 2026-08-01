import { create } from "zustand";
import type { Element, ToolType, Canvas, ShapeType, TextStyle } from "./types";

// ─── Undo/Redo Types ───────────────────────────────────────────────
interface HistoryState {
  past: Element[][];
  present: Element[];
  future: Element[][];
}

const MAX_HISTORY = 100;

function createHistory(elements: Element[]): HistoryState {
  return { past: [], present: elements, future: [] };
}

function pushHistory(state: HistoryState, newPresent: Element[]): HistoryState {
  if (state.present === newPresent) return state;
  const past = [...state.past, state.present].slice(-MAX_HISTORY);
  return { past, present: newPresent, future: [] };
}

function undoHistory(state: HistoryState): HistoryState {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  const past = state.past.slice(0, -1);
  return { past, present: previous, future: [state.present, ...state.future] };
}

function redoHistory(state: HistoryState): HistoryState {
  if (state.future.length === 0) return state;
  const next = state.future[0];
  const future = state.future.slice(1);
  return { past: [...state.past, state.present], present: next, future };
}

/**
 * Core application state for UnifiedDraw, managed by Zustand.
 */
interface StoreState {
  // Canvas metadata
  canvasId: string;
  canvasName: string;
  canvasVersion: number;
  createdAt: number;
  updatedAt: number;

  // View
  zoom: number;
  panX: number;
  panY: number;

  // Tool
  tool: ToolType;
  selectedShapeType: ShapeType | null;

  // Elements & selection
  history: HistoryState;
  selectedIds: string[];
  clipboard: Element[];

  // UI
  sidebarTab: "layers" | "inspector" | "library";
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  saveStatus: "idle" | "saving" | "saved";
  theme: "dark" | "light";
  favoriteShapes: string[];
  isHelpPanelOpen: boolean;
  toastMessage: string | null;

  // Derived
  elements: Element[];

  // ─── Actions ───────────────────────────────────────────────────
  setTool: (tool: ToolType) => void;
  setSelectedShapeType: (shape: ShapeType | null) => void;

  addElement: (el: Element) => void;
  addElements: (els: Element[]) => void;
  updateElement: (id: string, patch: Partial<Element>) => void;
  updateElements: (ids: string[], patch: Partial<Element>) => void;
  deleteElements: (ids: string[]) => void;
  deleteSelected: () => void;
  toggleLockSelected: () => void;
  showToast: (message: string) => void;
  setHelpPanelOpen: (isOpen: boolean) => void;
  toggleFavoriteShape: (label: string) => void;
  nudgeSelected: (dx: number, dy: number) => void;
  alignSelected: (
    alignment:
      | "left"
      | "center"
      | "right"
      | "top"
      | "middle"
      | "bottom"
      | "distribute-h"
      | "distribute-v",
  ) => void;
  duplicateElement: (id: string) => void;
  duplicateSelected: () => void;

  selectElement: (id: string | null, additive?: boolean) => void;
  selectElements: (ids: string[]) => void;
  selectAll: () => void;
  clearSelection: () => void;

  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  zoomTo: (zoom: number, cx: number, cy: number) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  copy: () => void;
  paste: () => void;

  setSidebarTab: (tab: "layers" | "inspector" | "library") => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleTheme: () => void;

  setCanvasName: (name: string) => void;
  loadCanvas: (canvas: Canvas) => void;
  newCanvas: () => void;
  setSaveStatus: (status: "idle" | "saving" | "saved") => void;

  getCanvasData: () => Canvas;
  getSelectedElement: () => Element | null;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { genId };

function snap(v: number, size: number, enabled: boolean): number {
  return enabled ? Math.round(v / size) * size : v;
}

/**
 * Generates a default text style configuration.
 * Uses the hand-drawn Virgil font by default.
 */
export function createDefaultTextStyle(): TextStyle {
  const defaultStyle: TextStyle = {
    fontSize: 16,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#1e293b",
    alignment: "center",
    fontFamily: "Virgil,Segoe UI,cursive",
    textDecoration: "none",
    lineHeight: 1.2,
  };
  try {
    const saved = localStorage.getItem("lastUsedTextStyle");
    if (saved) return { ...defaultStyle, ...JSON.parse(saved) };
  } catch {}
  return defaultStyle;
}

export function saveDefaultTextStyle(style: Partial<TextStyle>) {
  try {
    const current = createDefaultTextStyle();
    localStorage.setItem(
      "lastUsedTextStyle",
      JSON.stringify({ ...current, ...style }),
    );
  } catch {}
}

/** Read the current theme's shape stroke color from CSS custom property */
function getThemeShapeStroke(): string {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--shape-stroke")
      .trim() || "#a8b4d0"
  );
}

/**
 * Factory function to create a new canvas Element.
 * Reads the current CSS theme variables to pick an appropriate stroke color.
 *
 * @param type The base element type (e.g. "shape", "text").
 * @param shapeType The specific shape type (if applicable).
 * @param x Initial X position.
 * @param y Initial Y position.
 * @param width Initial width.
 * @param height Initial height.
 * @returns A fully formed Element object.
 */
export function createDefaultElement(
  type: Element["type"],
  shapeType: ShapeType | undefined,
  x: number,
  y: number,
  width: number = 100,
  height: number = 100,
): Element {
  return {
    id: genId(),
    type,
    x,
    y,
    width,
    height,
    rotation: 0,
    shapeType,
    fill: "transparent",
    stroke: getThemeShapeStroke(),
    strokeWidth: 2,
    zIndex: 0,
    visible: true,
    locked: false,
    roughness: 1,
    opacity: 1,
    cornerRadius: 0,
    textStyle:
      type === "text" || type === "shape"
        ? createDefaultTextStyle()
        : undefined,
  };
}

/**
 * The global Zustand store.
 * Handles elements, view state, selection, history, and theme.
 */
export const useStore = create<StoreState>((set, get) => ({
  canvasId: genId(),
  canvasName: "Untitled Diagram",
  canvasVersion: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),

  zoom: 1,
  panX: 0,
  panY: 0,

  tool: "select",
  selectedShapeType: null,

  history: createHistory([]),
  selectedIds: [],
  clipboard: [],

  sidebarTab: "library",
  toastMessage: null,
  isHelpPanelOpen: false,
  favoriteShapes: (() => {
    try {
      return JSON.parse(localStorage.getItem("favoriteShapes") || "[]");
    } catch {
      return [];
    }
  })(),
  showGrid: true,
  snapToGrid: false,
  gridSize: 20,
  saveStatus: "idle",
  theme: "dark" as "dark" | "light",

  elements: [],

  setTool: (tool) =>
    set({
      tool,
      selectedShapeType: tool === "select" ? null : get().selectedShapeType,
    }),

  setSelectedShapeType: (shape) => set({ selectedShapeType: shape }),

  addElement: (el) => {
    const state = get();
    const newElements = [
      ...state.history.present,
      { ...el, zIndex: state.history.present.length },
    ];
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  addElements: (els) => {
    const state = get();
    const baseZ = state.history.present.length;
    const newElements = [
      ...state.history.present,
      ...els.map((e, i) => ({ ...e, zIndex: baseZ + i })),
    ];
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  updateElement: (id, patch) => {
    const state = get();
    const newElements = state.history.present.map((e) =>
      e.id === id ? { ...e, ...patch } : e,
    );
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  updateElements: (ids, patch) => {
    const state = get();
    const idSet = new Set(ids);
    const newElements = state.history.present.map((e) =>
      idSet.has(e.id) ? { ...e, ...patch } : e,
    );
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  deleteElements: (ids) => {
    const state = get();
    const idSet = new Set(ids);
    const newElements = state.history.present.filter((e) => !idSet.has(e.id));
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      selectedIds: state.selectedIds.filter((id) => !idSet.has(id)),
      updatedAt: Date.now(),
    });
  },

  nudgeSelected: (dx, dy) => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    const idSet = new Set(state.selectedIds);
    const newElements = state.history.present.map((e) =>
      idSet.has(e.id) ? { ...e, x: e.x + dx, y: e.y + dy } : e,
    );
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  alignSelected: (alignment) => {
    const state = get();
    if (state.selectedIds.length < 2) return;

    const idSet = new Set(state.selectedIds);
    const selected = state.history.present.filter((e) => idSet.has(e.id));
    if (selected.length < 2) return;

    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    selected.forEach((e) => {
      if (e.x < minX) minX = e.x;
      if (e.y < minY) minY = e.y;
      if (e.x + e.width > maxX) maxX = e.x + e.width;
      if (e.y + e.height > maxY) maxY = e.y + e.height;
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const newElements = state.history.present.map((e) => {
      if (!idSet.has(e.id)) return e;
      const patch = { ...e };
      switch (alignment) {
        case "left":
          patch.x = minX;
          break;
        case "center":
          patch.x = centerX - e.width / 2;
          break;
        case "right":
          patch.x = maxX - e.width;
          break;
        case "top":
          patch.y = minY;
          break;
        case "middle":
          patch.y = centerY - e.height / 2;
          break;
        case "bottom":
          patch.y = maxY - e.height;
          break;
      }
      return patch;
    });

    // Handle distribution separately because it needs sorting
    if (alignment === "distribute-h") {
      const sorted = [...selected].sort((a, b) => a.x - b.x);
      const totalWidth = sorted.reduce((sum, e) => sum + e.width, 0);
      const availableSpace = maxX - minX - totalWidth;
      const gap = availableSpace / (sorted.length - 1);
      let currentX = minX;
      sorted.forEach((e) => {
        const index = newElements.findIndex((ne) => ne.id === e.id);
        if (index !== -1) newElements[index].x = currentX;
        currentX += e.width + gap;
      });
    } else if (alignment === "distribute-v") {
      const sorted = [...selected].sort((a, b) => a.y - b.y);
      const totalHeight = sorted.reduce((sum, e) => sum + e.height, 0);
      const availableSpace = maxY - minY - totalHeight;
      const gap = availableSpace / (sorted.length - 1);
      let currentY = minY;
      sorted.forEach((e) => {
        const index = newElements.findIndex((ne) => ne.id === e.id);
        if (index !== -1) newElements[index].y = currentY;
        currentY += e.height + gap;
      });
    }

    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  setHelpPanelOpen: (isOpen) => set({ isHelpPanelOpen: isOpen }),
  toggleFavoriteShape: (label: string) => {
    set((state) => {
      const newFavs = state.favoriteShapes.includes(label)
        ? state.favoriteShapes.filter((l: string) => l !== label)
        : [...state.favoriteShapes, label];
      try {
        localStorage.setItem("favoriteShapes", JSON.stringify(newFavs));
      } catch (e) {}
      return { favoriteShapes: newFavs };
    });
  },

  showToast: (message) => {
    set({ toastMessage: message });
    setTimeout(() => {
      if (get().toastMessage === message) set({ toastMessage: null });
    }, 3000);
  },
  toggleLockSelected: () => {
    const state = get();
    if (state.selectedIds.length === 0) return;
    const idSet = new Set(state.selectedIds);
    // Find if at least one is unlocked to determine whether we are locking or unlocking everything
    const anyUnlocked = state.history.present.some(
      (e) => idSet.has(e.id) && !e.locked,
    );

    const newElements = state.history.present.map((e) =>
      idSet.has(e.id) ? { ...e, locked: anyUnlocked } : e,
    );
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },
  deleteSelected: () => {
    const { selectedIds } = get();
    if (selectedIds.length > 0) get().deleteElements(selectedIds);
  },

  duplicateElement: (id) => {
    const state = get();
    const el = state.history.present.find((e) => e.id === id);
    if (!el) return;
    const copy: Element = {
      ...el,
      id: genId(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: state.history.present.length,
    };
    const newElements = [...state.history.present, copy];
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      selectedIds: [copy.id],
      updatedAt: Date.now(),
    });
  },

  duplicateSelected: () => {
    const state = get();
    const copies: Element[] = [];
    let zBase = state.history.present.length;
    for (const id of state.selectedIds) {
      const el = state.history.present.find((e) => e.id === id);
      if (el) {
        copies.push({
          ...el,
          id: genId(),
          x: el.x + 20,
          y: el.y + 20,
          zIndex: zBase++,
        });
      }
    }
    if (copies.length === 0) return;
    const newElements = [...state.history.present, ...copies];
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      selectedIds: copies.map((c) => c.id),
      updatedAt: Date.now(),
    });
  },

  selectElement: (id, additive) => {
    const state = get();
    if (id === null) {
      set({ selectedIds: [] });
      return;
    }
    if (additive) {
      if (state.selectedIds.includes(id)) {
        set({ selectedIds: state.selectedIds.filter((sid) => sid !== id) });
      } else {
        set({ selectedIds: [...state.selectedIds, id] });
      }
    } else {
      set({ selectedIds: [id] });
    }
  },

  selectElements: (ids) => set({ selectedIds: ids }),

  selectAll: () => {
    const els = get().history.present;
    set({ selectedIds: els.map((e) => e.id) });
  },

  clearSelection: () => set({ selectedIds: [] }),

  bringForward: (id) => {
    const state = get();
    const els = [...state.history.present].sort((a, b) => a.zIndex - b.zIndex);
    const idx = els.findIndex((e) => e.id === id);
    if (idx < 0 || idx >= els.length - 1) return;
    [els[idx], els[idx + 1]] = [els[idx + 1], els[idx]];
    const newElements = els.map((e, i) => ({ ...e, zIndex: i }));
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  sendBackward: (id) => {
    const state = get();
    const els = [...state.history.present].sort((a, b) => a.zIndex - b.zIndex);
    const idx = els.findIndex((e) => e.id === id);
    if (idx <= 0) return;
    [els[idx], els[idx - 1]] = [els[idx - 1], els[idx]];
    const newElements = els.map((e, i) => ({ ...e, zIndex: i }));
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  bringToFront: (id) => {
    const state = get();
    const els = [...state.history.present].sort((a, b) => a.zIndex - b.zIndex);
    const idx = els.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const [el] = els.splice(idx, 1);
    els.push(el);
    const newElements = els.map((e, i) => ({ ...e, zIndex: i }));
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  sendToBack: (id) => {
    const state = get();
    const els = [...state.history.present].sort((a, b) => a.zIndex - b.zIndex);
    const idx = els.findIndex((e) => e.id === id);
    if (idx < 0) return;
    const [el] = els.splice(idx, 1);
    els.unshift(el);
    const newElements = els.map((e, i) => ({ ...e, zIndex: i }));
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      updatedAt: Date.now(),
    });
  },

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(5, zoom)) }),

  setPan: (x, y) => set({ panX: x, panY: y }),

  zoomTo: (zoom, cx, cy) => {
    const state = get();
    const newZoom = Math.max(0.1, Math.min(5, zoom));
    // Keep cursor point stable
    const wx = (cx - state.panX) / state.zoom;
    const wy = (cy - state.panY) / state.zoom;
    set({ zoom: newZoom, panX: cx - wx * newZoom, panY: cy - wy * newZoom });
  },

  undo: () => {
    const state = get();
    const newHistory = undoHistory(state.history);
    set({
      history: newHistory,
      elements: newHistory.present,
      selectedIds: [],
      updatedAt: Date.now(),
    });
  },

  redo: () => {
    const state = get();
    const newHistory = redoHistory(state.history);
    set({
      history: newHistory,
      elements: newHistory.present,
      selectedIds: [],
      updatedAt: Date.now(),
    });
  },

  canUndo: () => get().history.past.length > 0,
  canRedo: () => get().history.future.length > 0,

  copy: () => {
    const state = get();
    const copies = state.selectedIds
      .map((id) => state.history.present.find((e) => e.id === id))
      .filter(Boolean) as Element[];
    set({ clipboard: copies });
  },

  paste: () => {
    const state = get();
    if (state.clipboard.length === 0) return;
    let zBase = state.history.present.length;
    const copies = state.clipboard.map((el) => ({
      ...el,
      id: genId(),
      x: el.x + 20,
      y: el.y + 20,
      zIndex: zBase++,
    }));
    const newElements = [...state.history.present, ...copies];
    set({
      history: pushHistory(state.history, newElements),
      elements: newElements,
      selectedIds: copies.map((c) => c.id),
      updatedAt: Date.now(),
    });
  },

  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
  toggleSnap: () => set((s) => ({ snapToGrid: !s.snapToGrid })),
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      return { theme: next };
    }),

  setCanvasName: (name) => set({ canvasName: name, updatedAt: Date.now() }),

  loadCanvas: (canvas) => {
    set({
      canvasId: canvas.id,
      canvasName: canvas.name,
      canvasVersion: canvas.version,
      createdAt: canvas.createdAt,
      updatedAt: canvas.updatedAt,
      history: createHistory(canvas.elements),
      elements: canvas.elements,
      zoom: canvas.zoom,
      panX: canvas.panX,
      panY: canvas.panY,
      selectedIds: [],
    });
  },

  newCanvas: () => {
    set({
      canvasId: genId(),
      canvasName: "Untitled Diagram",
      canvasVersion: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: createHistory([]),
      elements: [],
      selectedIds: [],
      zoom: 1,
      panX: 0,
      panY: 0,
    });
  },

  setSaveStatus: (status) => set({ saveStatus: status }),

  getCanvasData: () => {
    const s = get();
    return {
      id: s.canvasId,
      name: s.canvasName,
      version: s.canvasVersion,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      elements: s.history.present,
      zoom: s.zoom,
      panX: s.panX,
      panY: s.panY,
    };
  },

  getSelectedElement: () => {
    const s = get();
    if (s.selectedIds.length === 0) return null;
    return s.history.present.find((e) => e.id === s.selectedIds[0]) ?? null;
  },
}));

// Export snap helper for components
export function snapValue(
  v: number,
  enabled: boolean,
  size: number = 20,
): number {
  return snap(v, size, enabled);
}
