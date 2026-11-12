import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// Firestore DIMATIKAN. Penyimpanan permanen sekarang di Supabase (lewat server.ts).
// Semua blok `if (firestoreDb ...)` di bawah otomatis dilewati.
const firestoreDb: any = null;
export const db = null;


// Realtime connection state tracker
export type DbSyncStatus = 'connected' | 'syncing' | 'offline';
let currentDbSyncStatus: DbSyncStatus = 'connected';
const statusListeners = new Set<(status: DbSyncStatus) => void>();

export function getDbSyncStatus(): DbSyncStatus {
  return currentDbSyncStatus;
}

export function subscribeDbSyncStatus(cb: (status: DbSyncStatus) => void): () => void {
  statusListeners.add(cb);
  cb(currentDbSyncStatus);
  return () => {
    statusListeners.delete(cb);
  };
}

function updateDbSyncStatus(status: DbSyncStatus) {
  if (currentDbSyncStatus !== status) {
    currentDbSyncStatus = status;
    statusListeners.forEach((fn) => {
      try {
        fn(status);
      } catch {}
    });
  }
}

// Safe LocalStorage setter that gracefully handles QuotaExceededError
export function safeSetLocalStorage(key: string, data: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    console.warn(`[Storage] LocalStorage quota reached for key "${key}", purging older temporary cache...`);
    try {
      const keysToPurge: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('fokus_cache_') || k.includes('files') || k.includes('notifications') || k.includes('temp_'))) {
          keysToPurge.push(k);
        }
      }
      keysToPurge.forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(key, JSON.stringify(data));
    } catch (innerErr) {
      console.warn('[Storage] Could not persist to localStorage after purge:', innerErr);
    }
  }
}

// In-memory latest collections tracker to prevent any race condition from downgrading attachments
const inMemoryLatestCollections = new Map<string, any[]>();

// Track timestamps of locally modified docs so background snapshots never overwrite recent user inputs or uploads
const recentlyModifiedDocTimestamps = new Map<string, number>();

export function recordModifiedDocId(id: string) {
  if (!id) return;
  recentlyModifiedDocTimestamps.set(String(id), Date.now());
  // Keep protection active for 90 seconds
  setTimeout(() => {
    const ts = recentlyModifiedDocTimestamps.get(String(id));
    if (ts && Date.now() - ts >= 85000) {
      recentlyModifiedDocTimestamps.delete(String(id));
    }
  }, 90000);
}

// Set to track deleted IDs across the current session so deletions stick and never get resurrected by stale snapshots
export const recentlyDeletedIds = new Set<string>();

export function recordDeletedId(id: string) {
  if (!id) return;
  recentlyDeletedIds.add(String(id));
  recentlyModifiedDocTimestamps.delete(String(id));
  // Keep tombstone in memory for 10 minutes to protect against all delayed network snapshots
  setTimeout(() => {
    recentlyDeletedIds.delete(String(id));
  }, 10 * 60 * 1000);
}

/**
 * Check if a given value is a real custom uploaded/saved attachment (not empty and not an unsplash demo placeholder)
 */
export function isRealAttachment(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.includes('images.unsplash.com')) return false;
  return true;
}

export const MASTER_ATTACHMENT_KEYS = [
  'fotoUrl',
  'kkUrl',
  'kkName',
  'aktaUrl',
  'aktaName',
  'ktpUrl',
  'ktpName',
  'santriUrl',
  'santriName',
  'ijazahUrl',
  'ijazahName',
  'berkasUrl',
  'berkasName',
  'berkasType',
  'logoUrl',
  'stempelUrl',
  'stampUrl',
  'tandaTanganKetuaUrl',
  'tandaTanganSekretarisUrl',
  'signatureUrl',
  'suratUrl',
  'lampiranUrl',
  'dokumenUrl',
  'buktiUrl',
  'berkasList'
];

