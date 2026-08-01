import React, { useState } from "react";
import { useStore } from "../store";
import { CheckCircle2, RefreshCw, Keyboard, X } from "lucide-react";

export const StatusBar: React.FC = () => {
  const { elements, selectedIds, zoom, saveStatus } = useStore();
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const shortcuts = [
    { key: "V", desc: "Select Tool" },
    { key: "H / Space", desc: "Pan Hand Tool" },
    { key: "P", desc: "Freehand Pencil" },
    { key: "R", desc: "Rectangle" },
    { key: "C", desc: "Circle" },
    { key: "D", desc: "Diamond" },
    { key: "A", desc: "Arrow" },
    { key: "T", desc: "Text" },
    { key: "Ctrl + Z", desc: "Undo" },
    { key: "Ctrl + Y", desc: "Redo" },
    { key: "Ctrl + C / V", desc: "Copy & Paste" },
    { key: "Ctrl + D", desc: "Duplicate" },
    { key: "Del / Backspace", desc: "Delete selected" },
    { key: "Double Click", desc: "Edit text inline" },
  ];

  return (
    <>
      <footer
        className="h-7 text-[11px] px-4 flex items-center justify-between select-none z-30 font-mono"
        style={{
          background: "var(--surface-raised)",
          borderTop: "1.5px solid var(--border-subtle)",
          color: "var(--text-muted)",
        }}
      >
        {/* Left: View & Selection state */}
        <div className="flex items-center gap-4">
          <span>Zoom: {Math.round(zoom * 100)}%</span>
          <span>Elements: {elements.length}</span>
          {selectedIds.length > 0 && (
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              Selected: {selectedIds.length}
            </span>
          )}
        </div>

        {/* Right: Auto-save badge & Shortcuts */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            {saveStatus === "saving" ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" style={{ color: "var(--warning)" }} />
                <span style={{ color: "var(--warning)" }}>Saving…</span>
              </>
            ) : saveStatus === "saved" ? (
              <>
                <CheckCircle2 className="w-3 h-3" style={{ color: "var(--success)" }} />
                <span style={{ color: "var(--success)" }}>Saved</span>
              </>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>Auto-save ready</span>
            )}
          </div>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="flex items-center gap-1 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
          >
            <Keyboard className="w-3 h-3" style={{ color: "var(--accent)" }} />
            <span>Shortcuts</span>
          </button>
        </div>
      </footer>

      {/* Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div
            className="rounded-2xl shadow-2xl w-full max-w-md p-5 font-sans"
            style={{
              background: "var(--surface-raised)",
              border: "1.5px solid var(--border-medium)",
              color: "var(--text-primary)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between pb-3 mb-4"
              style={{ borderBottom: "1.5px solid var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <Keyboard className="w-4 h-4" style={{ color: "var(--accent)" }} />
                <span>Keyboard Shortcuts</span>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 rounded-lg transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-hover)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of shortcuts */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              {shortcuts.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{
                    background: "var(--surface-base)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <span style={{ color: "var(--text-secondary)" }}>{s.desc}</span>
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                    style={{
                      background: "var(--surface-active)",
                      border: "1px solid var(--border-medium)",
                      color: "var(--accent)",
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowShortcutsModal(false)}
              className="mt-5 w-full py-2 rounded-xl text-xs font-semibold text-white transition-all"
              style={{
                background: "var(--accent)",
                boxShadow: "0 2px 12px var(--accent-glow)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)";
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
