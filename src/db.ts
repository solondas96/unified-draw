import { openDB, type IDBPDatabase } from "idb";
import type { Canvas } from "./types";

const DB_NAME = "unified-draw";
const DB_VERSION = 1;
const CANVAS_STORE = "canvases";

let dbPromise: Promise<IDBPDatabase | null> | null = null;

/**
 * Initializes and returns the IndexedDB instance.
 * If IndexedDB is unavailable (e.g. Firefox Private Browsing), it logs a warning
 * and resolves to `null` to gracefully fall back rather than crashing.
 * 
 * @returns A promise that resolves to the IDBPDatabase instance or null if unavailable.
 */
async function getDB(): Promise<IDBPDatabase | null> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CANVAS_STORE)) {
          const store = db.createObjectStore(CANVAS_STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
          store.createIndex("name", "name");
        }
      },
    }).catch((error) => {
      console.warn("IndexedDB is not available. Changes will not be saved locally.", error);
      return null;
    });
  }
  return dbPromise;
}

/**
 * Saves a canvas document to IndexedDB (upsert).
 * 
 * @param canvas The canvas document to save.
 */
export async function saveCanvas(canvas: Canvas): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return; // Fallback: do nothing if DB is unavailable
    await db.put(CANVAS_STORE, canvas);
  } catch (error) {
    console.error("Failed to save canvas to IndexedDB:", error);
  }
}

/**
 * Loads a canvas document by its ID.
 * 
 * @param id The unique identifier of the canvas.
 * @returns The canvas document if found, otherwise undefined.
 */
export async function loadCanvas(id: string): Promise<Canvas | undefined> {
  try {
    const db = await getDB();
    if (!db) return undefined;
    return await db.get(CANVAS_STORE, id);
  } catch (error) {
    console.error("Failed to load canvas from IndexedDB:", error);
    return undefined;
  }
}

/**
 * Retrieves all canvas documents stored locally, sorted by most recently updated.
 * 
 * @returns An array of Canvas documents.
 */
export async function listCanvases(): Promise<Canvas[]> {
  try {
    const db = await getDB();
    if (!db) return [];
    const all = await db.getAllFromIndex(CANVAS_STORE, "updatedAt");
    return all.reverse() as Canvas[];
  } catch (error) {
    console.error("Failed to list canvases from IndexedDB:", error);
    return [];
  }
}

/**
 * Deletes a canvas document from local storage.
 * 
 * @param id The unique identifier of the canvas to delete.
 */
export async function deleteCanvas(id: string): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;
    await db.delete(CANVAS_STORE, id);
  } catch (error) {
    console.error("Failed to delete canvas from IndexedDB:", error);
  }
}

/**
 * Gets the most recently updated canvas from local storage.
 * 
 * @returns The latest Canvas document, or undefined if the database is empty or unavailable.
 */
export async function getLatestCanvas(): Promise<Canvas | undefined> {
  try {
    const all = await listCanvases();
    return all[0];
  } catch (error) {
    console.error("Failed to get latest canvas:", error);
    return undefined;
  }
}

// Auto-save with debounce
let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Debounces the save operation to prevent excessive database writes.
 * Emits status updates via the optional `onStatus` callback.
 * 
 * @param canvas The canvas document to save.
 * @param onStatus Optional callback to report saving status ("saving" or "saved").
 */
export function debouncedSave(canvas: Canvas, onStatus?: (s: "saving" | "saved") => void): void {
  if (saveTimer) clearTimeout(saveTimer);
  onStatus?.("saving");
  
  saveTimer = setTimeout(async () => {
    try {
      await saveCanvas(canvas);
    } catch (error) {
      console.error("Auto-save failed:", error);
    } finally {
      onStatus?.("saved");
    }
  }, 800);
}