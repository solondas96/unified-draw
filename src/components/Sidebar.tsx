import React, { useState } from "react";
import { useStore, createDefaultElement, createDefaultTextStyle } from "../store";
import { SHAPE_LIBRARY, getShapeMeta } from "../shapeLibrary";
import type { ShapeType, Element } from "../types";
import { Stage, Layer } from "react-konva";
import { ShapeRenderer } from "../ShapeRenderer";
import {
  Search,
  Shapes,
  Sliders,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";

// ─── SidebarTab: theme-aware tab button ────────────────────────────
const SidebarTab: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    onClick={onClick}
    className="flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all"
    style={
      active
        ? {
            background: "var(--surface-active)",
            color: "var(--accent)",
            fontWeight: 600,
          }
        : {
            color: "var(--text-muted)",
          }
    }
    onMouseEnter={(e) => {
      if (!active) {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
        (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }
    }}
  >
    {icon}
    <span>{label}</span>
    {badge !== undefined && (
      <span
        className="text-[10px] px-1.5 rounded-full font-bold text-white"
        style={{ background: "var(--accent)" }}
      >
        {badge}
      </span>
    )}
  </button>
);

// Helper component for shape preview thumbnails
const SidebarShapeThumbnail: React.FC<{ shapeType: ShapeType }> = ({ shapeType }) => {
  const meta = getShapeMeta(shapeType);
  const size = 44;
  const scale = Math.min((size - 8) / meta.defaultWidth, (size - 8) / meta.defaultHeight);
  const w = meta.defaultWidth * scale;
  const h = meta.defaultHeight * scale;
  const x = (size - w) / 2;
  const y = (size - h) / 2;

  const dummyElement: Element = {
    id: "thumb",
    type: "shape",
    x,
    y,
    width: w,
    height: h,
    rotation: 0,
    shapeType,
    fill: "transparent",
    stroke: "#94a3b8",
    strokeWidth: 1.5,
    zIndex: 0,
    visible: true,
    locked: false,
  };

  return (
    <div
      style={{
        width: 44,
        height: 44,
        background: "var(--surface-raised)",
        border: "1.5px solid var(--border-subtle)",
        borderRadius: 10,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "border-color 0.2s",
      }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)")}
    >
      <Stage width={size} height={size}>
        <Layer>
          <ShapeRenderer element={dummyElement} />
        </Layer>
      </Stage>
    </div>
  );
};

/**
 * The right-hand panel containing the Library, Inspector, and Layers tabs.
 * Allows users to drag in shapes, edit selected element properties, 
 * and manage Z-index layering.
 */
export const Sidebar: React.FC = () => {
  const {
    sidebarTab,
    setSidebarTab,
    elements,
    selectedIds,
    selectElement,
    addElement,
    updateElement,
    deleteSelected,
    duplicateSelected,
    bringForward,
    sendBackward,
    bringToFront,
    sendToBack,
    deleteElements,
    panX,
    panY,
    zoom,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", "Basic", "Arrows", "Flowchart", "Data Engineering"];

  // Filter shapes
  const filteredShapes = SHAPE_LIBRARY.filter((s) => {
    const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase()) || s.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddShape = (shapeType: ShapeType) => {
    const meta = getShapeMeta(shapeType);
    // Center in current viewport
    const cx = (-panX + window.innerWidth / 2) / zoom - meta.defaultWidth / 2;
    const cy = (-panY + window.innerHeight / 2) / zoom - meta.defaultHeight / 2;

    const el = createDefaultElement("shape", shapeType, cx, cy, meta.defaultWidth, meta.defaultHeight);
    el.fill = meta.defaultFill;
    el.stroke = meta.defaultStroke;
    addElement(el);
    selectElement(el.id);
  };

  const selectedElement = selectedIds.length === 1 ? elements.find((e) => e.id === selectedIds[0]) : null;

  // Color preset palette
  const COLOR_PALETTE = [
    "transparent",
    "#1e293b",
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#10b981",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ffffff",
  ];

  return (
    <aside
      className="w-80 flex flex-col select-none z-20 shadow-xl"
      style={{
        background: "var(--surface-base)",
        borderLeft: "1.5px solid var(--border-subtle)",
        color: "var(--text-primary)",
        height: "calc(100vh - 3.5rem - 1.75rem)",
      }}
    >
      {/* Header Tabs */}
      <div
        className="flex p-1"
        style={{
          background: "var(--surface-raised)",
          borderBottom: "1.5px solid var(--border-subtle)",
        }}
      >
        <SidebarTab
          active={sidebarTab === "library"}
          onClick={() => setSidebarTab("library")}
          icon={<Shapes className="w-3.5 h-3.5" />}
          label="Library"
        />
        <SidebarTab
          active={sidebarTab === "inspector"}
          onClick={() => setSidebarTab("inspector")}
          icon={<Sliders className="w-3.5 h-3.5" />}
          label="Inspector"
          badge={selectedIds.length > 0 ? selectedIds.length : undefined}
        />
        <SidebarTab
          active={sidebarTab === "layers"}
          onClick={() => setSidebarTab("layers")}
          icon={<Layers className="w-3.5 h-3.5" />}
          label="Layers"
        />
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* ─── TAB 1: SHAPE LIBRARY ────────────────────────────────── */}
        {sidebarTab === "library" && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search 100+ shapes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                    selectedCategory === cat ? "bg-indigo-600 text-white font-medium" : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Shape Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredShapes.map((item) => (
                <button
                  key={item.type}
                  onClick={() => handleAddShape(item.type)}
                  className="flex items-center space-x-2 p-2 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 hover:border-indigo-500/40 rounded-xl transition-all text-left group"
                >
                  <SidebarShapeThumbnail shapeType={item.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-300 truncate group-hover:text-white">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{item.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── TAB 2: INSPECTOR ────────────────────────────────────── */}
        {sidebarTab === "inspector" && (
          <div>
            {selectedIds.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Sliders className="w-8 h-8 mx-auto opacity-30" />
                <p>No element selected</p>
                <p className="text-[11px] text-slate-600">Click on an element on the canvas to edit properties.</p>
              </div>
            ) : selectedElement ? (
              /* Single Element Property Editor */
              <div className="space-y-5 text-xs">
                {/* Header Info */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="font-semibold text-slate-200 capitalize">
                    {selectedElement.shapeType || selectedElement.type} Element
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={duplicateSelected}
                      title="Duplicate"
                      className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={deleteSelected}
                      title="Delete"
                      className="p-1 hover:bg-red-500/20 rounded text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Geometry */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Transform</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">X Position</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.x)}
                        onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Y Position</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.y)}
                        onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Width</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.width)}
                        onChange={(e) => updateElement(selectedElement.id, { width: Math.max(10, Number(e.target.value)) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Height</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.height)}
                        onChange={(e) => updateElement(selectedElement.id, { height: Math.max(10, Number(e.target.value)) })}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Fill Color */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Fill Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        onClick={() => updateElement(selectedElement.id, { fill: color })}
                        className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                          selectedElement.fill === color ? "border-indigo-400 scale-110 shadow" : "border-slate-700"
                        }`}
                        style={{ backgroundColor: color === "transparent" ? "#0f172a" : color }}
                      >
                        {color === "transparent" && <span className="text-[10px] text-slate-500">∅</span>}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={selectedElement.fill === "transparent" ? "#ffffff" : selectedElement.fill}
                      onChange={(e) => updateElement(selectedElement.id, { fill: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                    />
                  </div>
                </div>

                {/* Stroke Color & Width */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Stroke Color</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_PALETTE.filter((c) => c !== "transparent").map((color) => (
                      <button
                        key={color}
                        onClick={() => updateElement(selectedElement.id, { stroke: color })}
                        className={`w-6 h-6 rounded-md border ${
                          selectedElement.stroke === color ? "border-indigo-400 scale-110 shadow" : "border-slate-700"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedElement.stroke || "#1e293b"}
                      onChange={(e) => updateElement(selectedElement.id, { stroke: e.target.value })}
                      className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer p-0"
                    />
                  </div>

                  <div className="pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Stroke Width</span>
                      <span>{selectedElement.strokeWidth || 2}px</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={selectedElement.strokeWidth || 2}
                      onChange={(e) => updateElement(selectedElement.id, { strokeWidth: Number(e.target.value) })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                </div>

                {/* Aesthetic Roughness (Excalidraw hand-drawn) */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Hand-drawn Aesthetic (Roughness)</span>
                    <span>{(selectedElement.roughness ?? 1) === 0 ? "Clean" : "Rough"}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3"
                    step="1"
                    value={selectedElement.roughness ?? 1}
                    onChange={(e) => updateElement(selectedElement.id, { roughness: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Opacity */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Opacity</span>
                    <span>{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) => updateElement(selectedElement.id, { opacity: Number(e.target.value) })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Text Formatting */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Text Content & Style</label>
                  <textarea
                    rows={2}
                    value={selectedElement.text || ""}
                    onChange={(e) => updateElement(selectedElement.id, { text: e.target.value })}
                    placeholder="Enter text..."
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />

                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-500">Font Size</span>
                      <input
                        type="number"
                        value={selectedElement.textStyle?.fontSize || 16}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            textStyle: {
                              ...createDefaultTextStyle(),
                              ...selectedElement.textStyle,
                              fontSize: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200"
                      />
                    </div>

                    {/* Font Style Toggles */}
                    <div className="flex items-end space-x-1">
                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            textStyle: {
                              ...createDefaultTextStyle(),
                              ...selectedElement.textStyle,
                              fontWeight: selectedElement.textStyle?.fontWeight === "bold" ? "normal" : "bold",
                            },
                          })
                        }
                        className={`p-1.5 border rounded ${
                          selectedElement.textStyle?.fontWeight === "bold"
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() =>
                          updateElement(selectedElement.id, {
                            textStyle: {
                              ...createDefaultTextStyle(),
                              ...selectedElement.textStyle,
                              fontStyle: selectedElement.textStyle?.fontStyle === "italic" ? "normal" : "italic",
                            },
                          })
                        }
                        className={`p-1.5 border rounded ${
                          selectedElement.textStyle?.fontStyle === "italic"
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-slate-950 text-slate-400 border-slate-800"
                        }`}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>

                      {/* Alignment */}
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          key={align}
                          onClick={() =>
                            updateElement(selectedElement.id, {
                              textStyle: {
                                ...createDefaultTextStyle(),
                                ...selectedElement.textStyle,
                                alignment: align,
                              },
                            })
                          }
                          className={`p-1.5 border rounded ${
                            (selectedElement.textStyle?.alignment || "center") === align
                              ? "bg-indigo-600 text-white border-indigo-500"
                              : "bg-slate-950 text-slate-400 border-slate-800"
                          }`}
                        >
                          {align === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                          {align === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                          {align === "right" && <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Layer Ordering */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Layer Order</label>
                  <div className="grid grid-cols-4 gap-1">
                    <button
                      onClick={() => bringToFront(selectedElement.id)}
                      title="Bring to Front"
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center"
                    >
                      <ChevronsUp className="w-4 h-4 text-slate-300" />
                    </button>
                    <button
                      onClick={() => bringForward(selectedElement.id)}
                      title="Bring Forward"
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center"
                    >
                      <ArrowUp className="w-4 h-4 text-slate-300" />
                    </button>
                    <button
                      onClick={() => sendBackward(selectedElement.id)}
                      title="Send Backward"
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center"
                    >
                      <ArrowDown className="w-4 h-4 text-slate-300" />
                    </button>
                    <button
                      onClick={() => sendToBack(selectedElement.id)}
                      title="Send to Back"
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded flex items-center justify-center"
                    >
                      <ChevronsDown className="w-4 h-4 text-slate-300" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Multi Selection Property Editor */
              <div className="space-y-4 text-xs">
                <div className="font-semibold text-slate-200 pb-2 border-b border-slate-800">
                  {selectedIds.length} Elements Selected
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={duplicateSelected}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate All</span>
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="flex-1 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center justify-center space-x-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete All</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 3: LAYERS ───────────────────────────────────────── */}
        {sidebarTab === "layers" && (
          <div className="space-y-2">
            {elements.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                No elements in canvas.
              </div>
            ) : (
              [...elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((el) => {
                  const isSelected = selectedIds.includes(el.id);
                  const label = el.text || el.shapeType || el.type;

                  return (
                    <div
                      key={el.id}
                      onClick={(e) => selectElement(el.id, e.shiftKey)}
                      className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-950/60 border-indigo-500 text-white font-medium"
                          : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate pr-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500/80" />
                        <span className="truncate capitalize">{label}</span>
                      </div>

                      <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => updateElement(el.id, { visible: !el.visible })}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400"
                        >
                          {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>

                        <button
                          onClick={() => updateElement(el.id, { locked: !el.locked })}
                          className="p-1 hover:bg-slate-800 rounded text-slate-400"
                        >
                          {el.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => deleteElements([el.id])}
                          className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
