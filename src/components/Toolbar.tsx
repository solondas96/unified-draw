import React, { useRef, useState } from "react";
import { useStore } from "../store";
import type { ToolType } from "../types";
import { exportToJSON, exportToPNG, exportToSVG, importFromJSON } from "../utils/exportImport";

import {
  MousePointer,
  Hand,
  Pencil,
  Square,
  Circle,
  Diamond,
  ArrowRight,
  Minus,
  Type,
  GitCommit,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Magnet,
  FolderOpen,
  FilePlus,
  Download,
  Upload,
  Image,
  FileCode,
  Layers,
  Sliders,
  Shapes,
  Sun,
  Moon,
} from "lucide-react";

/**
 * The top navigation and tool selection bar.
 * Handles tool switching, canvas title editing, theme toggling,
 * and triggering canvas load/export modals.
 * 
 * @param props - Component properties containing modal and canvas callbacks.
 */
export const Toolbar: React.FC<{
  onOpenCanvasModal: () => void;
  getStageRef: () => any;
}> = ({ onOpenCanvasModal, getStageRef }) => {
  const {
    canvasName,
    setCanvasName,
    tool,
    setTool,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    zoomTo,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    newCanvas,
    loadCanvas,
    getCanvasData,
    sidebarTab,
    setSidebarTab,
    theme,
    toggleTheme,
  } = useStore();

  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const canvas = await importFromJSON(file);
      loadCanvas(canvas);
      setIsFileMenuOpen(false);
    } catch (err: any) {
      alert("Failed to import diagram: " + err.message);
    }
  };

  const tools: { type: ToolType; label: string; icon: React.ReactNode }[] = [
    { type: "select", label: "Select (V)", icon: <MousePointer className="w-4 h-4" /> },
    { type: "pan", label: "Pan (H / Space)", icon: <Hand className="w-4 h-4" /> },
    { type: "freehand", label: "Draw (P)", icon: <Pencil className="w-4 h-4" /> },
    { type: "rectangle", label: "Rectangle (R)", icon: <Square className="w-4 h-4" /> },
    { type: "circle", label: "Circle (C)", icon: <Circle className="w-4 h-4" /> },
    { type: "diamond", label: "Diamond (D)", icon: <Diamond className="w-4 h-4" /> },
    { type: "arrow", label: "Arrow (A)", icon: <ArrowRight className="w-4 h-4" /> },
    { type: "line", label: "Line (L)", icon: <Minus className="w-4 h-4" /> },
    { type: "text", label: "Text (T)", icon: <Type className="w-4 h-4" /> },
    { type: "connector", label: "Connector (X)", icon: <GitCommit className="w-4 h-4" /> },
  ];

  const isDark = theme === "dark";

  return (
    <header
      className="absolute top-4 left-0 w-full px-4 flex items-start justify-between select-none z-30 pointer-events-none"
    >
      {/* ── Left: Logo & Title ─────────────────────────────────────── */}
      <div 
        className="flex items-center gap-3 p-2 rounded-xl pointer-events-auto transition-all"
        style={{
          background: "var(--surface-base)",
          border: "1.5px solid var(--border-subtle)",
          boxShadow: isDark
            ? "0 4px 12px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Logo mark */}
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 2px 10px rgba(99,102,241,0.4)",
            }}
          >
            ✦
          </div>
          <span
            className="font-bold text-[15px] tracking-tight"
            style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            UnifiedDraw
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-5 w-px mx-1"
          style={{ background: "var(--border-medium)" }}
        />

        {/* Canvas editable title */}
        <input
          type="text"
          value={canvasName}
          onChange={(e) => setCanvasName(e.target.value)}
          className="text-sm font-medium outline-none rounded-md px-2 py-1 w-44 transition-all"
          style={{
            background: "transparent",
            color: "var(--text-primary)",
            border: "1.5px solid transparent",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.background = "var(--surface-raised)";
            (e.target as HTMLInputElement).style.borderColor = "var(--border-medium)";
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.background = "transparent";
            (e.target as HTMLInputElement).style.borderColor = "transparent";
          }}
          placeholder="Untitled Diagram"
        />

        {/* File dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFileMenuOpen(!isFileMenuOpen)}
            className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md transition-all font-medium"
            style={{
              background: "var(--surface-raised)",
              color: "var(--text-secondary)",
              border: "1.5px solid var(--border-subtle)",
            }}
          >
            <span>File</span>
            <span className="text-[10px] opacity-60">▼</span>
          </button>

          {isFileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsFileMenuOpen(false)}
              />
              <div
                className="absolute top-full left-0 mt-1.5 w-56 rounded-xl shadow-2xl py-1.5 text-xs z-50"
                style={{
                  background: "var(--surface-raised)",
                  border: "1.5px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  boxShadow: isDark
                    ? "0 16px 48px rgba(0,0,0,0.6)"
                    : "0 8px 32px rgba(0,0,0,0.14)",
                }}
              >
                <FileMenuItem
                  icon={<FilePlus className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />}
                  label="New Diagram"
                  onClick={() => {
                    if (confirm("Create a new diagram?")) { newCanvas(); setIsFileMenuOpen(false); }
                  }}
                />
                <FileMenuItem
                  icon={<FolderOpen className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />}
                  label="Open Saved Diagrams…"
                  onClick={() => { onOpenCanvasModal(); setIsFileMenuOpen(false); }}
                />
                <div className="h-px mx-2 my-1" style={{ background: "var(--border-subtle)" }} />
                <FileMenuItem
                  icon={<Upload className="w-3.5 h-3.5" style={{ color: "#6366f1" }} />}
                  label="Import JSON…"
                  onClick={() => fileInputRef.current?.click()}
                />
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
                <FileMenuItem
                  icon={<Download className="w-3.5 h-3.5" style={{ color: "#10b981" }} />}
                  label="Export JSON"
                  onClick={() => { exportToJSON(getCanvasData()); setIsFileMenuOpen(false); }}
                />
                <FileMenuItem
                  icon={<Image className="w-3.5 h-3.5" style={{ color: "#8b5cf6" }} />}
                  label="Export PNG Image"
                  onClick={() => { exportToPNG(getStageRef(), canvasName); setIsFileMenuOpen(false); }}
                />
                <FileMenuItem
                  icon={<FileCode className="w-3.5 h-3.5" style={{ color: "#ec4899" }} />}
                  label="Export SVG Vector"
                  onClick={() => { exportToSVG(getStageRef(), canvasName); setIsFileMenuOpen(false); }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Center: Drawing Tools ──────────────────────────────────── */}
      <div
        className="flex items-center p-1 rounded-xl gap-0.5 pointer-events-auto transition-all"
        style={{
          background: "var(--surface-base)",
          border: "1.5px solid var(--border-subtle)",
          boxShadow: isDark
            ? "0 4px 12px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {tools.map((t) => {
          const isActive = tool === t.type;
          return (
            <button
              key={t.type}
              onClick={() => setTool(t.type)}
              title={t.label}
              className="p-2 rounded-lg text-xs flex items-center justify-center transition-all"
              style={
                isActive
                  ? {
                      background: "var(--accent)",
                      color: "#fff",
                      boxShadow: "0 2px 10px var(--accent-glow)",
                    }
                  : {
                      color: "var(--text-muted)",
                    }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }
              }}
            >
              {t.icon}
            </button>
          );
        })}
      </div>

      {/* ── Right: Controls + Theme Toggle ────────────────────────── */}
      <div 
        className="flex items-center gap-2 pointer-events-auto p-1.5 rounded-xl transition-all"
        style={{
          background: "var(--surface-base)",
          border: "1.5px solid var(--border-subtle)",
          boxShadow: isDark
            ? "0 4px 12px rgba(0,0,0,0.4)"
            : "0 4px 12px rgba(0,0,0,0.08)",
        }}
      >
        {/* Undo / Redo */}
        <ToolGroup>
          <ToolBtn onClick={undo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
            <Undo2 className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn onClick={redo} disabled={!canRedo()} title="Redo (Ctrl+Y / Ctrl+Shift+Z)">
            <Redo2 className="w-4 h-4" />
          </ToolBtn>
        </ToolGroup>

        {/* Zoom controls */}
        <ToolGroup>
          <ToolBtn onClick={() => setZoom(zoom - 0.1)} title="Zoom Out">
            <ZoomOut className="w-3.5 h-3.5" />
          </ToolBtn>
          <span
            onClick={() => zoomTo(1, window.innerWidth / 2, window.innerHeight / 2)}
            title="Click to reset zoom"
            className="px-2 text-xs font-mono cursor-pointer"
            style={{ color: "var(--text-secondary)" }}
          >
            {Math.round(zoom * 100)}%
          </span>
          <ToolBtn onClick={() => setZoom(zoom + 0.1)} title="Zoom In">
            <ZoomIn className="w-3.5 h-3.5" />
          </ToolBtn>
          <div className="w-px h-4 mx-0.5" style={{ background: "var(--border-medium)" }} />
          <ToolBtn
            onClick={() => zoomTo(1, window.innerWidth / 2, window.innerHeight / 2)}
            title="Reset to 100%"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </ToolBtn>
        </ToolGroup>

        {/* Grid & Snap */}
        <ToolGroup>
          <ToolBtn
            onClick={toggleGrid}
            title={showGrid ? "Hide Grid" : "Show Grid"}
            active={showGrid}
          >
            <Grid className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            onClick={toggleSnap}
            title={snapToGrid ? "Snap ON" : "Snap OFF"}
            active={snapToGrid}
            activeColor="#f59e0b"
          >
            <Magnet className="w-4 h-4" />
          </ToolBtn>
        </ToolGroup>

        {/* Sidebar tabs */}
        <ToolGroup>
          <ToolBtn
            onClick={() => setSidebarTab("library")}
            title="Shape Library"
            active={sidebarTab === "library"}
          >
            <Shapes className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => setSidebarTab("inspector")}
            title="Inspector"
            active={sidebarTab === "inspector"}
          >
            <Sliders className="w-4 h-4" />
          </ToolBtn>
          <ToolBtn
            onClick={() => setSidebarTab("layers")}
            title="Layers"
            active={sidebarTab === "layers"}
          >
            <Layers className="w-4 h-4" />
          </ToolBtn>
        </ToolGroup>

        {/* ── Dark / Light mode toggle ──────────────────────────── */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: isDark ? "var(--surface-active)" : "var(--surface-raised)",
            border: "1.5px solid var(--border-medium)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-medium)";
            (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)";
          }}
        >
          {/* Toggle track */}
          <span
            className="relative inline-block transition-all"
            style={{ width: 34, height: 20 }}
            aria-hidden
          >
            <span
              className="absolute inset-0 rounded-full transition-colors"
              style={{
                background: isDark ? "var(--surface-hover)" : "var(--accent)",
                border: "1.5px solid var(--border-medium)",
              }}
            />
            <span
              className="absolute top-0.5 transition-all duration-300"
              style={{
                left: isDark ? 2 : "calc(100% - 18px)",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: isDark ? "#a8b4d0" : "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
              }}
            />
          </span>

          {isDark ? (
            <Moon className="w-3.5 h-3.5" style={{ color: "#a8b4d0" }} />
          ) : (
            <Sun className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
          )}
          <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
        </button>
      </div>
    </header>
  );
};

