import React from "react";
import {
  Rect,
  Circle,
  Ellipse,
  Line,
  Arrow,
  Star,
  Text,
  RegularPolygon,
  Shape as KonvaShape,
  Path,
  Group,
} from "react-konva";
import type Konva from "konva";
import type { Element, ShapeType } from "./types";
import { getShapeMeta } from "./shapeLibrary";
import {
  drawDrawable,
  getRoughRectangleDrawable,
  getRoughEllipseDrawable,
  getRoughPolygonDrawable,
  getRoughPathDrawable,
  getFreehandSvgPath,
  getCachedDrawable
} from "./utils/roughHelper";
import { useStore } from "./store";
import { getConnectionPoints, getCurvedPath } from "./utils/geometry";

// ─── Helper: Get points for polygon shapes ─────────────────────────
function diamondPoints(w: number, h: number): number[] {
  return [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2];
}

function trianglePoints(w: number, h: number): number[] {
  return [w / 2, 0, w, h, 0, h];
}

function parallelogramPoints(w: number, h: number): number[] {
  const skew = w * 0.2;
  return [skew, 0, w, 0, w - skew, h, 0, h];
}

function trapezoidPoints(w: number, h: number): number[] {
  const inset = w * 0.2;
  return [inset, 0, w - inset, 0, w, h, 0, h];
}

// ─── Helper: Cloud path ────────────────────────────────────────────
function cloudPath(w: number, h: number): string {
  const r = h * 0.3;
  return `M ${r} ${h - r}
    C ${r * 0.3} ${h - r} ${r * 0.3} ${h * 0.4} ${r} ${h * 0.4}
    C ${r * 0.5} ${h * 0.1} ${w * 0.3} ${h * 0.1} ${w * 0.4} ${h * 0.35}
    C ${w * 0.5} ${h * 0.05} ${w * 0.7} ${h * 0.05} ${w * 0.75} ${h * 0.35}
    C ${w - r * 0.3} ${h * 0.3} ${w} ${h * 0.5} ${w - r} ${h * 0.5}
    C ${w} ${h * 0.7} ${w} ${h - r} ${w - r} ${h - r}
    Z`;
}

// ─── Helper: Heart path ────────────────────────────────────────────
function heartPath(w: number, h: number): string {
  return `M ${w / 2} ${h * 0.85}
    C ${w * 0.1} ${h * 0.55} ${w * 0.05} ${h * 0.25} ${w / 2} ${h * 0.3}
    C ${w * 0.95} ${h * 0.25} ${w * 0.9} ${h * 0.55} ${w / 2} ${h * 0.85}
    Z`;
}

// ─── Helper: Speech bubble path ────────────────────────────────────
function speechBubblePath(w: number, h: number): string {
  const r = 10;
  const tailW = 20;
  const tailH = 15;
  return `M ${r} 0
    L ${w - r} 0
    Q ${w} 0 ${w} ${r}
    L ${w} ${h - tailH - r}
    Q ${w} ${h - tailH} ${w - r} ${h - tailH}
    L ${w * 0.3 + tailW} ${h - tailH}
    L ${w * 0.3} ${h}
    L ${w * 0.3 + 5} ${h - tailH}
    L ${r} ${h - tailH}
    Q 0 ${h - tailH} 0 ${h - tailH - r}
    L 0 ${r}
    Q 0 0 ${r} 0
    Z`;
}

