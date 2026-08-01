import rough from "roughjs";
import type { OpSet } from "roughjs/bin/core";
import { getStroke } from "perfect-freehand";

// Initialize a singleton generator
const generator = rough.generator();

/**
 * Converts a Rough.js OpSet array into an SVG path string.
 * This allows us to use roughjs logic to draw onto a Konva <Path>.
 */
export function opsToPath(opSets: OpSet[]): string {
  let path = "";
  for (const set of opSets) {
    for (const { op, data } of set.ops) {
      switch (op) {
        case "move":
          path += `M${data[0]} ${data[1]} `;
          break;
        case "bcurveTo":
          path += `C${data[0]} ${data[1]}, ${data[2]} ${data[3]}, ${data[4]} ${data[5]} `;
          break;
        case "lineTo":
          path += `L${data[0]} ${data[1]} `;
          break;
      }
    }
  }
  return path.trim();
}

/**
 * Generates a rough rectangle SVG path.
 */
export function getRoughRectangle(w: number, h: number, roughness: number = 1): string {
  const d = generator.rectangle(0, 0, w, h, { roughness, fillStyle: "solid" });
  return opsToPath(d.sets);
}

/**
 * Generates a rough circle/ellipse SVG path.
 */
export function getRoughEllipse(w: number, h: number, roughness: number = 1): string {
  const d = generator.ellipse(w / 2, h / 2, w, h, { roughness, fillStyle: "solid" });
  return opsToPath(d.sets);
}

/**
 * Generates a rough line/polygon path from points.
 */
export function getRoughPolygon(points: [number, number][], roughness: number = 1, closed = false): string {
  if (points.length < 2) return "";
  const d = closed
    ? generator.polygon(points, { roughness, fillStyle: "solid" })
    : generator.linearPath(points, { roughness });
  return opsToPath(d.sets);
}

/**
 * Generates a rough line segment.
 */
export function getRoughLine(x1: number, y1: number, x2: number, y2: number, roughness: number = 1): string {
  const d = generator.line(x1, y1, x2, y2, { roughness });
  return opsToPath(d.sets);
}

// Fallback generator for passing existing string paths into roughjs
export function getRoughPath(svgPath: string, w: number, h: number, roughness: number = 1): string {
  const d = generator.path(svgPath, { roughness, fillStyle: "solid" });
  return opsToPath(d.sets);
}

/**
 * Generates an SVG path string for a smooth variable-width freehand stroke
 * using perfect-freehand.
 */
export function getFreehandSvgPath(
  points: [number, number][],
  strokeWidth: number = 4
): string {
  const strokePoints = getStroke(points, {
    size: strokeWidth,
    thinning: 0.5,
    smoothing: 0.5,
    streamline: 0.5,
  });

  if (!strokePoints.length) return "";

  const d = strokePoints.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...strokePoints[0], "Q"]
  );

  d.push("Z");
  return d.join(" ");
}
