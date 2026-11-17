/**
 * Keeps an unsent claim on this device (IndexedDB, files included), so a refresh or a failed
 * send does not wipe what the customer filled in. Cleared after a successful send; expires after 7 days.
 */
const DB_NAME = "travelsure-claim";
const STORE = "drafts";
const KEY = "current";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const run = async <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

export async function saveClaimDraft<T extends object>(draft: T): Promise<void> {
  try {
    await run("readwrite", (s) => s.put({ savedAt: Date.now(), draft }, KEY));
  } catch (err) {
    console.warn("Claim draft not saved:", err);
  }
}

export async function loadClaimDraft<T>(): Promise<T | null> {
  try {
    const row = await run<{ savedAt: number; draft: T } | undefined>("readonly", (s) => s.get(KEY));
    if (!row) return null;
    if (Date.now() - row.savedAt > MAX_AGE_MS) {
      await clearClaimDraft();
      return null;
    }
    return row.draft;
  } catch (err) {
    console.warn("Claim draft not loaded:", err);
    return null;
  }
}

export async function clearClaimDraft(): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } catch (err) {
    console.warn("Claim draft not cleared:", err);
  }
}
