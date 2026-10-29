import type { VideoDraft } from "./types";

const DB_NAME = "kefoo-video-invitation-studio";
const STORE = "drafts";
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

export async function saveVideoDraft(draft: VideoDraft): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(draft);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function listVideoDrafts(): Promise<VideoDraft[]> {
  const db = await openDb();
  const drafts = await new Promise<VideoDraft[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result as VideoDraft[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return drafts.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function loadVideoDraft(id: string): Promise<VideoDraft | null> {
  const db = await openDb();
  const draft = await new Promise<VideoDraft | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(id);
    request.onsuccess = () => resolve((request.result as VideoDraft | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return draft;
}

export async function deleteVideoDraft(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