/**
 * Intelligent non-destructive merge:
 * 1. Preserves existing uploaded files/photo URLs if incoming has empty/placeholder
 * 2. Preserves newly created/edited local items against stale background snapshots
 * 3. Honors deleted IDs so deleted records are never resurrected
 */
export function mergeItemsPreservingAttachments<T extends { id: string }>(
  existingItems: T[] | undefined,
  incomingItems: T[]
): T[] {
  if (!Array.isArray(incomingItems)) {
    return (existingItems || []).filter((it) => it && it.id && !recentlyDeletedIds.has(String(it.id)));
  }

  // Filter out any tombstoned/deleted items from incoming
  const cleanIncoming = incomingItems.filter((it) => it && it.id && !recentlyDeletedIds.has(String(it.id)));

  if (!Array.isArray(existingItems) || existingItems.length === 0) {
    return cleanIncoming;
  }

  const existingMap = new Map<string, any>();
  existingItems.forEach((item) => {
    if (item && item.id && !recentlyDeletedIds.has(String(item.id))) {
      existingMap.set(String(item.id), item);
    }
  });

  const now = Date.now();
  const incomingIds = new Set<string>();
  const mergedIncoming = cleanIncoming.map((incoming) => {
    const incomingId = String(incoming.id);
    incomingIds.add(incomingId);
    const existing = existingMap.get(incomingId);
    if (!existing) return incoming;

    // Check if this document was modified locally recently (< 10 minutes)
    const localModifiedAt = recentlyModifiedDocTimestamps.get(incomingId);
    const isRecentlyModifiedLocally = localModifiedAt && (now - localModifiedAt < 600000);

    const incUpdated = (incoming as any).updatedAt ? new Date((incoming as any).updatedAt).getTime() : 0;
    const exUpdated = (existing as any).updatedAt ? new Date((existing as any).updatedAt).getTime() : 0;

    let merged: any;
    if (isRecentlyModifiedLocally && (!incUpdated || incUpdated <= localModifiedAt)) {
      // Local state is the freshest authoring source
      merged = { ...incoming, ...existing };
    } else if (incUpdated >= exUpdated) {
      merged = { ...existing, ...incoming };
    } else {
      merged = { ...incoming, ...existing };
    }

    // Attachment fields preservation guard:
    // If incoming omitted attachment keys or sent empty string and existing had real attachments, preserve them
    MASTER_ATTACHMENT_KEYS.forEach((key) => {
      const incVal = (incoming as any)[key];
      const exVal = (existing as any)[key];

      if ((incVal === undefined || incVal === '') && isRealAttachment(exVal)) {
        merged[key] = exVal;
      }

      // Explicitly safeguard custom uploaded organization logo & official stamp from default placeholder resets
      if ((key === 'logoUrl' || key === 'stempelUrl') && isRealAttachment(exVal) && exVal !== '/logo.png') {
        if ((!incVal || incVal === '/logo.png') && !isRecentlyModifiedLocally) {
          merged[key] = exVal;
        }
      }
    });

    // Custom multi-sheets array (berkasList) smart preservation
    if (Array.isArray((existing as any).berkasList) && (existing as any).berkasList.length > 0) {
      if (!Array.isArray((incoming as any).berkasList) || (incoming as any).berkasList.length === 0) {
        merged.berkasList = (existing as any).berkasList;
      } else {
        const mergedBerkas = [...(incoming as any).berkasList];
        (existing as any).berkasList.forEach((eb: any) => {
          if (eb && eb.id && !mergedBerkas.some((b: any) => b.id === eb.id)) {
            mergedBerkas.push(eb);
          }
        });
        merged.berkasList = mergedBerkas;
      }
    }

    return merged;
  });

  // Preserve local items that were created or modified on THIS device very recently (< 10 minutes)
  const preservedLocalOnly: T[] = [];
  existingItems.forEach((existing) => {
    if (existing && existing.id) {
      const existingId = String(existing.id);
      if (!incomingIds.has(existingId) && !recentlyDeletedIds.has(existingId)) {
        const localModifiedAt = recentlyModifiedDocTimestamps.get(existingId);
        if (localModifiedAt && (now - localModifiedAt < 600000)) {
          preservedLocalOnly.push(existing);
        }
      }
    }
  });

  return [...preservedLocalOnly, ...mergedIncoming];
}