// ─── Helper: Cylinder shape ────────────────────────────────────────
function cylinderSceneFunc(ctx: any, shape: Konva.Shape, w: number, h: number) {
  const ry = h * 0.12;
  ctx.beginPath();
  // Top ellipse
  ctx.ellipse(w / 2, ry, w / 2, ry, 0, 0, Math.PI * 2);
  ctx.closePath();
  // Body
  ctx.beginPath();
  ctx.moveTo(0, ry);
  ctx.lineTo(0, h - ry);
  ctx.ellipse(w / 2, h - ry, w / 2, ry, 0, Math.PI, 0, true);
  ctx.lineTo(w, ry);
  ctx.ellipse(w / 2, ry, w / 2, ry, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStrokeShape(shape);
}

// ─── Helper: Document path (wavy bottom) ───────────────────────────
function documentPath(w: number, h: number): string {
  return `M 0 0
    L ${w} 0
    L ${w} ${h - 15}
    Q ${w * 0.75} ${h} ${w * 0.5} ${h - 10}
    Q ${w * 0.25} ${h - 20} 0 ${h - 10}
    Z`;
}

// ─── Helper: Manual input (slanted top) ────────────────────────────
function manualInputPath(w: number, h: number): string {
  const skew = w * 0.2;
  return `M ${skew} 0 L ${w} 0 L ${w} ${h} L 0 ${h} L 0 ${h * 0.1} Z`;
}

// ─── Helper: Display (curved sides) ────────────────────────────────
function displayPath(w: number, h: number): string {
  const skew = w * 0.15;
  return `M ${skew} 0 L ${w - skew} 0 Q ${w} ${h / 2} ${w - skew} ${h} L ${skew} ${h} Q 0 ${h / 2} ${skew} 0 Z`;
}

// ─── Helper: Sort shape ────────────────────────────────────────────
function sortPath(w: number, h: number): string {
  return `M 0 0 L ${w / 2} ${h} L ${w} 0 L ${w * 0.75} 0 L ${w / 2} ${h * 0.6} L ${w * 0.25} 0 Z`;
}

// ─── Helper: Card (curved top) ─────────────────────────────────────
function cardPath(w: number, h: number): string {
  const r = h * 0.3;
  return `M 0 ${r} Q 0 0 ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h} L 0 ${h} Z`;
}

// ─── Helper: Delay (rounded left) ──────────────────────────────────
function delayPath(w: number, h: number): string {
  const r = h * 0.5;
  return `M ${r} 0 Q 0 0 0 ${r} Q 0 ${h} ${r} ${h} L ${w} ${h} L ${w} 0 Z`;
}

// ─── Helper: Loop limit ────────────────────────────────────────────
function loopLimitPath(w: number, h: number): string {
  const r = h * 0.3;
  return `M ${r} 0 L ${w - r} 0 L ${w} ${r} L ${w} ${h - r} L ${w - r} ${h} L ${r} ${h} L 0 ${h - r} L 0 ${r} Z`;
}

// ─── Helper: Storage shape ─────────────────────────────────────────
function storagePath(w: number, h: number): string {
  const r = h * 0.2;
  return `M 0 ${r} Q 0 0 ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h} L 0 ${h} Z`;
}

// ─── Helper: Internal storage ──────────────────────────────────────
function internalStoragePath(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${w * 0.15} ${h * 0.15} L ${w * 0.85} ${h * 0.15} L ${w * 0.85} ${h * 0.85} L ${w * 0.15} ${h * 0.85} Z`;
}

// ─── Helper: Sequential data (cylinder on side) ────────────────────
function sequentialDataPath(w: number, h: number): string {
  const rx = w * 0.12;
  return `M ${rx} 0 L ${w - rx} 0 Q ${w} ${h / 2} ${w - rx} ${h} L ${rx} ${h} Q 0 ${h / 2} ${rx} 0 Z`;
}

// ─── Helper: Multi-document ────────────────────────────────────────
function multiDocumentPath(w: number, h: number): string {
  const offset = 10;
  return `M ${offset} ${offset} L ${w} ${offset} L ${w} ${h - 10} Q ${w * 0.75} ${h} ${w * 0.5} ${h - 5} Q ${w * 0.25} ${h - 15} ${offset} ${h - 5} Z M 0 0 L ${w - offset} 0 L ${w - offset} ${h - offset - 10} Q ${w * 0.75 - offset} ${h - offset} ${w * 0.5 - offset} ${h - offset - 5} Q ${w * 0.25 - offset} ${h - offset - 15} 0 ${h - offset - 5} Z`;
}

// ─── Helper: Manual operation (trapezoid inverted) ─────────────────
function manualOperationPath(w: number, h: number): string {
  const inset = w * 0.2;
  return `M 0 0 L ${w} 0 L ${w - inset} ${h} L ${inset} ${h} Z`;
}

// ─── Helper: Preparation (hexagon) ─────────────────────────────────
function preparationPath(w: number, h: number): string {
  const skew = w * 0.15;
  return `M ${skew} 0 L ${w - skew} 0 L ${w} ${h / 2} L ${w - skew} ${h} L ${skew} ${h} L 0 ${h / 2} Z`;
}

// ─── Helper: Terminator (stadium) ──────────────────────────────────
function terminatorPath(w: number, h: number): string {
  const r = h / 2;
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${r} Q 0 0 ${r} 0 Z`;
}

// ─── Helper: Or shape (circle with line) ───────────────────────────
function orPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  return `M ${cx - r} ${cy} L ${cx + r} ${cy} M ${cx} ${cy - r} L ${cx} ${cy + r} M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

// ─── Helper: Summing junction (circle with X) ──────────────────────
function summingJunctionPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2;
  const d = r * 0.7;
  return `M ${cx - d} ${cy - d} L ${cx + d} ${cy + d} M ${cx + d} ${cy - d} L ${cx - d} ${cy + d} M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

// ─── Icon helpers (simplified data engineering icons) ──────────────
function apiPath(w: number, h: number): string {
  const r = 8;
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z M ${w * 0.2} ${h * 0.5} L ${w * 0.8} ${h * 0.5} M ${w * 0.5} ${h * 0.2} L ${w * 0.5} ${h * 0.8}`;
}

function queuePath(w: number, h: number): string {
  const slot = w / 4;
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${slot} 0 L ${slot} ${h} M ${slot * 2} 0 L ${slot * 2} ${h} M ${slot * 3} 0 L ${slot * 3} ${h}`;
}

function functionPath(w: number, h: number): string {
  const r = 8;
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z M ${w * 0.25} ${h * 0.3} L ${w * 0.75} ${h * 0.3} M ${w * 0.25} ${h * 0.5} L ${w * 0.75} ${h * 0.5} M ${w * 0.25} ${h * 0.7} L ${w * 0.75} ${h * 0.7}`;
}

function lambdaPath(w: number, h: number): string {
  return `M ${w * 0.15} ${h * 0.15} L ${w * 0.4} ${h * 0.85} L ${w * 0.85} ${h * 0.15} M ${w * 0.3} ${h * 0.5} L ${w * 0.7} ${h * 0.5}`;
}

function serverPath(w: number, h: number): string {
  const unit = h / 3;
  const gap = unit * 0.15;
  return `M 0 ${gap} L ${w} ${gap} L ${w} ${unit - gap} L 0 ${unit - gap} Z M 0 ${unit + gap} L ${w} ${unit + gap} L ${w} ${unit * 2 - gap} L 0 ${unit * 2 - gap} Z M 0 ${unit * 2 + gap} L ${w} ${unit * 2 + gap} L ${w} ${h - gap} L 0 ${h - gap} Z`;
}

function webPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy - r} L ${cx} ${cy + r} M ${cx - r} ${cy} L ${cx + r} ${cy} M ${cx - r * 0.7} ${cy - r * 0.7} L ${cx + r * 0.7} ${cy + r * 0.7} M ${cx + r * 0.7} ${cy - r * 0.7} L ${cx - r * 0.7} ${cy + r * 0.7} M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function mobilePath(w: number, h: number): string {
  const r = 8;
  return `M ${r} 0 L ${w - r} 0 Q ${w} 0 ${w} ${r} L ${w} ${h - r} Q ${w} ${h} ${w - r} ${h} L ${r} ${h} Q 0 ${h} 0 ${h - r} L 0 ${r} Q 0 0 ${r} 0 Z M 0 ${h * 0.1} L ${w} ${h * 0.1} M 0 ${h * 0.85} L ${w} ${h * 0.85}`;
}

function userPath(w: number, h: number): string {
  return `M ${w * 0.5} ${h * 0.05} m ${-h * 0.2} 0 a ${h * 0.2} ${h * 0.2} 0 1 0 ${h * 0.4} 0 a ${h * 0.2} ${h * 0.2} 0 1 0 ${-h * 0.4} 0 M ${w * 0.2} ${h} Q ${w * 0.2} ${h * 0.5} ${w * 0.5} ${h * 0.5} Q ${w * 0.8} ${h * 0.5} ${w * 0.8} ${h}`;
}

function usersPath(w: number, h: number): string {
  return `M ${w * 0.35} ${h * 0.1} m ${-h * 0.15} 0 a ${h * 0.15} ${h * 0.15} 0 1 0 ${h * 0.3} 0 a ${h * 0.15} ${h * 0.15} 0 1 0 ${-h * 0.3} 0 M ${w * 0.15} ${h} Q ${w * 0.15} ${h * 0.5} ${w * 0.35} ${h * 0.5} Q ${w * 0.55} ${h * 0.5} ${w * 0.55} ${h * 0.8} M ${w * 0.65} ${h * 0.1} m ${-h * 0.15} 0 a ${h * 0.15} ${h * 0.15} 0 1 0 ${h * 0.3} 0 a ${h * 0.15} ${h * 0.15} 0 1 0 ${-h * 0.3} 0 M ${w * 0.45} ${h} Q ${w * 0.45} ${h * 0.5} ${w * 0.65} ${h * 0.5} Q ${w * 0.85} ${h * 0.5} ${w * 0.85} ${h}`;
}

function gearPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 4;
  const teeth = 8;
  let path = "";
  for (let i = 0; i < teeth; i++) {
    const a1 = (i / teeth) * Math.PI * 2;
    const a2 = ((i + 0.5) / teeth) * Math.PI * 2;
    const a3 = ((i + 1) / teeth) * Math.PI * 2;
    const r1 = r * 0.7;
    const r2 = r;
    if (i === 0) path += `M ${cx + Math.cos(a1) * r1} ${cy + Math.sin(a1) * r1} `;
    path += `L ${cx + Math.cos(a1) * r2} ${cy + Math.sin(a1) * r2} `;
    path += `L ${cx + Math.cos(a2) * r2} ${cy + Math.sin(a2) * r2} `;
    path += `L ${cx + Math.cos(a3) * r1} ${cy + Math.sin(a3) * r1} `;
  }
  path += `M ${cx} ${cy} m ${-r * 0.35} 0 a ${r * 0.35} ${r * 0.35} 0 1 0 ${r * 0.7} 0 a ${r * 0.35} ${r * 0.35} 0 1 0 ${-r * 0.7} 0`;
  return path;
}

function warningPath(w: number, h: number): string {
  return `M ${w / 2} 0 L ${w} ${h} L 0 ${h} Z M ${w / 2} ${h * 0.3} L ${w / 2} ${h * 0.65} M ${w / 2} ${h * 0.8} L ${w / 2} ${h * 0.85}`;
}

function infoPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx} ${h * 0.3} L ${cx} ${h * 0.75} M ${cx} ${h * 0.2} L ${cx} ${h * 0.25}`;
}

function checkPath(w: number, h: number): string {
  return `M ${w * 0.15} ${h * 0.5} L ${w * 0.4} ${h * 0.75} L ${w * 0.85} ${h * 0.25}`;
}

function crossPath(w: number, h: number): string {
  return `M ${w * 0.2} ${h * 0.2} L ${w * 0.8} ${h * 0.8} M ${w * 0.8} ${h * 0.2} L ${w * 0.2} ${h * 0.8}`;
}

function searchPath(w: number, h: number): string {
  const r = Math.min(w, h) * 0.35;
  const cx = w * 0.4;
  const cy = h * 0.4;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx + r * 0.7} ${cy + r * 0.7} L ${w * 0.9} ${h * 0.9}`;
}

function bellPath(w: number, h: number): string {
  return `M ${w * 0.2} ${h * 0.7} Q ${w * 0.2} ${h * 0.2} ${w * 0.5} ${h * 0.2} Q ${w * 0.8} ${h * 0.2} ${w * 0.8} ${h * 0.7} L ${w * 0.9} ${h * 0.8} L ${w * 0.1} ${h * 0.8} Z M ${w * 0.4} ${h * 0.85} L ${w * 0.6} ${h * 0.85}`;
}

function mailPath(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M 0 0 L ${w / 2} ${h * 0.6} L ${w} 0`;
}

function clockPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx} ${cy} L ${cx} ${h * 0.25} M ${cx} ${cy} L ${w * 0.7} ${cy}`;
}

function calendarPath(w: number, h: number): string {
  return `M 0 ${h * 0.15} L ${w} ${h * 0.15} L ${w} ${h} L 0 ${h} Z M 0 ${h * 0.15} L ${w} ${h * 0.15} M ${w * 0.15} 0 L ${w * 0.15} ${h * 0.3} M ${w * 0.85} 0 L ${w * 0.85} ${h * 0.3} M 0 ${h * 0.4} L ${w} ${h * 0.4}`;
}

function folderPath(w: number, h: number): string {
  return `M 0 ${h * 0.2} L ${w * 0.3} ${h * 0.2} L ${w * 0.4} 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
}

function filePath(w: number, h: number): string {
  const fold = h * 0.2;
  return `M 0 0 L ${w * 0.7} 0 L ${w} ${fold} L ${w} ${h} L 0 ${h} Z M ${w * 0.7} 0 L ${w * 0.7} ${fold} L ${w} ${fold}`;
}

function imagePath(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M ${w * 0.2} ${h * 0.65} L ${w * 0.4} ${h * 0.4} L ${w * 0.6} ${h * 0.6} L ${w * 0.8} ${h * 0.35} M ${w * 0.2} ${h * 0.3} m ${-h * 0.05} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${h * 0.1} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${-h * 0.1} 0`;
}

function videoPath(w: number, h: number): string {
  return `M 0 ${h * 0.2} L ${w * 0.7} ${h * 0.2} L ${w * 0.7} 0 L ${w} ${h * 0.1} L ${w} ${h * 0.9} L ${w * 0.7} ${h} L ${w * 0.7} ${h * 0.8} L 0 ${h * 0.8} Z`;
}

function audioPath(w: number, h: number): string {
  return `M ${w * 0.2} ${h * 0.4} L ${w * 0.2} ${h * 0.6} L ${w * 0.4} ${h * 0.6} L ${w * 0.6} ${h * 0.8} L ${w * 0.6} ${h * 0.2} L ${w * 0.4} ${h * 0.4} Z M ${w * 0.65} ${h * 0.35} Q ${w * 0.8} ${h * 0.5} ${w * 0.65} ${h * 0.65}`;
}

function lockPath(w: number, h: number): string {
  return `M ${w * 0.3} ${h * 0.4} L ${w * 0.3} ${h * 0.3} Q ${w * 0.3} ${h * 0.1} ${w * 0.5} ${h * 0.1} Q ${w * 0.7} ${h * 0.1} ${w * 0.7} ${h * 0.3} L ${w * 0.7} ${h * 0.4} M ${w * 0.2} ${h * 0.4} L ${w * 0.8} ${h * 0.4} L ${w * 0.8} ${h * 0.9} L ${w * 0.2} ${h * 0.9} Z`;
}

function keyPath(w: number, h: number): string {
  const r = h * 0.3;
  return `M ${h * 0.3} ${h * 0.5} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${h * 0.5} ${h * 0.5} L ${w * 0.9} ${h * 0.5} M ${w * 0.7} ${h * 0.5} L ${w * 0.7} ${h * 0.7} M ${w * 0.85} ${h * 0.5} L ${w * 0.85} ${h * 0.7}`;
}

function linkPath(w: number, h: number): string {
  const r = h * 0.25;
  return `M ${w * 0.3} ${h * 0.5} L ${w * 0.7} ${h * 0.5} M ${w * 0.2} ${h * 0.5} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.8} ${h * 0.5} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function downloadPath(w: number, h: number): string {
  return `M ${w * 0.5} 0 L ${w * 0.5} ${h * 0.6} M ${w * 0.25} ${h * 0.4} L ${w * 0.5} ${h * 0.65} L ${w * 0.75} ${h * 0.4} M 0 ${h * 0.8} L ${w} ${h * 0.8} L ${w} ${h} L 0 ${h} Z`;
}

function uploadPath(w: number, h: number): string {
  return `M ${w * 0.5} ${h * 0.6} L ${w * 0.5} 0 M ${w * 0.25} ${h * 0.25} L ${w * 0.5} 0 L ${w * 0.75} ${h * 0.25} M 0 ${h * 0.8} L ${w} ${h * 0.8} L ${w} ${h} L 0 ${h} Z`;
}

