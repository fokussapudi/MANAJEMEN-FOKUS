/**
 * IndexedDB Permanent Media Vault for FOKUS Applet
 * Stores photos and documents permanently in the browser storage (quota up to gigabytes)
 * completely bypassing localStorage 5MB limit.
 */

const DB_NAME = 'fokus_vault_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

export interface MediaVaultEntry {
  key: string;
  filename: string;
  dataUrl: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

function openVaultDatabase(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not supported in this environment'));
  }

  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('filename', 'filename', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        dbInstance.onclose = () => {
          dbInstance = null;
          dbInitPromise = null;
        };
        resolve(dbInstance);
      };

      request.onerror = (event) => {
        dbInitPromise = null;
        reject((event.target as IDBOpenDBRequest).error);
      };
    } catch (err) {
      dbInitPromise = null;
      reject(err);
    }
  });

  return dbInitPromise;
}

/**
 * Normalizes file keys so `/uploads/filename.jpg`, `filename.jpg`, and URL-encoded strings match
 */
export function normalizeVaultKey(key: string): string {
  if (!key) return '';
  let clean = key.trim();
  // Strip any query string
  if (clean.includes('?')) {
    clean = clean.split('?')[0];
  }
  return clean;
}

export function extractFileName(key: string): string {
  const norm = normalizeVaultKey(key);
  const parts = norm.split('/');
  return parts[parts.length - 1] || norm;
}

/**
 * Permanently save media file (base64 Data URL) into IndexedDB
 */
export async function saveMediaToVault(
  key: string,
  dataUrl: string,
  metadata: { filename?: string; type?: string; size?: number } = {}
): Promise<void> {
  if (!key || !dataUrl) return;
  const normKey = normalizeVaultKey(key);
  const fileName = metadata.filename || extractFileName(normKey);

  try {
    const db = await openVaultDatabase();
    const now = new Date().toISOString();

    const entry: MediaVaultEntry = {
      key: normKey,
      filename: fileName,
      dataUrl,
      size: metadata.size || (dataUrl.length * 0.75),
      type: metadata.type || (dataUrl.startsWith('data:image/png') ? 'image/png' : dataUrl.startsWith('data:application/pdf') ? 'application/pdf' : 'image/jpeg'),
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      store.put(entry);

      // If key is a path like /uploads/xyz.jpg, also store an alias under pure filename xyz.jpg
      if (normKey.includes('/') && fileName !== normKey) {
        store.put({
          ...entry,
          key: fileName
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaVault] Failed to save media to IndexedDB:', err);
  }
}

/**
 * Retrieve media file (base64 Data URL) from IndexedDB
 */
export async function getMediaFromVault(key: string): Promise<string | null> {
  if (!key) return null;
  const normKey = normalizeVaultKey(key);
  const fileName = extractFileName(normKey);

  // If already a base64 data URL, return directly
  if (key.startsWith('data:')) {
    return key;
  }

  try {
    const db = await openVaultDatabase();

    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);

      // 1. Try exact normalized key
      const req = store.get(normKey);

      req.onsuccess = () => {
        if (req.result && req.result.dataUrl) {
          resolve(req.result.dataUrl);
          return;
        }

        // 2. Try by pure filename
        if (fileName && fileName !== normKey) {
          const fnReq = store.get(fileName);
          fnReq.onsuccess = () => {
            if (fnReq.result && fnReq.result.dataUrl) {
              resolve(fnReq.result.dataUrl);
            } else {
              // 3. Try index search
              try {
                const index = store.index('filename');
                const idxReq = index.get(fileName);
                idxReq.onsuccess = () => {
                  resolve(idxReq.result?.dataUrl || null);
                };
                idxReq.onerror = () => resolve(null);
              } catch {
                resolve(null);
              }
            }
          };
          fnReq.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Check if a media file exists in IndexedDB vault
 */
export async function hasMediaInVault(key: string): Promise<boolean> {
  const res = await getMediaFromVault(key);
  return !!res;
}

/**
 * Delete a media file from IndexedDB vault
 */
export async function deleteMediaFromVault(key: string): Promise<void> {
  if (!key) return;
  const normKey = normalizeVaultKey(key);
  const fileName = extractFileName(normKey);

  try {
    const db = await openVaultDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(normKey);
      if (fileName && fileName !== normKey) {
        store.delete(fileName);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[MediaVault] Failed to delete media from IndexedDB:', err);
  }
}

/**
 * Get count and estimated storage size of stored media
 */
export async function getVaultStats(): Promise<{ count: number; totalBytes: number }> {
  try {
    const db = await openVaultDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const items = req.result || [];
        let totalBytes = 0;
        // Count only unique entries (avoid double counting key and filename aliases)
        const uniqueEntries = new Set<string>();
        items.forEach((it) => {
          if (it.filename && !uniqueEntries.has(it.filename)) {
            uniqueEntries.add(it.filename);
            totalBytes += it.size || 0;
          }
        });
        resolve({ count: uniqueEntries.size, totalBytes });
      };

      req.onerror = () => resolve({ count: 0, totalBytes: 0 });
    });
  } catch {
    return { count: 0, totalBytes: 0 };
  }
}
