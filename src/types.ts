// Core data models for UnifiedDraw

/**
 * Defines the currently active tool on the canvas.
 */
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

/**
 * Broad categories of elements that can be drawn on the canvas.
 */
export type ElementType = "shape" | "text" | "connector" | "freehand";

/**
 * Specific shape identifiers used to render predefined SVG paths or primitives.
 */
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

/**
 * Styling properties specific to Text elements.
 */
export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  color?: string;
  alignment: "left" | "center" | "right" | "justify";
  textDecoration?: "none" | "underline" | "line-through";
  lineHeight?: number;
}

export type ConnectorRoutingMode = "straight" | "curved" | "orthogonal";
export type ConnectorMarker = "none" | "arrow" | "circle";

export interface ConnectorData {
  sourceId?: string;
  targetId?: string;
  sourceConnectionPoint?: number;
  targetConnectionPoint?: number;
  routingMode: ConnectorRoutingMode;
  startMarker?: ConnectorMarker;
  endMarker?: ConnectorMarker;
  strokeStyle?: "solid" | "dashed" | "dotted";
}

/**
 * Represents a single node or object on the canvas (Shape, Text, Line, etc.).
 */
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
  connector?: ConnectorData;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  roughness?: number; // 0 = clean, 1-3 = hand-drawn
  opacity?: number;
  cornerRadius?: number;
  dash?: number[]; // dash pattern
}

/**
 * Represents the complete state of a document (diagram) stored in the database.
 */
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

/**
 * Metadata defining a shape in the sidebar library.
 */
export interface ShapeLibraryItem {
  type: ShapeType;
  label: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFill: string;
  defaultStroke: string;
}

/**
 * A standard 2D bounding box definition.
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Supported formats for exporting the canvas view.
 */
export type ExportFormat = "svg" | "png" | "json";