function trashPath(w: number, h: number): string {
  return `M ${w * 0.2} ${h * 0.2} L ${w * 0.8} ${h * 0.2} L ${w * 0.7} ${h} L ${w * 0.3} ${h} Z M ${w * 0.1} ${h * 0.2} L ${w * 0.9} ${h * 0.2} M ${w * 0.4} 0 L ${w * 0.6} 0 L ${w * 0.6} ${h * 0.1} L ${w * 0.4} ${h * 0.1} Z M ${w * 0.4} ${h * 0.4} L ${w * 0.4} ${h * 0.8} M ${w * 0.6} ${h * 0.4} L ${w * 0.6} ${h * 0.8}`;
}

function editPath(w: number, h: number): string {
  return `M ${w * 0.1} ${h * 0.9} L ${w * 0.3} ${h * 0.7} L ${w * 0.7} ${h * 0.3} L ${w * 0.9} ${h * 0.5} L ${w * 0.5} ${h * 0.9} Z M ${w * 0.7} ${h * 0.3} L ${w * 0.8} ${h * 0.2} L ${w * 0.95} ${h * 0.35} L ${w * 0.85} ${h * 0.45} Z`;
}

function copyPath(w: number, h: number): string {
  return `M ${w * 0.2} ${h * 0.2} L ${w * 0.2} ${h * 0.8} L ${w * 0.7} ${h * 0.8} L ${w * 0.7} ${h * 0.2} Z M ${w * 0.3} ${h * 0.1} L ${w * 0.8} ${h * 0.1} L ${w * 0.8} ${h * 0.7}`;
}

function filterPath(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w * 0.6} ${h * 0.5} L ${w * 0.6} ${h} L ${w * 0.4} ${h * 0.8} L ${w * 0.4} ${h * 0.5} Z`;
}

function sortIconPath(w: number, h: number): string {
  return `M ${w * 0.2} 0 L ${w * 0.2} ${h * 0.8} M ${w * 0.1} ${h * 0.7} L ${w * 0.2} ${h * 0.8} L ${w * 0.3} ${h * 0.7} M ${w * 0.8} ${h} L ${w * 0.8} ${h * 0.2} M ${w * 0.7} ${h * 0.3} L ${w * 0.8} ${h * 0.2} L ${w * 0.9} ${h * 0.3}`;
}

function chartPath(w: number, h: number): string {
  return `M 0 ${h} L ${w} ${h} M ${w * 0.1} ${h} L ${w * 0.1} ${h * 0.7} L ${w * 0.25} ${h * 0.7} L ${w * 0.25} ${h} M ${w * 0.35} ${h} L ${w * 0.35} ${h * 0.5} L ${w * 0.5} ${h * 0.5} L ${w * 0.5} ${h} M ${w * 0.6} ${h} L ${w * 0.6} ${h * 0.3} L ${w * 0.75} ${h * 0.3} L ${w * 0.75} ${h} M ${w * 0.85} ${h} L ${w * 0.85} ${h * 0.6} L ${w} ${h * 0.6} L ${w} ${h}`;
}

function graphPath(w: number, h: number): string {
  return `M 0 ${h} L ${w} ${h} M 0 ${h} L 0 0 M ${w * 0.1} ${h * 0.8} L ${w * 0.3} ${h * 0.5} L ${w * 0.5} ${h * 0.6} L ${w * 0.7} ${h * 0.3} L ${w * 0.9} ${h * 0.4}`;
}

function piePath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx} ${cy} Z`;
}

function tablePath(w: number, h: number): string {
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M 0 ${h * 0.3} L ${w} ${h * 0.3} M 0 ${h * 0.6} L ${w} ${h * 0.6} M ${w / 3} 0 L ${w / 3} ${h} M ${w * 2 / 3} 0 L ${w * 2 / 3} ${h}`;
}

function treePath(w: number, h: number): string {
  return `M ${w * 0.5} 0 L ${w * 0.5} ${h * 0.3} M ${w * 0.5} ${h * 0.3} L ${w * 0.2} ${h * 0.3} L ${w * 0.2} ${h * 0.6} M ${w * 0.5} ${h * 0.3} L ${w * 0.8} ${h * 0.3} L ${w * 0.8} ${h * 0.6} M ${w * 0.2} ${h * 0.6} L ${w * 0.1} ${h * 0.9} M ${w * 0.2} ${h * 0.6} L ${w * 0.3} ${h * 0.9} M ${w * 0.8} ${h * 0.6} L ${w * 0.7} ${h * 0.9} M ${w * 0.8} ${h * 0.6} L ${w * 0.9} ${h * 0.9}`;
}

function networkPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.12;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.15} ${h * 0.15} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.85} ${h * 0.15} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.15} ${h * 0.85} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.85} ${h * 0.85} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx} ${cy} L ${w * 0.15} ${h * 0.15} M ${cx} ${cy} L ${w * 0.85} ${h * 0.15} M ${cx} ${cy} L ${w * 0.15} ${h * 0.85} M ${cx} ${cy} L ${w * 0.85} ${h * 0.85}`;
}

function routerPath(w: number, h: number): string {
  return `M 0 ${h * 0.3} L ${w} ${h * 0.3} L ${w} ${h * 0.7} L 0 ${h * 0.7} Z M ${w * 0.2} ${h * 0.5} m ${-h * 0.05} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${h * 0.1} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${-h * 0.1} 0 M ${w * 0.4} ${h * 0.5} m ${-h * 0.05} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${h * 0.1} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${-h * 0.1} 0 M ${w * 0.5} ${h * 0.3} L ${w * 0.5} ${h * 0.1} M ${w * 0.5} ${h * 0.1} L ${w * 0.3} 0 M ${w * 0.5} ${h * 0.1} L ${w * 0.7} 0`;
}

function switchPath(w: number, h: number): string {
  return `M 0 ${h * 0.35} L ${w} ${h * 0.35} L ${w} ${h * 0.65} L 0 ${h * 0.65} Z M ${w * 0.15} ${h * 0.35} L ${w * 0.15} ${h * 0.1} M ${w * 0.35} ${h * 0.35} L ${w * 0.35} ${h * 0.1} M ${w * 0.65} ${h * 0.35} L ${w * 0.65} ${h * 0.1} M ${w * 0.85} ${h * 0.35} L ${w * 0.85} ${h * 0.1} M ${w * 0.15} ${h * 0.65} L ${w * 0.15} ${h * 0.9} M ${w * 0.35} ${h * 0.65} L ${w * 0.35} ${h * 0.9} M ${w * 0.65} ${h * 0.65} L ${w * 0.65} ${h * 0.9} M ${w * 0.85} ${h * 0.65} L ${w * 0.85} ${h * 0.9}`;
}

