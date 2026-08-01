import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { debouncedSave, getLatestCanvas } from "./db";
import { Toolbar } from "./components/Toolbar";
import { CanvasWorkspace, type CanvasWorkspaceRef } from "./components/CanvasWorkspace";
import { Sidebar } from "./components/Sidebar";
import { StatusBar } from "./components/StatusBar";
import { SavedCanvasesModal } from "./components/SavedCanvasesModal";

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
        console.error("Failed to load initial canvas from IndexedDB", e);
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
      className="w-screen h-screen flex flex-col overflow-hidden font-sans"
      style={{
        background: "var(--canvas-bg)",
        color: "var(--text-primary)",
      }}
    >
      {/* Top Navigation Toolbar */}
      <Toolbar
        getStageRef={() => workspaceRef.current?.getStage() ?? null}
        onOpenCanvasModal={() => setIsSavedModalOpen(true)}
      />

      {/* Main Studio Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Interactive Infinite Canvas Workspace */}
        <CanvasWorkspace ref={workspaceRef} />

        {/* Right Docked Sidebar */}
        <Sidebar />
      </div>

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
