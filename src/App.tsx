import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { debouncedSave, getLatestCanvas } from "./db";
import { Toolbar } from "./components/Toolbar";
import { CanvasWorkspace, type CanvasWorkspaceRef } from "./components/CanvasWorkspace";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { SavedCanvasesModal } from "./components/SavedCanvasesModal";

/**
 * Main application entry point for UnifiedDraw.
 * Manages global layout, handles initialization from IndexedDB,
 * sets up the debounced auto-save effect, and orchestrates the core components.
 */
export function App() {
  const {
    getCanvasData,
    loadCanvas,
    setSaveStatus,
    elements,
    canvasName,
    zoom,
    panX,
    panY,
    theme,
  } = useStore();

  const workspaceRef = useRef<CanvasWorkspaceRef | null>(null);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sync data-theme on html element on mount and whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Initial load from IndexedDB on startup
  useEffect(() => {
    async function init() {
      try {
        const latest = await getLatestCanvas();
        if (latest && latest.elements) {
          loadCanvas(latest);
        }
      } catch (e) {
        console.error("Failed to load initial canvas from IndexedDB. Starting with empty canvas.", e);
        alert("Could not load your saved diagrams. You may be in Private Browsing mode or local storage is disabled.");
      } finally {
        setIsInitialized(true);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time debounced auto-save
  useEffect(() => {
    if (!isInitialized) return;
    const canvasData = getCanvasData();
    debouncedSave(canvasData, setSaveStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, canvasName, zoom, panX, panY, isInitialized]);

  return (
    <div
      className="w-screen h-screen overflow-hidden font-sans bg-dots relative"
      style={{
        background: "var(--canvas-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Interactive Infinite Canvas Workspace (Absolute full screen) */}
      <div className="absolute inset-0 z-0">
        <CanvasWorkspace ref={workspaceRef} />
      </div>

      {/* Top Navigation Toolbar (Floating absolute) */}
      <Toolbar
        getStageRef={() => workspaceRef.current?.getStage() ?? null}
        onOpenCanvasModal={() => setIsSavedModalOpen(true)}
      />

      {/* Floating Properties Panel (Absolute right) */}
      <Sidebar />

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Saved Diagrams Modal */}
      <SavedCanvasesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
      />
    </div>
  );
}

export default App;