function firewallPath(w: number, h: number): string {
  const bw = w / 4;
  const bh = h / 3;
  return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z M 0 ${bh} L ${w} ${bh} M 0 ${bh * 2} L ${w} ${bh * 2} M ${bw} 0 L ${bw} ${h} M ${bw * 2} 0 L ${bw * 2} ${h} M ${bw * 3} 0 L ${bw * 3} ${h}`;
}

function cloudUploadPath(w: number, h: number): string {
  return `${cloudPath(w, h * 0.7)} M ${w * 0.5} ${h * 0.5} L ${w * 0.5} ${h * 0.9} M ${w * 0.35} ${h * 0.65} L ${w * 0.5} ${h * 0.5} L ${w * 0.65} ${h * 0.65}`;
}

function cloudDownloadPath(w: number, h: number): string {
  return `${cloudPath(w, h * 0.7)} M ${w * 0.5} ${h * 0.5} L ${w * 0.5} ${h * 0.9} M ${w * 0.35} ${h * 0.75} L ${w * 0.5} ${h * 0.9} L ${w * 0.65} ${h * 0.75}`;
}

function syncPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;
  return `M ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy + r} M ${cx} ${cy + r} L ${cx - r * 0.3} ${cy + r * 0.7} L ${cx + r * 0.3} ${cy + r * 0.7} Z M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx} ${cy - r} M ${cx} ${cy - r} L ${cx - r * 0.3} ${cy - r * 0.7} L ${cx + r * 0.3} ${cy - r * 0.7} Z`;
}

function refreshPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.35;
  return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} M ${cx + r} ${cy} L ${cx + r * 0.7} ${cy - r * 0.3} M ${cx + r} ${cy} L ${cx + r * 0.7} ${cy + r * 0.3}`;
}

