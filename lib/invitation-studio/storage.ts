import type { StudioDocument } from "./types";

const DB_NAME = "kefoo-invitation-studio";
const STORE = "documents";
const VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveStudioDocument(document: StudioDocument): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(document);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listStudioDocuments(): Promise<StudioDocument[]> {
  const db = await openDb();
  const rows = await new Promise<StudioDocument[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as StudioDocument[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadLatestStudioDocument(): Promise<StudioDocument | null> {
  const rows = await listStudioDocuments();
  return rows[0] ?? null;
}

export async function deleteStudioDocument(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
