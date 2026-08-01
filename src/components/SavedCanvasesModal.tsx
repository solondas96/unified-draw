import React, { useEffect, useState } from "react";
import { listCanvases, deleteCanvas as deleteCanvasFromDB } from "../db";
import type { Canvas } from "../types";
import { useStore } from "../store";
import { FolderOpen, Trash2, X, Clock, Layers } from "lucide-react";

interface SavedCanvasesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SavedCanvasesModal: React.FC<SavedCanvasesModalProps> = ({ isOpen, onClose }) => {
  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const { loadCanvas, canvasId } = useStore();

  useEffect(() => {
    if (isOpen) {
      listCanvases().then(setCanvases);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCanvas = (c: Canvas) => {
    loadCanvas(c);
    onClose();
  };

  const handleDeleteCanvas = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved diagram?")) {
      await deleteCanvasFromDB(id);
      setCanvases(canvases.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 font-semibold text-base">
            <FolderOpen className="w-5 h-5 text-amber-400" />
            <span>Saved Diagrams (IndexedDB)</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 max-h-80 overflow-y-auto space-y-2 custom-scrollbar">
          {canvases.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No saved diagrams found in browser storage.
            </div>
          ) : (
            canvases.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectCanvas(c)}
                className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  c.id === canvasId
                    ? "bg-indigo-950/60 border-indigo-500 text-white font-medium"
                    : "bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                <div>
                  <div className="font-semibold text-sm text-slate-200">{c.name}</div>
                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{new Date(c.updatedAt).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{c.elements.length} elements</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {c.id === canvasId && (
                    <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Current
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDeleteCanvas(c.id, e)}
                    className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
