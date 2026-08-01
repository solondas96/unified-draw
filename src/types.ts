// Core data models for UnifiedDraw

export type ToolType =
  | "select"
  | "freehand"
  | "rectangle"
  | "circle"
  | "diamond"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "connector"
  | "pan";

export type ElementType = "shape" | "text" | "connector" | "freehand";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "ellipse"
  | "diamond"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "star"
  | "arrow"
  | "arrowRight"
  | "arrowLeft"
  | "arrowUp"
  | "arrowDown"
  | "line"
  | "cylinder"
  | "parallelogram"
  | "trapezoid"
  | "cloud"
  | "heart"
  | "speechBubble"
  // Flowchart
  | "process"
  | "decision"
  | "terminator"
  | "data"
  | "document"
  | "multiDocument"
  | "manualInput"
  | "preparation"
  | "display"
  | "manualOperation"
  | "storage"
  | "internalStorage"
  | "sequentialData"
  | "sort"
  | "or"
  | "summingJunction"
  | "card"
  | "delay"
  | "loopLimit"
  // Data engineering
  | "database"
  | "databaseCylinder"
  | "api"
  | "queue"
  | "function"
  | "lambda"
  | "cloud"
  | "server"
  | "web"
  | "mobile"
  | "user"
  | "users"
  | "settings"
  | "warning"
  | "info"
  | "check"
  | "cross"
  | "search"
  | "bell"
  | "mail"
  | "clock"
  | "calendar"
  | "folder"
  | "file"
  | "image"
  | "video"
  | "audio"
  | "lock"
  | "key"
  | "link"
  | "download"
  | "upload"
  | "trash"
  | "edit"
  | "copy"
  | "filter"
  | "sortIcon"
  | "chart"
  | "graph"
  | "pie"
  | "table"
  | "tree"
  | "network"
  | "router"
  | "switch"
  | "firewall"
  | "cloudUpload"
  | "cloudDownload"
  | "sync"
  | "refresh"
  | "power"
  | "battery"
  | "cpu"
  | "memory"
  | "hardDrive"
  | "gitBranch"
  | "gitMerge"
  | "gitCommit"
  | "docker"
  | "kubernetes"
  | "aws"
  | "gcp"
  | "azure";

export interface TextStyle {
  fontSize: number;
  fontWeight: string; // "normal" | "bold"
  fontStyle: string; // "normal" | "italic"
  color: string;
  alignment: "left" | "center" | "right";
  fontFamily: string;
}

export interface Element {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  shapeType?: ShapeType;
  text?: string;
  textStyle?: TextStyle;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: Array<[number, number]>; // for freehand & connectors
  sourceId?: string; // for connectors
  targetId?: string; // for connectors
  zIndex: number;
  visible: boolean;
  locked: boolean;
  roughness?: number; // 0 = clean, 1-3 = hand-drawn
  opacity?: number;
  cornerRadius?: number;
  dash?: number[]; // dash pattern
}

export interface Canvas {
  id: string;
  name: string;
  version: number;
  createdAt: number;
  updatedAt: number;
  elements: Element[];
  zoom: number;
  panX: number;
  panY: number;
}

export interface ShapeLibraryItem {
  type: ShapeType;
  label: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFill: string;
  defaultStroke: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ExportFormat = "svg" | "png" | "json";