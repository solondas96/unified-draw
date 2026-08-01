import type { Element } from "../types";

export interface Point {
  x: number;
  y: number;
  side: number;
}

export function getConnectionPoints(element: Element): Point[] {
  // Returns 8 connection points for a given element.
  // We assume x, y is the top-left corner (Konva default for rects),
  // but if the element is rotated or centered, we'd adjust here.
  // For simplicity, we use the bounding box.
  const { x, y, width, height } = element;

  const points: Point[] = [
    { side: 0, x: x + width / 2, y: y }, // Top Middle
    { side: 1, x: x + width, y: y }, // Top Right
    { side: 2, x: x + width, y: y + height / 2 }, // Right Middle
    { side: 3, x: x + width, y: y + height }, // Bottom Right
    { side: 4, x: x + width / 2, y: y + height }, // Bottom Middle
    { side: 5, x: x, y: y + height }, // Bottom Left
    { side: 6, x: x, y: y + height / 2 }, // Left Middle
    { side: 7, x: x, y: y }, // Top Left
  ];

  return points;
}

export function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Bezier curve calculation for curved connectors
export function getCurvedPath(start: Point, end: Point): string {
  // Simple orthogonal-ish bezier: control points push out from the sides
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  // Decide control points based on distance
  const tension = 0.4;
  const cp1 = { x: start.x, y: start.y };
  const cp2 = { x: end.x, y: end.y };

  // Logic to push control points out depending on which side the connection point is on
  const offset1 =
    Math.abs(dx) > Math.abs(dy)
      ? Math.abs(dx) * tension
      : Math.abs(dy) * tension;
  const offset2 = offset1;

  // Modify cp1 based on side
  if (start.side === 0)
    cp1.y -= offset1; // Top
  else if (start.side === 2)
    cp1.x += offset1; // Right
  else if (start.side === 4)
    cp1.y += offset1; // Bottom
  else if (start.side === 6)
    cp1.x -= offset1; // Left
  // Corners just project outwards diagonally
  else if (start.side === 1) {
    cp1.x += offset1 * 0.7;
    cp1.y -= offset1 * 0.7;
  } else if (start.side === 3) {
    cp1.x += offset1 * 0.7;
    cp1.y += offset1 * 0.7;
  } else if (start.side === 5) {
    cp1.x -= offset1 * 0.7;
    cp1.y += offset1 * 0.7;
  } else if (start.side === 7) {
    cp1.x -= offset1 * 0.7;
    cp1.y -= offset1 * 0.7;
  }

  // Modify cp2 based on side
  if (end.side === 0) cp2.y -= offset2;
  else if (end.side === 2) cp2.x += offset2;
  else if (end.side === 4) cp2.y += offset2;
  else if (end.side === 6) cp2.x -= offset2;
  else if (end.side === 1) {
    cp2.x += offset2 * 0.7;
    cp2.y -= offset2 * 0.7;
  } else if (end.side === 3) {
    cp2.x += offset2 * 0.7;
    cp2.y += offset2 * 0.7;
  } else if (end.side === 5) {
    cp2.x -= offset2 * 0.7;
    cp2.y += offset2 * 0.7;
  } else if (end.side === 7) {
    cp2.x -= offset2 * 0.7;
    cp2.y -= offset2 * 0.7;
  }

  return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
}
