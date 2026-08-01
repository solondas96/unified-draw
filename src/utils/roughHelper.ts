import rough from "roughjs";
import type { Drawable } from "roughjs/bin/core";
import { getStroke } from "perfect-freehand";
import type Konva from "konva";

// Initialize a singleton generator
const generator = rough.generator();
const roughCache = new WeakMap<any, Drawable | null>();

export function getCachedDrawable(element: any, generatorFn: () => Drawable | null): Drawable | null {
  if (roughCache.has(element)) {
    return roughCache.get(element)!;
  }
  const d = generatorFn();
  roughCache.set(element, d);
  return d;
}

/**
 * Draws a Rough.js Drawable directly onto a Konva Context.
 * This is the magic that allows us to get sketchy fills and strokes
 * while perfectly preserving Konva's hit-detection graph.
 */
export function drawDrawable(ctx: Konva.Context, drawable: Drawable) {
  for (const set of drawable.sets) {
    ctx.beginPath();
    for (const { op, data } of set.ops) {
      switch (op) {
        case "move":
          ctx.moveTo(data[0], data[1]);
          break;
        case "bcurveTo":
          ctx.bezierCurveTo(data[0], data[1], data[2], data[3], data[4], data[5]);
          break;
        case "lineTo":
          ctx.lineTo(data[0], data[1]);
          break;
      }
    }

    if (set.type === "fillPath" || set.type === "fillSketch") {
      ctx.fillStrokeShape(drawable as any);
      if (set.type === "fillPath") {
        ctx.fill();
      } else {
        ctx.stroke();
      }
    } else {
      ctx.stroke();
    }
  }
}

/**
 * Returns a Rough.js Rectangle Drawable.
 */
export function getRoughRectangleDrawable(w: number, h: number, roughness: number, fill?: string): Drawable {
  const options: any = { roughness };
  if (fill && fill !== "transparent") {
    options.fill = fill;
    options.fillStyle = "hachure";
  }
  return generator.rectangle(0, 0, w, h, options);
}

/**
 * Returns a Rough.js Ellipse Drawable.
 */
export function getRoughEllipseDrawable(w: number, h: number, roughness: number, fill?: string): Drawable {
  const options: any = { roughness };
  if (fill && fill !== "transparent") {
    options.fill = fill;
    options.fillStyle = "hachure";
  }
  return generator.ellipse(w / 2, h / 2, w, h, options);
}

/**
 * Returns a Rough.js Polygon Drawable.
 */
export function getRoughPolygonDrawable(points: [number, number][], roughness: number, closed = false, fill?: string): Drawable | null {
  if (points.length < 2) return null;
  const options: any = { roughness };
  if (fill && fill !== "transparent" && closed) {
    options.fill = fill;
    options.fillStyle = "hachure";
  }
  return closed
    ? generator.polygon(points, options)
    : generator.linearPath(points, options);
}

/**
 * Returns a Rough.js Line Drawable.
 */
export function getRoughLineDrawable(x1: number, y1: number, x2: number, y2: number, roughness: number): Drawable {
  return generator.line(x1, y1, x2, y2, { roughness });
}

/**
 * Returns a Rough.js Path Drawable.
 */
export function getRoughPathDrawable(svgPath: string, _w: number, _h: number, roughness: number, fill?: string): Drawable {
  const options: any = { roughness };
  if (fill && fill !== "transparent") {
    options.fill = fill;
    options.fillStyle = "hachure";
  }
  return generator.path(svgPath, options);
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