// Clean sanitized data for safe storage
export function sanitizeForFirestore<T>(input: T): T {
  if (input === undefined) return '' as any;
  if (input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map((item) => sanitizeForFirestore(item)) as any;
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(input)) {
    result[key] = value !== undefined ? sanitizeForFirestore(value) : '';
  }
  return result as T;
}

// Multi-Subscriber Registry for collections: collectionName -> Set of listener callbacks
const collectionListeners = new Map<string, Set<(items: any[]) => void>>();
const lastNotifiedSerializedMap = new Map<string, string>();

export function notifyCollectionListeners(collectionName: string, items: any[], force = false) {
  const serialized = JSON.stringify(items);
  if (!force && lastNotifiedSerializedMap.get(collectionName) === serialized) {
    return; // Prevent duplicate state updates and unnecessary component re-renders
  }
  lastNotifiedSerializedMap.set(collectionName, serialized);

  const listeners = collectionListeners.get(collectionName);
  if (listeners && listeners.size > 0) {
    // Schedule dispatch asynchronously to avoid updating components during another component's render phase
    queueMicrotask(() => {
      listeners.forEach((cb) => {
        try {
          cb(items);
        } catch (err) {
          console.warn(`[Sync] Error in listener for ${collectionName}:`, err);
        }
      });
    });
  }
}

// Flag to track whether Firestore has loaded data for a collection
const cloudInitializedCollections = new Set<string>();

// Cross-tab broadcast channel for instantaneous zero-latency local updates
let syncBroadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    syncBroadcastChannel = new BroadcastChannel('fokus_realtime_central_db');
    syncBroadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'SYNC_COLLECTION') {
        const { collectionName, items, deletedId } = event.data;
        if (deletedId) {
          recordDeletedId(String(deletedId));
        }
        if (Array.isArray(items)) {
          const inMem = inMemoryLatestCollections.get(collectionName) || [];
          const merged = mergeItemsPreservingAttachments(inMem, items);
          inMemoryLatestCollections.set(collectionName, merged);
          notifyCollectionListeners(collectionName, merged);
          if (collectionName !== 'files') {
            safeSetLocalStorage(`fokus_v3_${collectionName}`, merged);
          }
        }
      }
    };
  }
} catch {}

// Real-Time Server-Sent Events (SSE) for multi-device sync
let sseEventSource: EventSource | null = null;
let reconnectTimer: any = null;

function setupRealtimeServerSync() {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;

  if (sseEventSource) {
    try {
      sseEventSource.close();
    } catch {}
  }

  try {
    sseEventSource = new EventSource('/api/db/stream');

    sseEventSource.onopen = () => {
      updateDbSyncStatus('connected');
    };

    sseEventSource.onmessage = (event) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'SYNC_COLLECTION' && data.collectionName && Array.isArray(data.items)) {
          if (data.metadata?.action === 'DELETE_DOC' && data.metadata?.updatedDocId) {
            recordDeletedId(String(data.metadata.updatedDocId));
          } else if (data.metadata?.deletedId) {
            recordDeletedId(String(data.metadata.deletedId));
          }

          const inMem = inMemoryLatestCollections.get(data.collectionName) || [];
          const merged = mergeItemsPreservingAttachments(inMem, data.items);
          inMemoryLatestCollections.set(data.collectionName, merged);
          notifyCollectionListeners(data.collectionName, merged);

          if (data.collectionName !== 'files') {
            safeSetLocalStorage(`fokus_v3_${data.collectionName}`, merged);
          }
        }
      } catch {}
    };

    sseEventSource.onerror = () => {
      if (sseEventSource) {
        try {
          sseEventSource.close();
        } catch {}
        sseEventSource = null;
      }
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        setupRealtimeServerSync();
      }, 2500);
    };
  } catch {}
}

