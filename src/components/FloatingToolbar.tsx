import React, { useEffect, useState } from "react";
import { useStore, saveDefaultTextStyle } from "../store";
import {
  Copy,
  ClipboardPaste,
  Bold,
  Italic,
  Underline,
  Type,
} from "lucide-react";
import type { Element } from "../types";

export const FloatingToolbar: React.FC = () => {
  const {
    elements,
    selectedIds,
    zoom,
    panX,
    panY,
    updateElement,
    copy,
    paste,
  } = useStore();
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );

  // Derive selected element if exactly one text-capable element is selected, or handle multiple
  const selectedElements = elements.filter((e) => selectedIds.includes(e.id));

  useEffect(() => {
    if (selectedElements.length === 0) {
      setPosition(null);
      return;
    }

    // Calculate bounding box of all selected elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;

    selectedElements.forEach((el) => {
      if (el.x < minX) minX = el.x;
      if (el.y < minY) minY = el.y;
      if (el.x + el.width > maxX) maxX = el.x + el.width;
    });

    // Toolbar should be positioned above the top-center of the bounding box
    const centerX = minX + (maxX - minX) / 2;

    // Apply zoom and pan
    const screenX = centerX * zoom + panX;
    const screenY = minY * zoom + panY - 60; // 60px above the element

    setPosition({ x: screenX, y: screenY });
  }, [selectedElements, zoom, panX, panY]);

  if (!position || selectedElements.length === 0) return null;

  // We primarily style the first selected element, but apply to all
  const primary = selectedElements[0];
  const ts = primary.textStyle;
  const isTextLike = primary.type === "text" || primary.type === "shape";

  const handleUpdate = (updates: Partial<Element>) => {
    if (updates.textStyle) saveDefaultTextStyle(updates.textStyle);
    selectedIds.forEach((id) => updateElement(id, updates));
  };

  const safeMenuX = Math.max(
    20,
    Math.min(position.x - 200, window.innerWidth - 450),
  ); // Approximate centering
  const safeMenuY = Math.max(60, position.y); // Keep below top toolbar

  return (
    <div
      className="fixed z-50 flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1.5 space-x-2 animate-fade-in pointer-events-auto"
      style={{
        left: safeMenuX,
        top: safeMenuY,
      }}
    >
      {/* Basic Actions */}
      <div className="flex items-center space-x-1 border-r border-slate-700 pr-2">
        <button
          onClick={copy}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          title="Copy"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={paste}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded"
          title="Paste"
        >
          <ClipboardPaste className="w-4 h-4" />
        </button>
      </div>

      {isTextLike && (
        <>
          {/* Typography */}
          <div className="flex items-center space-x-1 border-r border-slate-700 pr-2 pl-1">
            <select
              value={ts?.fontFamily || "Virgil,Segoe UI,cursive"}
              onChange={(e) =>
                handleUpdate({
                  textStyle: { ...ts!, fontFamily: e.target.value },
                })
              }
              className="bg-transparent text-xs text-slate-200 border-none outline-none focus:ring-0 cursor-pointer hover:bg-slate-800 rounded p-1 w-24 truncate"
            >
              <option value="Virgil,Segoe UI,cursive">Virgil</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="monospace">Mono</option>
              <option value="serif">Serif</option>
            </select>

            <input
              type="number"
              min="8"
              max="120"
              value={ts?.fontSize || 16}
              onChange={(e) =>
                handleUpdate({
                  textStyle: { ...ts!, fontSize: Number(e.target.value) },
                })
              }
              className="w-12 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-xs text-slate-200"
            />
          </div>

          {/* Style Toggles */}
          <div className="flex items-center space-x-1 border-r border-slate-700 pr-2 pl-1">
            <button
              onClick={() =>
                handleUpdate({
                  textStyle: {
                    ...ts!,
                    fontWeight: ts?.fontWeight === "bold" ? "normal" : "bold",
                  },
                })
              }
              className={`p-1.5 rounded ${ts?.fontWeight === "bold" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                handleUpdate({
                  textStyle: {
                    ...ts!,
                    fontStyle: ts?.fontStyle === "italic" ? "normal" : "italic",
                  },
                })
              }
              className={`p-1.5 rounded ${ts?.fontStyle === "italic" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                handleUpdate({
                  textStyle: {
                    ...ts!,
                    textDecoration:
                      ts?.textDecoration === "underline" ? "none" : "underline",
                  },
                })
              }
              className={`p-1.5 rounded ${ts?.textDecoration === "underline" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            >
              <Underline className="w-4 h-4" />
            </button>
          </div>

          {/* Text Color (Popover) */}
          <div className="flex items-center space-x-1 pl-1 relative group">
            <button className="flex items-center space-x-1 p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded">
              <Type className="w-4 h-4" />
              <div
                className="w-3 h-3 rounded-full border border-slate-600"
                style={{ backgroundColor: ts?.color || "#ffffff" }}
              />
            </button>
            {/* Simple hover popover for colors */}
            <div className="absolute top-full left-0 mt-2 hidden group-hover:flex bg-slate-800 p-2 rounded shadow-xl border border-slate-700 gap-1 z-50">
              {COLOR_PALETTE.map((c: string) => (
                <button
                  key={c}
                  onClick={() =>
                    handleUpdate({ textStyle: { ...ts!, color: c } })
                  }
                  className="w-5 h-5 rounded-sm border border-slate-600 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: c === "transparent" ? "#0f172a" : c,
                  }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
