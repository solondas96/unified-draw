import {
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Stage, Layer, Transformer, Rect as KonvaRect } from "react-konva";
import Konva from "konva";
import { useStore, createDefaultElement, snapValue } from "../store";
import type { Element, ShapeType } from "../types";
import {
  ShapeRenderer,
  FreehandRenderer,
  ConnectorRenderer,
  TextElementRenderer,
} from "../ShapeRenderer";
import { getShapeMeta } from "../shapeLibrary";

export interface CanvasWorkspaceRef {
  getStage: () => Konva.Stage | null;
}

const SHAPE_DRAW_TOOLS = new Set([
  "rectangle",
  "circle",
  "diamond",
  "ellipse",
  "line",
  "arrow",
]);

export const CanvasWorkspace = forwardRef<CanvasWorkspaceRef, {}>(
  (_props, ref) => {
    const {
      elements,
      selectedIds,
      selectElement,
      selectElements,
      clearSelection,
      selectAll,
      tool,
      setTool,
      addElement,
      updateElement,
      deleteSelected,
      duplicateSelected,
      copy,
      paste,
      undo,
      redo,
      zoom,
      panX,
      panY,
      setPan,
      zoomTo,
      showGrid,
      snapToGrid,
      gridSize,
      theme,
    } = useStore();

    const stageRef = useRef<Konva.Stage | null>(null);
    const layerRef = useRef<Konva.Layer | null>(null);
    const trRef = useRef<Konva.Transformer | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Map of element id → Konva.Node for Transformer binding
    const nodeRefs = useRef<Map<string, Konva.Node>>(new Map());

    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // ── Pan state ─────────────────────────────────────────────────────
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0 });
    const [spaceDown, setSpaceDown] = useState(false);

    // ── Click+drag shape creation ─────────────────────────────────────
    const [isCreating, setIsCreating] = useState(false);
    const createStartRef = useRef({ x: 0, y: 0 });
    const [createPreview, setCreatePreview] = useState<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(null);

    // ── Rubber-band (marquee) selection ───────────────────────────────
    const [isRubberBand, setIsRubberBand] = useState(false);
    const rubberBandStartRef = useRef({ x: 0, y: 0 });
    const [rubberBand, setRubberBand] = useState<{
      x: number;
      y: number;
      w: number;
      h: number;
    } | null>(null);

    // ── Freehand drawing ──────────────────────────────────────────────
    const isDrawingFreehandRef = useRef(false);
    const freehandPointsRef = useRef<number[]>([]);
    const freehandKonvaLineRef = useRef<Konva.Line | null>(null);

    // ── Connector drawing ─────────────────────────────────────────────
    const [connectorSource, setConnectorSource] = useState<string | null>(null);

    // ── Inline text editing ────────────────────────────────────────────
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");

    useImperativeHandle(ref, () => ({ getStage: () => stageRef.current }));

    // ── Resize observer ───────────────────────────────────────────────
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const obs = new ResizeObserver(() => {
        setDimensions({ width: el.clientWidth, height: el.clientHeight });
      });
      obs.observe(el);
      setDimensions({ width: el.clientWidth, height: el.clientHeight });
      return () => obs.disconnect();
    }, []);

    // ── Sync Konva Transformer with selection ─────────────────────────
    useEffect(() => {
      if (!trRef.current) return;
      const selectedNodes: Konva.Node[] = [];
      selectedIds.forEach((id) => {
        const el = elements.find((e) => e.id === id);
        // Only attach transformer to shape/text nodes (not freehand/connector)
        if (el && el.type !== "freehand" && el.type !== "connector") {
          const node = nodeRefs.current.get(id);
          if (node) selectedNodes.push(node);
        }
      });
      trRef.current.nodes(selectedNodes);
      trRef.current.getLayer()?.batchDraw();
    }, [selectedIds, elements]);

    // ── Keyboard shortcuts ────────────────────────────────────────────
    useEffect(() => {
      const onKeyDown = (e: KeyboardEvent) => {
        const inInput = ["INPUT", "TEXTAREA"].includes(
          (e.target as HTMLElement).tagName
        );

        if (e.code === "Space" && !inInput) {
          e.preventDefault();
          setSpaceDown(true);
          return;
        }
        if (inInput) return;

        const ctrl = e.metaKey || e.ctrlKey;

        if (ctrl && e.key.toLowerCase() === "z") {
          e.preventDefault();
          e.shiftKey ? redo() : undo();
        } else if (ctrl && e.key.toLowerCase() === "y") {
          e.preventDefault();
          redo();
        } else if (ctrl && e.key.toLowerCase() === "c") {
          e.preventDefault();
          copy();
        } else if (ctrl && e.key.toLowerCase() === "v") {
          e.preventDefault();
          paste();
        } else if (ctrl && e.key.toLowerCase() === "d") {
          e.preventDefault();
          duplicateSelected();
        } else if (ctrl && e.key.toLowerCase() === "a") {
          e.preventDefault();
          selectAll();
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          deleteSelected();
        } else if (e.key === "Escape") {
          clearSelection();
          setTool("select");
          setConnectorSource(null);
          setIsCreating(false);
          setCreatePreview(null);
          setIsRubberBand(false);
          setRubberBand(null);
          if (editingId) finishEditing();
        } else if (!ctrl) {
          const k = e.key.toLowerCase();
          if (k === "v") setTool("select");
          else if (k === "h") setTool("pan");
          else if (k === "p") setTool("freehand");
          else if (k === "r") setTool("rectangle");
          else if (k === "c") setTool("circle");
          else if (k === "d") setTool("diamond");
          else if (k === "a") setTool("arrow");
          else if (k === "l") setTool("line");
          else if (k === "t") setTool("text");
          else if (k === "x") setTool("connector");
        }
      };

      const onKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") setSpaceDown(false);
      };

      window.addEventListener("keydown", onKeyDown);
      window.addEventListener("keyup", onKeyUp);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
        window.removeEventListener("keyup", onKeyUp);
      };
    }, [
      undo,
      redo,
      copy,
      paste,
      duplicateSelected,
      selectAll,
      deleteSelected,
      clearSelection,
      setTool,
      editingId,
    ]);

    // ── Utility: get pointer position in world/canvas space ───────────
    const getWorldPos = (): { x: number; y: number } => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };
      // Konva's getRelativePointerPosition accounts for stage x/y/scaleX/scaleY
      return stage.getRelativePointerPosition() ?? { x: 0, y: 0 };
    };

    const snapPos = (x: number, y: number) => ({
      x: snapValue(x, snapToGrid, gridSize),
      y: snapValue(y, snapToGrid, gridSize),
    });

    // Walk up Konva node tree to find a node with an element id
    const findElementNode = (node: Konva.Node): string | null => {
      let current: Konva.Node | null = node;
      while (current) {
        const id = current.id();
        if (id && elements.some((el) => el.id === id)) return id;
        current = current.parent as Konva.Node | null;
      }
      return null;
    };

    // ── Mouse Down ────────────────────────────────────────────────────
    const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      const isStageTarget =
        e.target === stage || e.target.name() === "canvas-bg";

      // ── Pan (Space key, Hand tool, or Middle mouse button) ──────────
      if (spaceDown || tool === "pan" || e.evt.button === 1) {
        setIsPanning(true);
        panStartRef.current = {
          x: e.evt.clientX - panX,
          y: e.evt.clientY - panY,
        };
        return;
      }

      // ── Freehand drawing ────────────────────────────────────────────
      if (tool === "freehand") {
        const pos = getWorldPos();
        isDrawingFreehandRef.current = true;
        freehandPointsRef.current = [pos.x, pos.y, pos.x + 0.1, pos.y + 0.1];

        const tempLine = new Konva.Line({
          points: freehandPointsRef.current,
          stroke: "#1e293b",
          strokeWidth: 2,
          lineCap: "round",
          lineJoin: "round",
          tension: 0.4,
        });
        layerRef.current?.add(tempLine);
        freehandKonvaLineRef.current = tempLine;
        return;
      }

      // ── Text tool (single click to create) ──────────────────────────
      if (tool === "text") {
        const raw = getWorldPos();
        const pos = snapPos(raw.x, raw.y);
        const newEl = createDefaultElement(
          "text",
          undefined,
          pos.x,
          pos.y,
          200,
          50
        );
        newEl.text = "Text";
        addElement(newEl);
        selectElement(newEl.id);
        setEditingId(newEl.id);
        setEditingText("Text");
        setTool("select");
        return;
      }

      // ── Connector tool ───────────────────────────────────────────────
      if (tool === "connector") {
        if (!isStageTarget) {
          const clickedId = findElementNode(e.target);
          if (!connectorSource) {
            if (clickedId) setConnectorSource(clickedId);
          } else {
            // Complete the connector
            const srcEl = elements.find((el) => el.id === connectorSource);
            const tgtEl = elements.find((el) => el.id === clickedId);
            const raw = getWorldPos();
            const p1: [number, number] = srcEl
              ? [srcEl.x + srcEl.width / 2, srcEl.y + srcEl.height / 2]
              : [raw.x, raw.y];
            const p2: [number, number] = tgtEl
              ? [tgtEl.x + tgtEl.width / 2, tgtEl.y + tgtEl.height / 2]
              : [raw.x, raw.y];

            const connEl = createDefaultElement(
              "connector",
              undefined,
              0,
              0,
              1,
              1
            );
            connEl.points = [p1, p2];
            connEl.sourceId = connectorSource;
            connEl.targetId = clickedId ?? undefined;
            addElement(connEl);
            setConnectorSource(null);
            setTool("select");
          }
        } else {
          // Clicked empty canvas — cancel
          setConnectorSource(null);
        }
        return;
      }

      // ── Shape draw tools (click + drag) ─────────────────────────────
      if (SHAPE_DRAW_TOOLS.has(tool)) {
        const raw = getWorldPos();
        const pos = snapPos(raw.x, raw.y);
        createStartRef.current = pos;
        setIsCreating(true);
        setCreatePreview({ x: pos.x, y: pos.y, w: 0, h: 0 });
        return;
      }

      // ── Select tool ──────────────────────────────────────────────────
      if (tool === "select" && isStageTarget) {
        clearSelection();
        const raw = getWorldPos();
        const pos = snapPos(raw.x, raw.y);
        rubberBandStartRef.current = pos;
        setIsRubberBand(true);
        setRubberBand({ x: pos.x, y: pos.y, w: 0, h: 0 });
      }
    };

    // ── Mouse Move ────────────────────────────────────────────────────
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Pan
      if (isPanning) {
        setPan(
          e.evt.clientX - panStartRef.current.x,
          e.evt.clientY - panStartRef.current.y
        );
        return;
      }

      // Freehand
      if (isDrawingFreehandRef.current && freehandKonvaLineRef.current) {
        const pos = getWorldPos();
        freehandPointsRef.current = [
          ...freehandPointsRef.current,
          pos.x,
          pos.y,
        ];
        freehandKonvaLineRef.current.points(freehandPointsRef.current);
        layerRef.current?.batchDraw();
        return;
      }

      // Shape preview
      if (isCreating) {
        const raw = getWorldPos();
        const pos = snapPos(raw.x, raw.y);
        const sx = createStartRef.current.x;
        const sy = createStartRef.current.y;
        setCreatePreview({
          x: Math.min(pos.x, sx),
          y: Math.min(pos.y, sy),
          w: Math.abs(pos.x - sx),
          h: Math.abs(pos.y - sy),
        });
        return;
      }

      // Rubber-band selection
      if (isRubberBand) {
        const raw = getWorldPos();
        const pos = snapPos(raw.x, raw.y);
        const sx = rubberBandStartRef.current.x;
        const sy = rubberBandStartRef.current.y;
        const bx = Math.min(pos.x, sx);
        const by = Math.min(pos.y, sy);
        const bw = Math.abs(pos.x - sx);
        const bh = Math.abs(pos.y - sy);
        setRubberBand({ x: bx, y: by, w: bw, h: bh });

        if (bw > 4 || bh > 4) {
          const overlapping = elements
            .filter(
              (el) =>
                el.visible !== false &&
                el.type !== "freehand" &&
                el.type !== "connector"
            )
            .filter(
              (el) =>
                el.x < bx + bw &&
                el.x + el.width > bx &&
                el.y < by + bh &&
                el.y + el.height > by
            )
            .map((el) => el.id);
          if (overlapping.length > 0) selectElements(overlapping);
          else clearSelection();
        }
      }
    };

    // ── Mouse Up ──────────────────────────────────────────────────────
    const handleMouseUp = () => {
      // End pan
      if (isPanning) {
        setIsPanning(false);
        return;
      }

      // Commit freehand stroke
      if (isDrawingFreehandRef.current) {
        isDrawingFreehandRef.current = false;
        freehandKonvaLineRef.current?.destroy();
        freehandKonvaLineRef.current = null;
        layerRef.current?.batchDraw();

        const pts = freehandPointsRef.current;
        if (pts.length >= 4) {
          const pairs: Array<[number, number]> = [];
          for (let i = 0; i < pts.length - 1; i += 2) {
            pairs.push([pts[i], pts[i + 1]]);
          }
          const newEl = createDefaultElement("freehand", undefined, 0, 0, 1, 1);
          newEl.points = pairs;
          addElement(newEl);
        }
        freehandPointsRef.current = [];
        return;
      }

      // Commit shape creation
      if (isCreating && createPreview) {
        const { x, y, w, h } = createPreview;
        setIsCreating(false);
        setCreatePreview(null);

        const finalW = Math.max(w, 20);
        const finalH = Math.max(h, 20);
        const shapeType = tool as ShapeType;
        const meta = getShapeMeta(shapeType);

        const newEl = createDefaultElement(
          "shape",
          shapeType,
          x,
          y,
          finalW,
          finalH
        );
        newEl.fill = meta.defaultFill;
        newEl.stroke = meta.defaultStroke;
        addElement(newEl);
        selectElement(newEl.id);
        setTool("select");
        return;
      }

      // End rubber-band
      if (isRubberBand) {
        setIsRubberBand(false);
        setRubberBand(null);
      }
    };

    // ── Wheel zoom ────────────────────────────────────────────────────
    const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const factor = e.evt.deltaY < 0 ? 1.1 : 0.9;
      zoomTo(Math.min(Math.max(zoom * factor, 0.05), 20), pointer.x, pointer.y);
    };

    // ── Element event handlers ────────────────────────────────────────
    const handleElementClick = (
      el: Element,
      e: Konva.KonvaEventObject<MouseEvent>
    ) => {
      if (tool === "select") {
        e.cancelBubble = true;
        selectElement(el.id, e.evt.shiftKey);
      }
    };

    const handleElementDblClick = (el: Element) => {
      setEditingId(el.id);
      setEditingText(el.text || "");
    };

    const handleDragEnd = (
      el: Element,
      e: Konva.KonvaEventObject<DragEvent>
    ) => {
      const node = e.target;
      updateElement(el.id, {
        x: snapValue(node.x(), snapToGrid, gridSize),
        y: snapValue(node.y(), snapToGrid, gridSize),
      });
    };

    const handleTransformEnd = (
      el: Element,
      e: Konva.KonvaEventObject<Event>
    ) => {
      const node = e.target as Konva.Node;
      const scaleX = node.scaleX();
      const scaleY = node.scaleY();
      // Reset scale — apply it to the element's width/height instead
      node.scaleX(1);
      node.scaleY(1);
      node.getLayer()?.batchDraw();

      updateElement(el.id, {
        x: snapValue(node.x(), snapToGrid, gridSize),
        y: snapValue(node.y(), snapToGrid, gridSize),
        width: Math.max(10, Math.round(el.width * Math.abs(scaleX))),
        height: Math.max(10, Math.round(el.height * Math.abs(scaleY))),
        rotation: node.rotation(),
      });
    };

    // ── Inline text editing ────────────────────────────────────────────
    const finishEditing = () => {
      if (editingId) {
        updateElement(editingId, { text: editingText });
        setEditingId(null);
      }
    };

    const editingEl = elements.find((el) => el.id === editingId);

    // ── Cursor style ──────────────────────────────────────────────────
    const getCursor = () => {
      if (isPanning) return "grabbing";
      if (spaceDown || tool === "pan") return "grab";
      if (tool === "select") return "default";
      return "crosshair";
    };

    // ── Ref callback factory ──────────────────────────────────────────
    const makeRefCallback =
      (id: string) => (node: Konva.Node | null) => {
        if (node) nodeRefs.current.set(id, node);
        else nodeRefs.current.delete(id);
      };

    return (
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden select-none"
        style={{ background: "var(--canvas-bg)", cursor: getCursor() }}
      >
        {/* ── CSS Dot Grid ─────────────────────────────────────────── */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, var(--grid-dot) 1.2px, transparent 1.2px)`,
              backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
              backgroundPosition: `${panX % (gridSize * zoom)}px ${
                panY % (gridSize * zoom)
              }px`,
            }}
          />
        )}

        {/* ── Konva Stage ─────────────────────────────────────────── */}
        <Stage
          ref={stageRef}
          width={dimensions.width}
          height={dimensions.height}
          x={panX}
          y={panY}
          scaleX={zoom}
          scaleY={zoom}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Layer ref={layerRef}>
            {/* Transparent hit area for stage clicks */}
            <KonvaRect
              name="canvas-bg"
              x={-50000}
              y={-50000}
              width={100000}
              height={100000}
              fill="transparent"
              listening={true}
            />

            {/* ── Elements ─────────────────────────────────────────── */}
            {elements
              .filter((el) => el.visible !== false)
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((el) => {
                const refCb = makeRefCallback(el.id);
                const elClick = (e: Konva.KonvaEventObject<MouseEvent>) =>
                  handleElementClick(el, e);
                const elDblClick = () => handleElementDblClick(el);
                const elDragEnd = (e: Konva.KonvaEventObject<DragEvent>) =>
                  handleDragEnd(el, e);
                const elTransformEnd = (e: Konva.KonvaEventObject<Event>) =>
                  handleTransformEnd(el, e);

                if (el.type === "freehand") {
                  return (
                    <FreehandRenderer
                      key={el.id}
                      element={el}
                      onRef={refCb}
                      onClick={elClick}
                    />
                  );
                }
                if (el.type === "connector") {
                  return (
                    <ConnectorRenderer
                      key={el.id}
                      element={el}
                      onRef={refCb}
                      onClick={elClick}
                    />
                  );
                }
                if (el.type === "text") {
                  return (
                    <TextElementRenderer
                      key={el.id}
                      element={el}
                      onRef={refCb}
                      onClick={elClick}
                      onDblClick={elDblClick}
                      onDragEnd={elDragEnd}
                      onTransformEnd={elTransformEnd}
                      draggable={tool === "select" && !el.locked}
                    />
                  );
                }
                return (
                  <ShapeRenderer
                    key={el.id}
                    element={el}
                    onRef={refCb}
                    onClick={elClick}
                    onDblClick={elDblClick}
                    onDragEnd={elDragEnd}
                    onTransformEnd={elTransformEnd}
                    draggable={tool === "select" && !el.locked}
                  />
                );
              })}

            {/* ── Shape creation preview ────────────────────────────── */}
            {isCreating &&
              createPreview &&
              createPreview.w > 2 &&
              createPreview.h > 2 && (
                <KonvaRect
                  x={createPreview.x}
                  y={createPreview.y}
                  width={createPreview.w}
                  height={createPreview.h}
                  stroke="#6366f1"
                  strokeWidth={1.5 / zoom}
                  dash={[6 / zoom, 4 / zoom]}
                  fill="rgba(99,102,241,0.08)"
                  listening={false}
                  cornerRadius={2 / zoom}
                />
              )}

            {/* ── Rubber-band selection box ─────────────────────────── */}
            {isRubberBand &&
              rubberBand &&
              rubberBand.w > 4 &&
              rubberBand.h > 4 && (
                <KonvaRect
                  x={rubberBand.x}
                  y={rubberBand.y}
                  width={rubberBand.w}
                  height={rubberBand.h}
                  stroke="#6366f1"
                  strokeWidth={1 / zoom}
                  dash={[5 / zoom, 3 / zoom]}
                  fill="rgba(99,102,241,0.08)"
                  listening={false}
                />
              )}

            {/* ── Konva Transformer ────────────────────────────────── */}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < 10 || newBox.height < 10) return oldBox;
                return newBox;
              }}
              anchorSize={8}
              anchorCornerRadius={2}
              borderStroke="#6366f1"
              borderStrokeWidth={1.5}
              anchorStroke="#6366f1"
              anchorFill="#ffffff"
              rotateAnchorOffset={24}
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-right",
                "middle-left",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
            />
          </Layer>
        </Stage>

        {/* ── Inline text editing overlay ──────────────────────────── */}
        {editingEl && (
          <textarea
            autoFocus
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                finishEditing();
              }
            }}
            style={{
              position: "absolute",
              left: `${editingEl.x * zoom + panX}px`,
              top: `${editingEl.y * zoom + panY}px`,
              width: `${editingEl.width * zoom}px`,
              minHeight: `${editingEl.height * zoom}px`,
              fontSize: `${(editingEl.textStyle?.fontSize || 16) * zoom}px`,
              color: theme === "dark" ? "#e8edf6" : "#1a2240",
              textAlign: editingEl.textStyle?.alignment || "center",
              fontFamily:
                editingEl.textStyle?.fontFamily || "Virgil,Segoe UI,cursive",
              fontWeight: editingEl.textStyle?.fontWeight || "normal",
              fontStyle: editingEl.textStyle?.fontStyle || "normal",
              background:
                theme === "dark"
                  ? "rgba(26,31,46,0.97)"
                  : "rgba(255,255,255,0.97)",
              border: "2px solid var(--accent)",
              boxShadow: "0 4px 20px var(--accent-glow)",
              borderRadius: "6px",
              outline: "none",
              resize: "none",
              padding: "4px 6px",
              zIndex: 50,
              boxSizing: "border-box",
              lineHeight: "1.4",
            }}
          />
        )}

        {/* ── Connector instruction banner ─────────────────────────── */}
        {connectorSource && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg z-40 pointer-events-none animate-pulse">
            Click a target shape to draw connector · Esc to cancel
          </div>
        )}
      </div>
    );
  }
);
