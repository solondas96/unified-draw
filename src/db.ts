import { openDB, type IDBPDatabase } from "idb";
import type { Canvas } from "./types";

const DB_NAME = "unified-draw";
const DB_VERSION = 1;
const CANVAS_STORE = "canvases";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CANVAS_STORE)) {
          const store = db.createObjectStore(CANVAS_STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("name", "name");
        }
      },
    });
  }
  return dbPromise;
}

// Save a canvas (upsert)
export async function saveCanvas(canvas: Canvas): Promise<void> {
  const db = await getDB();
  await db.put(CANVAS_STORE, canvas);
}

// Load a canvas by ID
export async function loadCanvas(id: string): Promise<Canvas | undefined> {
  const db = await getDB();
  return db.get(CANVAS_STORE, id);
}

// List all canvases (sorted by updatedAt desc)
export async function listCanvases(): Promise<Canvas[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex(CANVAS_STORE, "updatedAt");
  return all.reverse() as Canvas[];
}

// Delete a canvas
export async function deleteCanvas(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(CANVAS_STORE, id);
}

// Get the most recently updated canvas
export async function getLatestCanvas(): Promise<Canvas | undefined> {
  const all = await listCanvases();
  return all[0];
}

// Auto-save with debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function debouncedSave(canvas: Canvas, onStatus?: (s: "saving" | "saved") => void): void {
  if (saveTimer) clearTimeout(saveTimer);
  onStatus?.("saving");
  saveTimer = setTimeout(async () => {
    await saveCanvas(canvas);
    onStatus?.("saved");
  }, 800);
}