import type { Element } from "../types";
import { getConnectionPoints, getCurvedPath } from "./geometry";
import { getShapeMeta } from "../shapeLibrary";

export function exportToMermaid(elements: Element[]): string {
  let mermaid = "graph TD;\n";

  // Build a lookup map and assign safe IDs for mermaid
  const safeId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, "");

  elements.forEach((el) => {
    if (el.type !== "connector" && el.type !== "freehand") {
      const label = el.text || el.shapeType || el.type;
      mermaid += `  ${safeId(el.id)}["${label.replace(/"/g, "'")}"];\n`;
    }
  });

  elements.forEach((el) => {
    if (
      el.type === "connector" &&
      el.connector?.sourceId &&
      el.connector?.targetId
    ) {
      mermaid += `  ${safeId(el.connector.sourceId)} --> ${safeId(el.connector.targetId)};\n`;
    }
  });

  return mermaid;
}

export function exportToSVG(
  elements: Element[],
  theme: "light" | "dark",
): string {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  elements.forEach((el) => {
    if (el.x < minX) minX = el.x;
    if (el.y < minY) minY = el.y;
    if (el.x + el.width > maxX) maxX = el.x + el.width;
    if (el.y + el.height > maxY) maxY = el.y + el.height;
  });

  if (minX === Infinity) return "<svg></svg>";

  const padding = 20;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const width = maxX - minX;
  const height = maxY - minY;

  const bg = theme === "dark" ? "#0f172a" : "#f8fafc";

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">\n`;
  svg += `  <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${bg}" />\n`;

  elements.forEach((el) => {
    if (el.type === "shape") {
      const rx = el.shapeType === "rounded_rectangle" ? 8 : 0;
      let shapeHtml = "";
      if (el.shapeType === "circle" || el.shapeType === "ellipse") {
        shapeHtml = `<ellipse cx="${el.x + el.width / 2}" cy="${el.y + el.height / 2}" rx="${el.width / 2}" ry="${el.height / 2}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 2}" />`;
      } else {
        shapeHtml = `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="${rx}" fill="${el.fill}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 2}" />`;
      }

      if (el.text) {
        const textFill = theme === "dark" ? "#e8edf6" : "#1a2240";
        shapeHtml += `\n    <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" fill="${el.textStyle?.color || textFill}" font-family="${el.textStyle?.fontFamily || "sans-serif"}" font-size="${el.textStyle?.fontSize || 16}" text-anchor="middle" dominant-baseline="central">${el.text}</text>`;
      }
      svg += `  <g id="${el.id}">\n    ${shapeHtml}\n  </g>\n`;
    } else if (el.type === "text") {
      svg += `  <text x="${el.x + el.width / 2}" y="${el.y + el.height / 2}" fill="${el.textStyle?.color || (theme === "dark" ? "#e8edf6" : "#1a2240")}" font-family="${el.textStyle?.fontFamily || "sans-serif"}" font-size="${el.textStyle?.fontSize || 16}" text-anchor="middle" dominant-baseline="central">${el.text}</text>\n`;
    } else if (el.type === "connector") {
      let p1 = { x: 0, y: 0 };
      let p2 = { x: 0, y: 0 };
      if (el.connector?.sourceId && el.connector?.targetId) {
        const srcEl = elements.find((e) => e.id === el.connector!.sourceId);
        const tgtEl = elements.find((e) => e.id === el.connector!.targetId);
        if (srcEl && tgtEl) {
          const srcPts = getConnectionPoints(srcEl);
          const tgtPts = getConnectionPoints(tgtEl);
          p1 = srcPts[el.connector.sourceConnectionPoint ?? 0] || srcPts[0];
          p2 = tgtPts[el.connector.targetConnectionPoint ?? 0] || tgtPts[0];
        }
      } else if (el.points && el.points.length >= 2) {
        p1 = { x: el.points[0][0], y: el.points[0][1] };
        p2 = { x: el.points[1][0], y: el.points[1][1] };
      }

      const isCurved = el.connector?.routingMode === "curved";
      if (isCurved) {
        svg += `  <path d="${getCurvedPath(p1 as any, p2 as any)}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 2}" />\n`;
      } else {
        svg += `  <line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 2}" />\n`;
      }
    } else if (el.type === "freehand" && el.points) {
      let d = `M ${el.points[0][0]} ${el.points[0][1]} `;
      for (let i = 1; i < el.points.length; i++) {
        d += `L ${el.points[i][0]} ${el.points[i][1]} `;
      }
      svg += `  <path d="${d}" fill="none" stroke="${el.stroke}" stroke-width="${el.strokeWidth || 2}" />\n`;
    }
  });

  svg += "</svg>";
  return svg;
}
