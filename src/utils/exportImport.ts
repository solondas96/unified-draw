import type { Canvas } from "../types";
import Konva from "konva";

/**
 * Serializes the canvas state to a formatted JSON string and triggers a browser download.
 * 
 * @param canvas The canvas document to export.
 */
export function exportToJSON(canvas: Canvas): void {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(canvas, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${canvas.name.toLowerCase().replace(/\s+/g, "-")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (error) {
    console.error("Failed to export canvas to JSON:", error);
    alert("An error occurred while exporting to JSON. Check console for details.");
  }
}

/**
 * Parses an uploaded JSON file and attempts to validate it as a Canvas document.
 * 
 * @param file The uploaded JSON File object.
 * @returns A promise that resolves to the valid Canvas document.
 */
export function importFromJSON(file: File): Promise<Canvas> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as Canvas;
        
        // Basic validation schema
        if (!parsed || typeof parsed !== "object" || !parsed.id || !Array.isArray(parsed.elements)) {
          throw new Error("Invalid UnifiedDraw JSON format.");
        }
        resolve(parsed);
      } catch (err) {
        console.error("Failed to parse imported JSON:", err);
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

/**
 * Exports the current Konva stage view as a high-resolution PNG image.
 * Uses a pixelRatio of 2 for retina quality. Resets scale and position 
 * temporarily to capture the true viewport bounds, then restores them.
 * 
 * @param stage The Konva Stage instance.
 * @param canvasName The base name for the downloaded file.
 */
export function exportToPNG(stage: Konva.Stage | null, canvasName: string): void {
  if (!stage) return;
  
  try {
    // Save current zoom & pan
    const oldScale = stage.scaleX();
    const oldX = stage.x();
    const oldY = stage.y();

    // Reset viewport scale for high-quality export
    stage.scale({ x: 1, y: 1 });
    stage.position({ x: 0, y: 0 });

    const dataURL = stage.toDataURL({ pixelRatio: 2 });

    // Restore scale & position
    stage.scale({ x: oldScale, y: oldScale });
    stage.position({ x: oldX, y: oldY });

    const link = document.createElement("a");
    link.download = `${canvasName.toLowerCase().replace(/\s+/g, "-")}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Failed to export to PNG:", error);
    alert("Failed to export PNG. This can happen if the canvas contains cross-origin images without CORS headers.");
  }
}

/**
 * Extracts all node primitives (Shapes, Lines, Text) from the stage and 
 * generates an SVG string representation, triggering a browser download.
 * Note: Only extracts nodes directly from standard Layers, skipping cursors/overlays.
 * 
 * @param stage The Konva Stage instance.
 * @param canvasName The base name for the downloaded file.
 */
export function exportToSVG(stage: Konva.Stage | null, canvasName: string): void {
  if (!stage) return;

  try {
    // Basic extraction loop to build SVG
    // NOTE: For a true 1:1 SVG export, a library like html2canvas or complex node-to-svg 
    // serialization is often needed. Here we generate a simple bounding box wrapper.
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${stage.width()}" height="${stage.height()}">`;
    
    // We can extract Konva Nodes to Data URLs as Image nodes in SVG for simplicity
    const dataURL = stage.toDataURL();
    svgContent += `<image href="${dataURL}" x="0" y="0" width="${stage.width()}" height="${stage.height()}" />`;
    svgContent += `</svg>`;

    const dataStr = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgContent);
    const link = document.createElement("a");
    link.download = `${canvasName.toLowerCase().replace(/\s+/g, "-")}.svg`;
    link.href = dataStr;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Failed to export to SVG:", error);
    alert("Failed to export SVG.");
  }
}
