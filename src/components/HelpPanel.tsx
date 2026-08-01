import React, { useState } from "react";
import { useStore } from "../store";
import { X, Search } from "lucide-react";

export const HelpPanel: React.FC = () => {
  const { isHelpPanelOpen, setHelpPanelOpen } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  if (!isHelpPanelOpen) return null;

  const shortcuts = [
    { key: "Ctrl+S", desc: "Save diagram" },
    { key: "Ctrl+Z", desc: "Undo last action" },
    { key: "Ctrl+Shift+Z", desc: "Redo action" },
    { key: "Ctrl+C", desc: "Copy selected" },
    { key: "Ctrl+V", desc: "Paste" },
    { key: "Ctrl+D", desc: "Duplicate selected" },
    { key: "Ctrl+A", desc: "Select All" },
    { key: "Delete / Backspace", desc: "Delete selected elements" },
    { key: "Escape", desc: "Deselect all / Cancel" },
    { key: "Arrow Keys", desc: "Nudge selected element by 1px" },
    { key: "Shift + Arrow", desc: "Nudge selected element by 10px" },
    { key: "Ctrl + L", desc: "Lock or unlock selected element" },
    { key: "Ctrl + Shift + ↑", desc: "Bring to front" },
    { key: "Ctrl + Shift + ↓", desc: "Send to back" },
    { key: "/", desc: "Focus search in Shape Library" },
    { key: "H", desc: "Toggle this help panel" },
  ];

  const filteredShortcuts = shortcuts.filter(
    (s) =>
      s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[450px] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
          <h2 className="text-lg font-bold text-slate-100">Keyboard Shortcuts</h2>
          <button
            onClick={() => setHelpPanelOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-800 bg-slate-900">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">
              No shortcuts found for "{searchQuery}"
            </div>
          ) : (
            filteredShortcuts.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 hover:bg-slate-800/50 rounded"
              >
                <span className="text-sm text-slate-300">{s.desc}</span>
                <span className="text-xs font-mono bg-slate-800 border border-slate-700 text-slate-200 px-2 py-1 rounded shadow-sm">
                  {s.key}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