function powerPath(w: number, h: number): string {
  const cx = w / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${h * 0.1} L ${cx} ${h * 0.5} M ${cx - r * 0.7} ${h * 0.25} A ${r} ${r} 0 1 0 ${cx + r * 0.7} ${h * 0.25}`;
}

function batteryPath(w: number, h: number): string {
  return `M 0 ${h * 0.2} L ${w * 0.9} ${h * 0.2} L ${w * 0.9} ${h * 0.8} L 0 ${h * 0.8} Z M ${w * 0.9} ${h * 0.35} L ${w} ${h * 0.35} L ${w} ${h * 0.65} L ${w * 0.9} ${h * 0.65} M ${w * 0.15} ${h * 0.4} L ${w * 0.15} ${h * 0.6} M ${w * 0.3} ${h * 0.4} L ${w * 0.3} ${h * 0.6} M ${w * 0.45} ${h * 0.4} L ${w * 0.45} ${h * 0.6}`;
}

function cpuPath(w: number, h: number): string {
  const m = w * 0.15;
  return `M ${m} ${m} L ${w - m} ${m} L ${w - m} ${h - m} L ${m} ${h - m} Z M ${w * 0.35} ${h * 0.35} L ${w * 0.65} ${h * 0.35} L ${w * 0.65} ${h * 0.65} L ${w * 0.35} ${h * 0.65} Z M ${w * 0.3} ${m} L ${w * 0.3} 0 M ${w * 0.5} ${m} L ${w * 0.5} 0 M ${w * 0.7} ${m} L ${w * 0.7} 0 M ${w * 0.3} ${h - m} L ${w * 0.3} ${h} M ${w * 0.5} ${h - m} L ${w * 0.5} ${h} M ${w * 0.7} ${h - m} L ${w * 0.7} ${h} M ${m} ${h * 0.3} L 0 ${h * 0.3} M ${m} ${h * 0.5} L 0 ${h * 0.5} M ${m} ${h * 0.7} L 0 ${h * 0.7} M ${w - m} ${h * 0.3} L ${w} ${h * 0.3} M ${w - m} ${h * 0.5} L ${w} ${h * 0.5} M ${w - m} ${h * 0.7} L ${w} ${h * 0.7}`;
}

function memoryPath(w: number, h: number): string {
  return `M 0 ${h * 0.2} L ${w} ${h * 0.2} L ${w} ${h * 0.8} L 0 ${h * 0.8} Z M ${w * 0.15} ${h * 0.2} L ${w * 0.15} 0 M ${w * 0.35} ${h * 0.2} L ${w * 0.35} 0 M ${w * 0.55} ${h * 0.2} L ${w * 0.55} 0 M ${w * 0.75} ${h * 0.2} L ${w * 0.75} 0 M ${w * 0.2} ${h * 0.4} L ${w * 0.4} ${h * 0.4} M ${w * 0.6} ${h * 0.4} L ${w * 0.8} ${h * 0.4}`;
}

function hardDrivePath(w: number, h: number): string {
  return `M 0 ${h * 0.3} L ${w} ${h * 0.3} L ${w} ${h * 0.7} L 0 ${h * 0.7} Z M ${w * 0.8} ${h * 0.5} m ${-h * 0.05} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${h * 0.1} 0 a ${h * 0.05} ${h * 0.05} 0 1 0 ${-h * 0.1} 0 M 0 ${h * 0.3} L ${w * 0.1} 0 L ${w * 0.4} 0 L ${w * 0.3} ${h * 0.3}`;
}

function gitBranchPath(w: number, h: number): string {
  const r = h * 0.1;
  return `M ${w * 0.2} ${r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.2} ${r} L ${w * 0.2} ${h * 0.5} M ${w * 0.8} ${r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.8} ${r} L ${w * 0.8} ${h * 0.5} M ${w * 0.2} ${h * 0.5} L ${w * 0.8} ${h * 0.5} M ${w * 0.5} ${h * 0.5} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function gitMergePath(w: number, h: number): string {
  const r = h * 0.1;
  return `M ${w * 0.2} ${r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.2} ${r} L ${w * 0.2} ${h * 0.7} M ${w * 0.8} ${r} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${w * 0.8} ${r} L ${w * 0.8} ${h * 0.5} Q ${w * 0.8} ${h * 0.7} ${w * 0.5} ${h * 0.7} L ${w * 0.2} ${h * 0.7} M ${w * 0.5} ${h * 0.7} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function gitCommitPath(w: number, h: number): string {
  const r = h * 0.15;
  return `M ${w * 0.5} 0 L ${w * 0.5} ${h} M ${w * 0.5} ${h * 0.5} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0`;
}

function dockerPath(w: number, h: number): string {
  const bw = w * 0.12;
  const bh = h * 0.15;
  return `M ${w * 0.2} ${h * 0.3} L ${w * 0.2 + bw} ${h * 0.3} L ${w * 0.2 + bw} ${h * 0.3 + bh} L ${w * 0.2} ${h * 0.3 + bh} Z M ${w * 0.35} ${h * 0.3} L ${w * 0.35 + bw} ${h * 0.3} L ${w * 0.35 + bw} ${h * 0.3 + bh} L ${w * 0.35} ${h * 0.3 + bh} Z M ${w * 0.5} ${h * 0.3} L ${w * 0.5 + bw} ${h * 0.3} L ${w * 0.5 + bw} ${h * 0.3 + bh} L ${w * 0.5} ${h * 0.3 + bh} Z M ${w * 0.35} ${h * 0.1} L ${w * 0.35 + bw} ${h * 0.1} L ${w * 0.35 + bw} ${h * 0.1 + bh} L ${w * 0.35} ${h * 0.1 + bh} Z M ${w * 0.2} ${h * 0.5} L ${w * 0.8} ${h * 0.5} Q ${w} ${h * 0.5} ${w} ${h * 0.7} Q ${w * 0.9} ${h * 0.9} ${w * 0.6} ${h * 0.9} Q ${w * 0.3} ${h * 0.9} ${w * 0.1} ${h * 0.7} Z`;
}

function kubernetesPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx} ${cy - r * 0.5} L ${cx} ${cy + r * 0.5} M ${cx - r * 0.5} ${cy} L ${cx + r * 0.5} ${cy} M ${cx - r * 0.4} ${cy - r * 0.4} L ${cx + r * 0.4} ${cy + r * 0.4} M ${cx + r * 0.4} ${cy - r * 0.4} L ${cx - r * 0.4} ${cy + r * 0.4}`;
}

function awsPath(w: number, h: number): string {
  return `M ${w * 0.1} ${h * 0.4} L ${w * 0.25} ${h * 0.6} L ${w * 0.4} ${h * 0.4} M ${w * 0.6} ${h * 0.4} L ${w * 0.75} ${h * 0.6} L ${w * 0.9} ${h * 0.4} M ${w * 0.3} ${h * 0.7} Q ${w * 0.5} ${h * 0.9} ${w * 0.7} ${h * 0.7}`;
}

function gcpPath(w: number, h: number): string {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  return `M ${cx} ${cy} m ${-r} 0 a ${r} ${r} 0 1 0 ${r * 2} 0 a ${r} ${r} 0 1 0 ${-r * 2} 0 M ${cx - r * 0.5} ${cy - r * 0.3} L ${cx + r * 0.5} ${cy - r * 0.3} M ${cx} ${cy - r * 0.3} L ${cx} ${cy + r * 0.5}`;
}

function azurePath(w: number, h: number): string {
  return `M ${w * 0.1} ${h * 0.8} L ${w * 0.4} ${h * 0.2} L ${w * 0.6} ${h * 0.5} L ${w * 0.5} ${h * 0.5} L ${w * 0.4} ${h * 0.4} L ${w * 0.3} ${h * 0.6} L ${w * 0.9} ${h * 0.6} L ${w * 0.9} ${h * 0.8} Z`;
}

// ─── Path map for complex shapes ───────────────────────────────────
const PATH_SHAPES: Partial<Record<ShapeType, (w: number, h: number) => string>> = {
  cloud: cloudPath,
  heart: heartPath,
  speechBubble: speechBubblePath,
  document: documentPath,
  multiDocument: multiDocumentPath,
  manualInput: manualInputPath,
  display: displayPath,
  manualOperation: manualOperationPath,
  preparation: preparationPath,
  terminator: terminatorPath,
  sort: sortPath,
  card: cardPath,
  delay: delayPath,
  loopLimit: loopLimitPath,
  storage: storagePath,
  internalStorage: internalStoragePath,
  sequentialData: sequentialDataPath,
  or: orPath,
  summingJunction: summingJunctionPath,
  api: apiPath,
  queue: queuePath,
  function: functionPath,
  lambda: lambdaPath,
  server: serverPath,
  web: webPath,
  mobile: mobilePath,
  user: userPath,
  users: usersPath,
  settings: gearPath,
  warning: warningPath,
  info: infoPath,
  check: checkPath,
  cross: crossPath,
  search: searchPath,
  bell: bellPath,
  mail: mailPath,
  clock: clockPath,
  calendar: calendarPath,
  folder: folderPath,
  file: filePath,
  image: imagePath,
  video: videoPath,
  audio: audioPath,
  lock: lockPath,
  key: keyPath,
  link: linkPath,
  download: downloadPath,
  upload: uploadPath,
  trash: trashPath,
  edit: editPath,
  copy: copyPath,
  filter: filterPath,
  sortIcon: sortIconPath,
  chart: chartPath,
  graph: graphPath,
  pie: piePath,
  table: tablePath,
  tree: treePath,
  network: networkPath,
  router: routerPath,
  switch: switchPath,
  firewall: firewallPath,
  cloudUpload: cloudUploadPath,
  cloudDownload: cloudDownloadPath,
  sync: syncPath,
  refresh: refreshPath,
  power: powerPath,
  battery: batteryPath,
  cpu: cpuPath,
  memory: memoryPath,
  hardDrive: hardDrivePath,
  gitBranch: gitBranchPath,
  gitMerge: gitMergePath,
  gitCommit: gitCommitPath,
  docker: dockerPath,
  kubernetes: kubernetesPath,
  aws: awsPath,
  gcp: gcpPath,
  azure: azurePath,
};

// ─── Main Shape Renderer Component ─────────────────────────────────
export interface ShapeRendererProps {
  element: Element;
  onRef?: (node: Konva.Node | null) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  /** Controlled externally — only true when tool === "select" and not locked */
  draggable?: boolean;
}

/**
 * Renders an individual UnifiedDraw Element onto the Konva Canvas.
 * Handles parsing of shape bounds, custom SVG path generation,
 * text rendering, and bounding-box highlighting for selected states.
 * 
 * @param props Contains the element data and interaction callbacks.
 */
export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  element,
  onRef,
  onClick,
  onDblClick,
  onDragEnd,
  onTransformEnd,
  draggable,
}) => {
  const {
    shapeType,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    dash,
    opacity,
    rotation,
    x,
    y,
  } = element;

  const theme = useStore((s) => s.theme);
  const isDark = theme === "dark";
  const displayStroke = isDark && (stroke === "#1e293b" || !stroke) ? "#ced4da" : (stroke || "#1e293b");

  const commonProps = {
    fill: fill || "transparent",
    stroke: displayStroke,
    strokeWidth: strokeWidth || 2,
    opacity: opacity ?? 1,
    dash,
  };

  // ─── Render based on shape type ──────────────────────────────────
  const renderShape = () => {
    if (!shapeType) return null;

    // Path-based shapes
    const pathFn = PATH_SHAPES[shapeType];
    if (pathFn) {
      const pathString = pathFn(width, height);
      if (element.roughness && element.roughness > 0) {
        return (
          <KonvaShape
            sceneFunc={(ctx) => {
              const d = getCachedDrawable(element, () => getRoughPathDrawable(pathString, width, height, element.roughness!, fill));
              if (d) drawDrawable(ctx, d);
            }}
            {...commonProps}
          />
        );
      }
      return (
        <Path
          data={pathString}
          {...commonProps}
        />
      );
    }

    switch (shapeType) {
      case "rectangle":
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughRectangleDrawable(width, height, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            cornerRadius={cornerRadius || 0}
            {...commonProps}
          />
        );

      case "circle": {
        const r = Math.min(width, height) / 2;
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughEllipseDrawable(r * 2, r * 2, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Circle
            x={width / 2}
            y={height / 2}
            radius={r}
            {...commonProps}
          />
        );
      }

      case "ellipse":
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughEllipseDrawable(width, height, element.roughness!, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Ellipse
            x={width / 2}
            y={height / 2}
            radiusX={width / 2}
            radiusY={height / 2}
            {...commonProps}
          />
        );

      case "diamond": {
        const pts = diamondPoints(width, height);
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughPolygonDrawable([[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]], [pts[6], pts[7]]], element.roughness!, true, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Line
            points={pts}
            closed
            {...commonProps}
          />
        );
      }

      case "triangle": {
        const pts = trianglePoints(width, height);
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughPolygonDrawable([[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]]], element.roughness!, true, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Line
            points={pts}
            closed
            {...commonProps}
          />
        );
      }

      case "pentagon":
        return (
          <RegularPolygon
            x={width / 2}
            y={height / 2}
            sides={5}
            radius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case "hexagon":
        return (
          <RegularPolygon
            x={width / 2}
            y={height / 2}
            sides={6}
            radius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case "octagon":
        return (
          <RegularPolygon
            x={width / 2}
            y={height / 2}
            sides={8}
            radius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case "star":
        return (
          <Star
            x={width / 2}
            y={height / 2}
            numPoints={5}
            innerRadius={Math.min(width, height) / 4}
            outerRadius={Math.min(width, height) / 2}
            {...commonProps}
          />
        );

      case "parallelogram": {
        const pts = parallelogramPoints(width, height);
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughPolygonDrawable([[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]], [pts[6], pts[7]]], element.roughness!, true, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Line
            points={pts}
            closed
            {...commonProps}
          />
        );
      }

      case "trapezoid": {
        const pts = trapezoidPoints(width, height);
        if (element.roughness && element.roughness > 0) {
          return (
            <KonvaShape
              sceneFunc={(ctx) => {
                const d = getCachedDrawable(element, () => getRoughPolygonDrawable([[pts[0], pts[1]], [pts[2], pts[3]], [pts[4], pts[5]], [pts[6], pts[7]]], element.roughness!, true, fill));
                if (d) drawDrawable(ctx, d);
              }}
              {...commonProps}
            />
          );
        }
        return (
          <Line
            points={pts}
            closed
            {...commonProps}
          />
        );
      }

      case "cylinder":
      case "database":
      case "databaseCylinder":
        return (
          <KonvaShape
            sceneFunc={(ctx, shape) => cylinderSceneFunc(ctx, shape, width, height)}
            {...commonProps}
          />
        );

      case "arrow":
      case "arrowRight":
        return (
          <Arrow
            points={[0, height / 2, width, height / 2]}
            pointerLength={Math.min(20, width * 0.2)}
            pointerWidth={Math.min(20, height * 0.8)}
            {...commonProps}
          />
        );

      case "arrowLeft":
        return (
          <Arrow
            points={[width, height / 2, 0, height / 2]}
            pointerLength={Math.min(20, width * 0.2)}
            pointerWidth={Math.min(20, height * 0.8)}
            {...commonProps}
          />
        );

      case "arrowUp":
        return (
          <Arrow
            points={[width / 2, height, width / 2, 0]}
            pointerLength={Math.min(20, height * 0.2)}
            pointerWidth={Math.min(20, width * 0.8)}
            {...commonProps}
          />
        );

      case "arrowDown":
        return (
          <Arrow
            points={[width / 2, 0, width / 2, height]}
            pointerLength={Math.min(20, height * 0.2)}
            pointerWidth={Math.min(20, width * 0.8)}
            {...commonProps}
          />
        );

      case "line":
        return (
          <Line
            points={[0, height / 2, width, height / 2]}
            {...commonProps}
          />
        );

      // Flowchart shapes that map to basic shapes
      case "process":
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            cornerRadius={0}
            {...commonProps}
          />
        );

      case "decision":
        return (
          <Line
            points={diamondPoints(width, height)}
            closed
            {...commonProps}
          />
        );

      case "data":
        return (
          <Line
            points={parallelogramPoints(width, height)}
            closed
            {...commonProps}
          />
        );

      default:
        // Fallback: render as rectangle
        return (
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            cornerRadius={cornerRadius || 0}
            {...commonProps}
          />
        );
    }
  };

  // ─── Render text inside shape ────────────────────────────────────
  const renderText = () => {
    if (!element.text) return null;
    const ts = element.textStyle;
    const bold = ts?.fontWeight === "bold";
    const italic = ts?.fontStyle === "italic";
    const fontStyleStr = bold && italic ? "bold italic" : bold ? "bold" : italic ? "italic" : "normal";
    return (
      <Text
        x={4}
        y={4}
        width={width - 8}
        height={height - 8}
        text={element.text}
        fontSize={ts?.fontSize || 16}
        fontStyle={fontStyleStr}
        fill={ts?.color || "#1e293b"}
        align={ts?.alignment || "center"}
        verticalAlign="middle"
        fontFamily={ts?.fontFamily || "Virgil,Segoe UI,cursive"}
        listening={false}
        wrap="word"
        ellipsis={true}
      />
    );
  };

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation || 0}
      id={element.id}
      draggable={draggable ?? (!element.locked)}
      onClick={onClick}
      onDblClick={onDblClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      ref={(node: Konva.Node | null) => onRef?.(node)}
    >
      {renderShape()}
      {renderText()}
    </Group>
  );
};

