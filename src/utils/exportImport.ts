import type { Canvas } from "../types";
import Konva from "konva";

// ─── Export to JSON ────────────────────────────────────────────────
export function exportToJSON(canvas: Canvas): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(canvas, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${canvas.name.toLowerCase().replace(/\s+/g, "-")}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

// ─── Import from JSON ────────────────────────────────────────────────
export function importFromJSON(file: File): Promise<Canvas> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as Canvas;
        
        // Basic validation
        if (!parsed.id || !Array.isArray(parsed.elements)) {
          throw new Error("Invalid UnifiedDraw JSON format.");
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

// ─── Export to PNG ─────────────────────────────────────────────────
export function exportToPNG(stage: Konva.Stage | null, canvasName: string): void {
  if (!stage) return;
  
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
}

// ─── Export to SVG ─────────────────────────────────────────────────
export function exportToSVG(stage: Konva.Stage | null, canvasName: string): void {
  if (!stage) return;

  const width = stage.width();
  const height = stage.height();

  // Render stage image as fallback vector container SVG
  const dataURL = stage.toDataURL({ pixelRatio: 2 });

  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    .bg { fill: #ffffff; }
  </style>
  <rect class="bg" width="${width}" height="${height}" />
  <image href="${dataURL}" width="${width}" height="${height}" />
</svg>`;

  const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = `${canvasName.toLowerCase().replace(/\s+/g, "-")}.svg`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