if (typeof window !== 'undefined') {
  setupRealtimeServerSync();
}

// Track server versions for lightweight delta polling
let knownServerVersions: Record<string, number> = {};

/**
 * Fetch all collections in one fast batch
 */
export async function fetchAllCollectionsFromServer(): Promise<Record<string, any[]> | null> {
  try {
    const res = await fetch('/api/db/all', { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === 'ok' && json.data) {
      Object.entries(json.data).forEach(([colName, items]) => {
        if (colName === 'files') return;
        if (Array.isArray(items)) {
          const inMem = inMemoryLatestCollections.get(colName) || [];
          const merged = mergeItemsPreservingAttachments(inMem, items);
          inMemoryLatestCollections.set(colName, merged);
          notifyCollectionListeners(colName, merged);
          const cacheKey = `fokus_v3_${colName}`;
          safeSetLocalStorage(cacheKey, merged);
        }
      });
      updateDbSyncStatus('connected');
      return json.data;
    }
  } catch {}
  return null;
}

/**
 * Lightweight background auto-sync polling loop every 3.5s
 * Ensures multi-device sync works seamlessly even across networks where SSE/long-polling is throttled by mobile OS
 */
let pollingInterval: any = null;
function startActivePollingSync() {
  if (typeof window === 'undefined') return;
  if (pollingInterval) clearInterval(pollingInterval);

  pollingInterval = setInterval(async () => {
    if (!navigator.onLine) return;
    try {
      const res = await fetch('/api/db/versions', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok' && json.versions) {
          let hasDiff = false;
          for (const [col, ver] of Object.entries(json.versions)) {
            if (knownServerVersions[col] !== ver) {
              hasDiff = true;
              break;
            }
          }
          if (hasDiff) {
            knownServerVersions = { ...json.versions };
            await fetchAllCollectionsFromServer();
          }
        }
      }
    } catch {}
  }, 3500);
}

if (typeof window !== 'undefined') {
  startActivePollingSync();
}

// Background sync on network reconnect, tab focus, mobile app resume
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    updateDbSyncStatus('syncing');
    setupRealtimeServerSync();
    fetchAllCollectionsFromServer();
  });

  window.addEventListener('offline', () => {
    updateDbSyncStatus('offline');
  });

  let lastWindowFocusSync = 0;
  window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastWindowFocusSync > 15000 && navigator.onLine) {
      lastWindowFocusSync = now;
      fetchAllCollectionsFromServer();
    }
  });

  document.addEventListener('visibilitychange', () => {
    const now = Date.now();
    if (document.visibilityState === 'visible' && now - lastWindowFocusSync > 15000 && navigator.onLine) {
      lastWindowFocusSync = now;
      setupRealtimeServerSync();
      fetchAllCollectionsFromServer();
    }
  });

  // Debounced touch interaction sync for mobile devices
  let lastTouchSync = 0;
  window.addEventListener('touchstart', () => {
    const now = Date.now();
    if (now - lastTouchSync > 15000 && navigator.onLine) {
      lastTouchSync = now;
      fetchAllCollectionsFromServer();
    }
  }, { passive: true });
}

/**
 * Realtime multi-user collection sync from Cloud Firestore + Local Cache + Central Server Database.
 * Guarantees data NEVER gets wiped or replaced with default initialData if user data exists.
 */