/* ── Helper sub-components ─────────────────────────────────────────── */

const FileMenuItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors rounded-lg mx-1 my-0.5 text-xs"
    style={{ width: "calc(100% - 8px)" }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.background = "transparent";
    }}
  >
    {icon}
    <span style={{ color: "var(--text-primary)" }}>{label}</span>
  </button>
);

const ToolGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    className="flex items-center p-0.5 rounded-lg gap-0.5"
    style={{
      background: "var(--surface-raised)",
      border: "1.5px solid var(--border-subtle)",
    }}
  >
    {children}
  </div>
);

const ToolBtn: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  active?: boolean;
  activeColor?: string;
  children: React.ReactNode;
}> = ({ onClick, disabled, title, active, activeColor = "var(--accent)", children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    className="p-1.5 rounded transition-all"
    style={
      active
        ? {
            background: "var(--accent-subtle)",
            color: activeColor,
          }
        : {
            color: "var(--text-muted)",
          }
    }
    onMouseEnter={(e) => {
      if (!disabled && !active) {
        (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
        (e.currentTarget as HTMLButtonElement).style.color =
          disabled ? "var(--text-muted)" : "var(--text-muted)";
        (e.currentTarget as HTMLButtonElement).style.opacity = disabled ? "0.3" : "1";
      }
    }}
    onMouseDown={(e) => {
      (e.currentTarget as HTMLButtonElement).style.opacity = "1";
    }}
  >
    {children}
  </button>
);