// ─── Freehand renderer ─────────────────────────────────────────────
// Points are stored as absolute world coordinates [[x1,y1],[x2,y2],...]
interface FreehandRendererProps {
  element: Element;
  onRef?: (node: Konva.Node | null) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export const FreehandRenderer: React.FC<FreehandRendererProps> = ({
  element,
  onRef,
  onClick,
}) => {
  const theme = useStore((s) => s.theme);
  const displayStroke = theme === "dark" && (element.stroke === "#1e293b" || !element.stroke) ? "#ced4da" : (element.stroke || "#1e293b");
  if (!element.points || element.points.length < 2) return null;
  
  if (element.roughness && element.roughness > 0) {
    return (
      <Path
        data={getFreehandSvgPath(element.points, element.strokeWidth || 4)}
        fill={element.stroke || "#1e293b"}
        opacity={element.opacity ?? 1}
        id={element.id}
        ref={(node: Konva.Node | null) => onRef?.(node)}
        onClick={onClick}
        hitStrokeWidth={12}
      />
    );
  }

  // Flatten [[x1,y1],[x2,y2]] -> [x1,y1,x2,y2] (absolute world coords)
  const flatPoints = element.points.flatMap((p) => p);
  return (
    <Line
      x={0}
      y={0}
      points={flatPoints}
      stroke={displayStroke}
      strokeWidth={element.strokeWidth || 2}
      lineCap="round"
      lineJoin="round"
      tension={0.4}
      opacity={element.opacity ?? 1}
      id={element.id}
      ref={(node: Konva.Node | null) => onRef?.(node)}
      onClick={onClick}
      hitStrokeWidth={12}
    />
  );
};

// ─── Connector renderer ────────────────────────────────────────────
// Points are stored as absolute world coordinates [[x1,y1],[x2,y2]]
interface ConnectorRendererProps {
  element: Element;
  onRef?: (node: Konva.Node | null) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export const ConnectorRenderer: React.FC<ConnectorRendererProps> = ({
  element,
  onRef,
  onClick,
}) => {
  const theme = useStore((s) => s.theme);
  const elements = useStore((s) => s.elements);
  const displayStroke = theme === "dark" && (element.stroke === "#1e293b" || !element.stroke) ? "#ced4da" : (element.stroke || "#1e293b");

  let p1 = { x: 0, y: 0, side: 0 };
  let p2 = { x: 0, y: 0, side: 0 };
  
  if (element.connector) {
    const srcEl = elements.find(e => e.id === element.connector?.sourceId);
    const tgtEl = elements.find(e => e.id === element.connector?.targetId);
    
    if (srcEl) {
      const srcPts = getConnectionPoints(srcEl);
      const side = element.connector.sourceConnectionPoint ?? 0;
      p1 = srcPts[side] || srcPts[0];
    }
    
    if (tgtEl) {
      const tgtPts = getConnectionPoints(tgtEl);
      const side = element.connector.targetConnectionPoint ?? 0;
      p2 = tgtPts[side] || tgtPts[0];
    } else if (element.points && element.points.length >= 2) {
      // Fallback for live drawing where target doesn't exist yet
      p2 = { x: element.points[1][0], y: element.points[1][1], side: 0 };
    }
  } else if (element.points && element.points.length >= 2) {
    p1 = { x: element.points[0][0], y: element.points[0][1], side: 0 };
    p2 = { x: element.points[1][0], y: element.points[1][1], side: 0 };
  } else {
    return null;
  }

  const isCurved = element.connector?.routingMode === "curved";
  const dashArray = element.connector?.strokeStyle === "dashed" ? [8, 8] : element.connector?.strokeStyle === "dotted" ? [2, 4] : undefined;

  // Arrow markers
  const startMarker = element.connector?.startMarker;
  const endMarker = element.connector?.endMarker;
  
  return (
    <Group ref={(node: Konva.Group | null) => onRef?.(node)} onClick={onClick} id={element.id}>
      {isCurved ? (
        <Path
          data={getCurvedPath(p1, p2)}
          stroke={displayStroke}
          strokeWidth={element.strokeWidth || 2}
          dash={dashArray || element.dash}
          opacity={element.opacity ?? 1}
          hitStrokeWidth={12}
          fill="transparent"
        />
      ) : (
        <Arrow
          points={[p1.x, p1.y, p2.x, p2.y]}
          stroke={displayStroke}
          strokeWidth={element.strokeWidth || 2}
          fill={displayStroke}
          dash={dashArray || element.dash}
          opacity={element.opacity ?? 1}
          hitStrokeWidth={12}
          pointerLength={endMarker === "arrow" ? 10 : 0}
          pointerWidth={endMarker === "arrow" ? 10 : 0}
          pointerAtBeginning={startMarker === "arrow"}
          pointerAtEnding={endMarker === "arrow"}
        />
      )}
      
      {/* Markers fallback if not handled by Arrow */}
      {isCurved && endMarker === "arrow" && (
         <Arrow
           points={[p2.x - 0.1, p2.y - 0.1, p2.x, p2.y]} // Hack for arrow on path
           stroke={displayStroke}
           strokeWidth={element.strokeWidth || 2}
           fill={displayStroke}
           pointerLength={10}
           pointerWidth={10}
         />
      )}
      {startMarker === "circle" && (
        <Circle x={p1.x} y={p1.y} radius={4} fill={displayStroke} />
      )}
      {endMarker === "circle" && (
        <Circle x={p2.x} y={p2.y} radius={4} fill={displayStroke} />
      )}
    </Group>
  );
};
// ─── Text element renderer ─────────────────────────────────────────
// Group-based so it supports dragging and transforming like ShapeRenderer
interface TextElementRendererProps {
  element: Element;
  onRef?: (node: Konva.Node | null) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDblClick?: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd?: (e: Konva.KonvaEventObject<Event>) => void;
  draggable?: boolean;
}

export const TextElementRenderer: React.FC<TextElementRendererProps> = ({
  element,
  onRef,
  onClick,
  onDblClick,
  onDragEnd,
  onTransformEnd,
  draggable,
}) => {
  const ts = element.textStyle;
  const bold = ts?.fontWeight === "bold";
  const italic = ts?.fontStyle === "italic";
  const fontStyleStr =
    bold && italic ? "bold italic" : bold ? "bold" : italic ? "italic" : "normal";

  return (
    <Group
      x={element.x}
      y={element.y}
      rotation={element.rotation || 0}
      id={element.id}
      draggable={draggable ?? !element.locked}
      onClick={onClick}
      onDblClick={onDblClick}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
      ref={(node: Konva.Node | null) => onRef?.(node)}
    >
      <Text
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        text={element.text || ""}
        fontSize={ts?.fontSize || 16}
        fontStyle={fontStyleStr}
        fill={ts?.color || "#f1f5f9"}
        align={ts?.alignment || "left"}
        verticalAlign="top"
        fontFamily={ts?.fontFamily || "Virgil,Segoe UI,cursive"}
        opacity={element.opacity ?? 1}
        wrap="word"
        listening={false}
      />
    </Group>
  );
};

// ─── Shape thumbnail for library sidebar ───────────────────────────
interface ShapeThumbnailProps {
  shapeType: ShapeType;
  size?: number;
}

export const ShapeThumbnail: React.FC<ShapeThumbnailProps> = ({ shapeType, size = 40 }) => {
  const meta = getShapeMeta(shapeType);
  const scale = Math.min(size / meta.defaultWidth, size / meta.defaultHeight) * 0.7;
  const elW = meta.defaultWidth * scale;
  const elH = meta.defaultHeight * scale;
  const offsetX = (size - elW) / 2;
  const offsetY = (size - elH) / 2;

  const element: Element = {
    id: "thumbnail",
    type: "shape",
    x: offsetX,
    y: offsetY,
    width: elW,
    height: elH,
    rotation: 0,
    shapeType,
    fill: meta.defaultFill,
    stroke: meta.defaultStroke,
    strokeWidth: 1.5,
    zIndex: 0,
    visible: true,
    locked: false,
  };

  return (
    <Group x={offsetX} y={offsetY}>
      <ShapeRenderer element={element} />
    </Group>
  );
};