export function syncCollection<T extends { id: string }>(
  collectionName: string,
  initialData: T[],
  onData: (data: T[]) => void
): () => void {
  // Register listener in multi-subscriber Map
  let listeners = collectionListeners.get(collectionName);
  if (!listeners) {
    listeners = new Set();
    collectionListeners.set(collectionName, listeners);
  }
  listeners.add(onData);

  const cacheKey = `fokus_v3_${collectionName}`;

  // 1. Immediate Local Storage Cache Read (Instant UI render without flicker)
  let hasLocalData = false;
  const inMem = inMemoryLatestCollections.get(collectionName);
  if (inMem && Array.isArray(inMem) && inMem.length > 0) {
    queueMicrotask(() => onData(inMem as T[]));
    hasLocalData = true;
  } else {
    const localCache = localStorage.getItem(cacheKey) || localStorage.getItem(`fokus_cache_${collectionName}`);
    if (localCache) {
      try {
        const parsed = JSON.parse(localCache);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryLatestCollections.set(collectionName, parsed);
          queueMicrotask(() => onData(parsed));
          hasLocalData = true;
        }
      } catch {}
    }
  }

  if (!hasLocalData) {
    inMemoryLatestCollections.set(collectionName, initialData);
  }

  // 2. Real-time Cloud Firestore Listener (Authoritative Cloud Source of Truth)
  let unsubFirestore: (() => void) | null = null;
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'fokus_db', collectionName);
      unsubFirestore = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data && Array.isArray(data.items)) {
              cloudInitializedCollections.add(collectionName);
              const existingList: T[] = (inMemoryLatestCollections.get(collectionName) as T[]) || [];
              const mergedItems = mergeItemsPreservingAttachments(existingList, data.items as T[]);
              inMemoryLatestCollections.set(collectionName, mergedItems);
              notifyCollectionListeners(collectionName, mergedItems);
              if (collectionName !== 'files') {
                safeSetLocalStorage(cacheKey, mergedItems);
              }
              // Keep server memory in sync with authoritative cloud data if not a local pending write
              if (!docSnap.metadata.hasPendingWrites && mergedItems.length >= existingList.length) {
                fetch(`/api/db/${collectionName}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ items: mergedItems })
                }).catch(() => {});
              }
              return;
            }
          }

          // Document does not exist in Firestore yet (first time initialization)
          if (!cloudInitializedCollections.has(collectionName)) {
            cloudInitializedCollections.add(collectionName);
            let dataToPersist = initialData;
            const currentCache = localStorage.getItem(cacheKey);
            if (currentCache) {
              try {
                const parsed = JSON.parse(currentCache);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  dataToPersist = parsed;
                }
              } catch {}
            }
            if (collectionName !== 'files') {
              setDoc(docRef, {
                items: sanitizeForFirestore(dataToPersist),
                updatedAt: new Date().toISOString(),
                count: dataToPersist.length
              }, { merge: true }).catch(() => {});
            }
          }
        },
        (error) => {
          console.warn(`[Firestore Sync] onSnapshot notice for ${collectionName}:`, error);
        }
      );
    } catch (err) {
      console.warn(`[Firestore Sync] Init error for ${collectionName}:`, err);
    }
  }

  // 3. Central Server API query as backup
  fetch(`/api/db/${collectionName}`, { cache: 'no-store' })
    .then((res) => res.json())
    .then((json) => {
      if (json.status === 'ok' && Array.isArray(json.items) && json.items.length > 0) {
        const existingList: T[] = (inMemoryLatestCollections.get(collectionName) as T[]) || [];
        const mergedItems = mergeItemsPreservingAttachments(existingList, json.items as T[]);
        inMemoryLatestCollections.set(collectionName, mergedItems);
        notifyCollectionListeners(collectionName, mergedItems);
        if (collectionName !== 'files') {
          safeSetLocalStorage(cacheKey, mergedItems);
        }
      }
    })
    .catch(() => {});

  return () => {
    const list = collectionListeners.get(collectionName);
    if (list) {
      list.delete(onData);
      if (list.size === 0) {
        collectionListeners.delete(collectionName);
        if (unsubFirestore) {
          try {
            unsubFirestore();
          } catch {}
        }
      }
    }
  };
}

/**
 * Bulk save / update collection across Local Cache, Cloud Firestore, and Central Server.
 */
export async function saveCollection<T extends { id: string }>(
  collectionName: string,
  items: T[]
): Promise<void> {
  const cacheKey = `fokus_v3_${collectionName}`;
  const sanitizedItems = sanitizeForFirestore(items);

  // Track modification timestamps for items
  sanitizedItems.forEach((it) => {
    if (it && it.id) {
      recordModifiedDocId(String(it.id));
    }
  });

  // 0. Update in-memory tracker & local listeners immediately
  inMemoryLatestCollections.set(collectionName, sanitizedItems);
  notifyCollectionListeners(collectionName, sanitizedItems);

  // 1. Instant local storage update
  if (collectionName !== 'files') {
    safeSetLocalStorage(cacheKey, sanitizedItems);
  }

  // 2. Cross-tab immediate notification
  if (syncBroadcastChannel) {
    try {
      syncBroadcastChannel.postMessage({
        type: 'SYNC_COLLECTION',
        collectionName,
        items: sanitizedItems
      });
    } catch {}
  }

  // 3. Central Server Database Update
  try {
    await fetch(`/api/db/${collectionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: sanitizedItems })
    });
    updateDbSyncStatus('connected');
  } catch (err) {
    console.debug('Server saveCollection notice:', err);
  }

  // 4. Cloud Firestore Persistent Storage (Dual-Layer: Root doc + Individual items)
  if (firestoreDb && collectionName !== 'files') {
    try {
      const rootDocRef = doc(firestoreDb, 'fokus_db', collectionName);
      await setDoc(rootDocRef, {
        items: sanitizedItems,
        updatedAt: new Date().toISOString(),
        count: sanitizedItems.length
      }, { merge: true });

      // Also persist individual docs in parallel to bypass 1MB single-document limits
      Promise.all(
        sanitizedItems.slice(0, 300).map((it) => {
          if (!it || !it.id) return Promise.resolve();
          const itemDocRef = doc(firestoreDb!, 'fokus_db', collectionName, 'items', String(it.id));
          return setDoc(itemDocRef, it, { merge: true }).catch(() => {});
        })
      ).catch(() => {});
    } catch (err) {
      console.warn(`[Firestore saveCollection] Error for ${collectionName}:`, err);
    }
  }
}

/**
 * Save / Update a single document across Local Cache, Central Server, and Cloud Firestore.
 */
export async function saveDoc<T extends { id: string }>(
  collectionName: string,
  data: T
): Promise<void> {
  const cacheKey = `fokus_v3_${collectionName}`;
  const sanitized = sanitizeForFirestore({
    ...data,
    updatedAt: (data as any).updatedAt || new Date().toISOString()
  });

  if (sanitized && sanitized.id) {
    recordModifiedDocId(String(sanitized.id));
  }

  try {
    const cached = localStorage.getItem(cacheKey);
    let items: T[] = cached ? JSON.parse(cached) : [];
    const idx = items.findIndex((it) => String(it.id) === String(sanitized.id));
    if (idx >= 0) {
      items[idx] = { ...items[idx], ...sanitized };
    } else {
      items.unshift(sanitized);
    }

    if (collectionName !== 'files') {
      safeSetLocalStorage(cacheKey, items);
    }
    inMemoryLatestCollections.set(collectionName, items);
    notifyCollectionListeners(collectionName, items);

    if (syncBroadcastChannel) {
      try {
        syncBroadcastChannel.postMessage({
          type: 'SYNC_COLLECTION',
          collectionName,
          items
        });
      } catch {}
    }

    // Central Server Update
    await fetch(`/api/db/${collectionName}/doc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitized)
    });

    updateDbSyncStatus('connected');

    // Cloud Firestore Backup (Dual-Layer: Root doc + Individual document doc)
    if (firestoreDb && collectionName !== 'files') {
      const rootDocRef = doc(firestoreDb, 'fokus_db', collectionName);
      setDoc(rootDocRef, {
        items: sanitizeForFirestore(items),
        updatedAt: new Date().toISOString(),
        count: items.length
      }, { merge: true }).catch(() => {});

      if (sanitized && sanitized.id) {
        const itemDocRef = doc(firestoreDb, 'fokus_db', collectionName, 'items', String(sanitized.id));
        setDoc(itemDocRef, sanitized, { merge: true }).catch(() => {});
      }
    }
  } catch (err) {
    console.debug('saveDoc notice:', err);
  }
}

/**
 * Delete a single document from Local Cache, Central Server, and Cloud Firestore.
 */
export async function deleteDocFromDb(
  collectionName: string,
  docId: string
): Promise<void> {
  const cacheKey = `fokus_v3_${collectionName}`;
  recordDeletedId(docId);

  try {
    const inMem = inMemoryLatestCollections.get(collectionName) || [];
    const updatedInMem = inMem.filter((it: any) => String(it.id) !== String(docId));
    inMemoryLatestCollections.set(collectionName, updatedInMem);
    notifyCollectionListeners(collectionName, updatedInMem);

    const cached = localStorage.getItem(cacheKey);
    let items = updatedInMem;
    if (cached) {
      try {
        items = JSON.parse(cached).filter((it: any) => String(it.id) !== String(docId));
      } catch {}
    }

    if (collectionName !== 'files') {
      safeSetLocalStorage(cacheKey, items);
    }

    if (syncBroadcastChannel) {
      try {
        syncBroadcastChannel.postMessage({
          type: 'SYNC_COLLECTION',
          collectionName,
          items,
          deletedId: docId
        });
      } catch {}
    }

    // Central Server Delete
    await fetch(`/api/db/${collectionName}/${docId}`, {
      method: 'DELETE'
    });

    updateDbSyncStatus('connected');

    // Cloud Firestore Delete (Dual-Layer)
    if (firestoreDb && collectionName !== 'files') {
      const rootDocRef = doc(firestoreDb, 'fokus_db', collectionName);
      setDoc(rootDocRef, {
        items: sanitizeForFirestore(items),
        updatedAt: new Date().toISOString(),
        count: items.length
      }, { merge: true }).catch(() => {});

      const itemDocRef = doc(firestoreDb, 'fokus_db', collectionName, 'items', String(docId));
      deleteDoc(itemDocRef).catch(() => {});
    }
  } catch (err) {
    console.debug('deleteDoc notice:', err);
  }
}

/**
 * Manually force refresh all collections from Cloud Firestore / Server
 */
export async function forceRefreshAllCollections(): Promise<boolean> {
  updateDbSyncStatus('syncing');
  try {
    const data = await fetchAllCollectionsFromServer();
    updateDbSyncStatus('connected');
    return !!data;
  } catch {
    updateDbSyncStatus('connected');
    return false;
  }
}

/**
 * Saves a file permanently into Cloud Firestore under `fokus_files/{safeFileId}`
 * Guarantees uploaded santri photos and documents persist in Google Cloud Firestore.
 */
export async function saveFileToCloudFirestore(
  fileKey: string,
  dataUrl: string,
  metadata: { filename?: string; size?: number; type?: string } = {}
): Promise<void> {
  if (!firestoreDb || !fileKey || !dataUrl) return;
  // Firestore doc IDs cannot contain slashes or special characters
  const safeId = fileKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  try {
    const fileDocRef = doc(firestoreDb, 'fokus_files', safeId);
    await setDoc(fileDocRef, {
      fileKey,
      filename: metadata.filename || fileKey,
      dataUrl,
      size: metadata.size || dataUrl.length,
      type: metadata.type || 'image/jpeg',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Notice saving permanent file to cloud:', err);
  }
}

/**
 * Loads a file dataUrl from Cloud Firestore if missing locally or from server disk
 */
export async function loadFileFromCloudFirestore(fileKey: string): Promise<string | null> {
  if (!firestoreDb || !fileKey) return null;
  const safeId = fileKey.replace(/[^a-zA-Z0-9._-]/g, '_');
  try {
    const fileDocRef = doc(firestoreDb, 'fokus_files', safeId);
    const snap = await getDoc(fileDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return data?.dataUrl || null;
    }
  } catch {
    return null;
  }
  return null;
}
