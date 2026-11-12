import 'dotenv/config';
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initialRolePermissions,
  initialUsers,
  initialExpedisiRows,
  initialLombaRows,
  initialKhotmilJadwal,
  initialKhotmilAbsen,
  initialHadrahJadwal,
  initialIuranRows,
  initialTanggunganRows,
  initialDonaturRows,
  initialSahmasyRows,
  initialNotifications,
  initialAgendaList,
  initialOrganizationProfile
} from './src/data/initialData';

const app = express();
const PORT = 3000;

// Enable JSON body parsing with large payload capacity
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS & No-Cache middleware for immediate fresh data on all devices
app.use((req, res, next) => {
  // Frontend & API satu origin, tidak perlu CORS terbuka.
  next();
});

// ==========================================
// SUPABASE (database Postgres + Storage privat)
// ==========================================
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[Server] SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi (Secrets / env).');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const BUCKET = 'berkas';

const MIME_BY_EXT: Record<string, string> = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
  gif: 'image/gif', svg: 'image/svg+xml', pdf: 'application/pdf'
};
const mimeOf = (name: string) => MIME_BY_EXT[path.extname(name).toLowerCase().replace('.', '')] || 'application/octet-stream';

// Struktur awal (dipakai hanya jika Supabase masih kosong)
const initialDbState: Record<string, any[]> = {
  sahmasy: initialSahmasyRows,
  users: initialUsers,
  rolePermissions: initialRolePermissions,
  expedisi: initialExpedisiRows,
  agenda: initialAgendaList,
  lomba: initialLombaRows,
  khotmilJadwal: initialKhotmilJadwal,
  khotmilAbsen: initialKhotmilAbsen,
  hadrahJadwal: initialHadrahJadwal,
  iuran: initialIuranRows,
  tanggungan: initialTanggunganRows,
  donatur: initialDonaturRows,
  transactions: [],
  notifications: initialNotifications,
  organizationProfile: [initialOrganizationProfile],
  files: []
};

// Cache di memori (cepat untuk dibaca). Sumber kebenaran = Supabase.
let dbStore: Record<string, any[]> = {};
const minPos: Record<string, number> = {};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function dbUpsertRows(col: string, items: any[], startPos = 0) {
  const rows = items.map((it, i) => ({
    collection: col,
    id: String(it.id),
    data: it,
    pos: startPos + i,
    updated_at: new Date().toISOString()
  }));
  for (const part of chunk(rows, 200)) {
    const { error } = await sb.from('records').upsert(part, { onConflict: 'collection,id' });
    if (error) throw error;
  }
}

async function dbDeleteRows(col: string, ids: string[]) {
  for (const part of chunk(ids, 200)) {
    const { error } = await sb.from('records').delete().eq('collection', col).in('id', part);
    if (error) throw error;
  }
}

async function loadAllFromSupabase(): Promise<Record<string, any[]>> {
  const store: Record<string, any[]> = {};
  const PAGE = 1000;
  let from = 0;
  while (true) {
    const { data, error } = await sb
      .from('records')
      .select('collection,id,data,pos')
      .order('collection', { ascending: true })
      .order('pos', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data || []) {
      (store[r.collection] ||= []).push(r.data);
      minPos[r.collection] = Math.min(minPos[r.collection] ?? 0, r.pos);
    }
    if (!data || data.length < PAGE) break;
    from += PAGE;
  }
  return store;
}

async function initDatabase() {
  const loaded = await loadAllFromSupabase();
  if (Object.keys(loaded).length === 0) {
    console.log('[Server DB] Supabase kosong, mengisi data awal...');
    for (const [col, items] of Object.entries(initialDbState)) {
      if (items.length) await dbUpsertRows(col, items);
    }
    dbStore = { ...initialDbState };
  } else {
    dbStore = { ...initialDbState, ...loaded };
    // Koleksi yang sudah ada di Supabase tidak boleh ditimpa data awal
    for (const col of Object.keys(loaded)) dbStore[col] = loaded[col];
  }
  console.log('[Server DB] Terhubung ke Supabase:',
    Object.entries(dbStore).map(([k, v]) => `${k}=${v.length}`).join(', '));
}

// Serve berkas dari Storage privat
app.get('/uploads/:filename', async (req, res) => {
  const filename = req.params.filename;
  res.header('Cache-Control', 'private, max-age=86400');
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(filename);
    if (error || !data) return res.status(404).send('File not found');
    const buf = Buffer.from(await data.arrayBuffer());
    res.type(mimeOf(filename)).send(buf);
  } catch (e) {
    console.error('[Server] Error membaca berkas:', e);
    res.status(404).send('File not found');
  }
});

// Real-Time Server-Sent Events (SSE) subscribers for multi-device sync
const sseClients = new Set<express.Response>();
const collectionVersions: Record<string, number> = {};

function broadcastUpdate(collectionName: string, items: any[], metadata?: { updatedDocId?: string; action?: string }) {
  collectionVersions[collectionName] = Date.now();
  const payload = JSON.stringify({
    type: 'SYNC_COLLECTION',
    collectionName,
    items,
    metadata: metadata || {},
    version: collectionVersions[collectionName],
    timestamp: Date.now()
  });

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${payload}\n\n`);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  });
}

// Heartbeat ping every 10s to keep mobile phones / tablets / laptops connection live
setInterval(() => {
  sseClients.forEach((client) => {
    try {
      client.write(`: heartbeat ${Date.now()}\n\n`);
      if (typeof (client as any).flush === 'function') {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  });
}, 10000);

// ==========================================
// CENTRAL DATABASE API ROUTES (MULTI-USER)
// ==========================================

// 1. Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    connectedClients: sseClients.size,
    timestamp: new Date().toISOString(),
    versions: collectionVersions,
    collections: Object.keys(dbStore).map((key) => ({
      name: key,
      count: dbStore[key]?.length || 0
    }))
  });
});

// 1b. Collection Versions Endpoint for ultra-lightweight client polling
app.get('/api/db/versions', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'ok',
    versions: collectionVersions,
    timestamp: Date.now()
  });
});

// 2. Real-Time SSE Stream for Multi-Device Multi-Account Push Sync
app.get('/api/db/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', connectedClients: sseClients.size + 1, timestamp: Date.now() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// 3. Fetch All Collections in 1 Single Fast Request (Instant Multi-Device Bootstrap)
app.get('/api/db/all', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'ok',
    data: dbStore,
    timestamp: Date.now()
  });
});

// 4. Fetch a specific collection
app.get('/api/db/:collection', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const col = req.params.collection;
  const items = dbStore[col] || [];
  res.json({
    status: 'ok',
    collection: col,
    items,
    count: items.length
  });
});

const MASTER_ATTACHMENT_KEYS = [
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

function isRealAttachment(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  if (!trimmed) return false;
  if (trimmed.includes('images.unsplash.com')) return false;
  return true;
}

// 5. Update an entire collection (e.g. reorder, bulk import, mass update)
app.post('/api/db/:collection', async (req, res) => {
  const col = req.params.collection;
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Body must contain items array' });
  }
  const prevIds = (dbStore[col] || []).map((it: any) => String(it.id));

  // Smart merge based on updatedAt timestamps to ensure newer edits never get overwritten
  if (Array.isArray(dbStore[col]) && dbStore[col].length > 0) {
    const existingMap = new Map(dbStore[col].map((it: any) => [String(it.id), it]));
    const mergedList: any[] = [];
    const incomingIds = new Set<string>();

    items.forEach((item: any) => {
      const id = String(item.id);
      incomingIds.add(id);
      const existing = existingMap.get(id);
      if (!existing) {
        mergedList.push({ ...item, updatedAt: item.updatedAt || new Date().toISOString() });
      } else {
        const incUpdated = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
        const exUpdated = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;

        if (incUpdated >= exUpdated) {
          const merged = { ...existing, ...item, updatedAt: item.updatedAt || new Date().toISOString() };
          // Preserve custom sheets berkasList if omitted in incoming
          if (Array.isArray(existing.berkasList) && existing.berkasList.length > 0 && (!Array.isArray(item.berkasList) || item.berkasList.length === 0)) {
            merged.berkasList = existing.berkasList;
          }
          // Preserve real attachment files if incoming has empty string or undefined
          MASTER_ATTACHMENT_KEYS.forEach((key) => {
            if ((item[key] === undefined || item[key] === '') && isRealAttachment(existing[key])) {
              merged[key] = existing[key];
            }
          });
          mergedList.push(merged);
        } else {
          // Keep existing if existing has strictly newer timestamp
          mergedList.push(existing);
        }
      }
    });

    dbStore[col] = mergedList;
  } else {
    dbStore[col] = items.map((it: any) => ({ ...it, updatedAt: it.updatedAt || new Date().toISOString() }));
  }

  try {
    await dbUpsertRows(col, dbStore[col]);
    const nowIds = new Set(dbStore[col].map((it: any) => String(it.id)));
    const removed = prevIds.filter((id) => !nowIds.has(id));
    if (removed.length) await dbDeleteRows(col, removed);
    minPos[col] = 0;
  } catch (err) {
    console.error('[Server DB] Gagal menyimpan koleksi ke Supabase:', err);
    return res.status(500).json({ error: 'Gagal menyimpan ke database' });
  }
  broadcastUpdate(col, dbStore[col], { action: 'SET_COLLECTION' });

  res.json({
    status: 'ok',
    collection: col,
    count: dbStore[col].length
  });
});

// 6. Insert or Update a single document in a collection (Guaranteed Permanent Persistence)
app.post('/api/db/:collection/doc', async (req, res) => {
  const col = req.params.collection;
  const item = req.body;

  if (!item || !item.id) {
    return res.status(400).json({ error: 'Item must have an id' });
  }

  if (!dbStore[col]) {
    dbStore[col] = [];
  }

  const updatedItem = {
    ...item,
    updatedAt: item.updatedAt || new Date().toISOString()
  };

  const existingIndex = dbStore[col].findIndex((it: any) => String(it.id) === String(item.id));
  if (existingIndex >= 0) {
    const existing = dbStore[col][existingIndex];
    const mergedDoc = {
      ...existing,
      ...updatedItem
    };
    // Preserve real attachments if updatedItem had empty string or undefined
    MASTER_ATTACHMENT_KEYS.forEach((key) => {
      if ((updatedItem[key] === undefined || updatedItem[key] === '') && isRealAttachment(existing[key])) {
        mergedDoc[key] = existing[key];
      }
    });
    if (Array.isArray(existing.berkasList) && existing.berkasList.length > 0 && (!Array.isArray(updatedItem.berkasList) || updatedItem.berkasList.length === 0)) {
      mergedDoc.berkasList = existing.berkasList;
    }
    dbStore[col][existingIndex] = mergedDoc;
  } else {
    dbStore[col] = [updatedItem, ...dbStore[col]];
  }

  const finalItem = existingIndex >= 0 ? dbStore[col][existingIndex] : dbStore[col][0];

  try {
    let updatedExisting = false;
    if (existingIndex >= 0) {
      // Pertahankan posisi (pos) item yang sudah ada
      const { data: upd, error: updErr } = await sb
        .from('records')
        .update({ data: finalItem, updated_at: new Date().toISOString() })
        .eq('collection', col)
        .eq('id', String(item.id))
        .select('id');
      if (updErr) throw updErr;
      updatedExisting = !!(upd && upd.length);
    }
    if (!updatedExisting) {
      minPos[col] = (minPos[col] ?? 0) - 1;
      await dbUpsertRows(col, [finalItem], minPos[col]);
    }
  } catch (err) {
    console.error('[Server DB] Gagal menyimpan dokumen ke Supabase:', err);
    return res.status(500).json({ error: 'Gagal menyimpan ke database' });
  }
  broadcastUpdate(col, dbStore[col], { updatedDocId: String(item.id), action: 'UPSERT_DOC' });

  res.json({
    status: 'ok',
    collection: col,
    item: finalItem
  });
});

// 7. Delete a document from a collection
app.delete('/api/db/:collection/:id', async (req, res) => {
  const col = req.params.collection;
  const id = req.params.id;

  if (!dbStore[col]) {
    dbStore[col] = [];
  }

  dbStore[col] = dbStore[col].filter((it: any) => String(it.id) !== String(id));
  try {
    await dbDeleteRows(col, [String(id)]);
  } catch (err) {
    console.error('[Server DB] Gagal menghapus dari Supabase:', err);
    return res.status(500).json({ error: 'Gagal menghapus dari database' });
  }
  broadcastUpdate(col, dbStore[col], { updatedDocId: id, action: 'DELETE_DOC' });

  res.json({
    status: 'ok',
    collection: col,
    deletedId: id
  });
});

// 8. Upload berkas -> Supabase Storage (bucket privat "berkas")
app.post('/api/upload', async (req, res) => {
  try {
    const { dataUrl, filename } = req.body;
    if (!dataUrl || typeof dataUrl !== 'string') {
      return res.status(400).json({ error: 'dataUrl is required' });
    }

    // Sudah berupa URL /uploads/ -> kembalikan apa adanya
    if (dataUrl.startsWith('/uploads/')) {
      return res.json({
        status: 'ok',
        url: dataUrl,
        filename: path.basename(dataUrl),
        originalName: filename || path.basename(dataUrl)
      });
    }

    let buffer: Buffer;
    let ext = 'jpg';

    if (dataUrl.includes(';base64,')) {
      const parts = dataUrl.split(';base64,');
      const header = parts[0].toLowerCase();
      if (header.includes('pdf')) ext = 'pdf';
      else if (header.includes('png')) ext = 'png';
      else if (header.includes('webp')) ext = 'webp';
      else if (header.includes('gif')) ext = 'gif';
      else if (header.includes('svg')) ext = 'svg';
      else if (header.includes('jpeg') || header.includes('jpg')) ext = 'jpg';
      buffer = Buffer.from(parts[1], 'base64');
    } else {
      buffer = Buffer.from(dataUrl, 'utf-8');
    }

    const rawName = (filename || 'berkas').replace(/[^a-zA-Z0-9._-]/g, '_');
    const baseName = rawName.includes('.') ? rawName.substring(0, rawName.lastIndexOf('.')) : rawName;
    const uniqueFileName = `${Date.now()}_${baseName}.${ext}`;

    const { error: upErr } = await sb.storage.from(BUCKET).upload(uniqueFileName, buffer, {
      contentType: mimeOf(uniqueFileName),
      upsert: true
    });
    if (upErr) throw upErr;

    const meta = {
      id: uniqueFileName,
      filename: uniqueFileName,
      originalName: filename || uniqueFileName,
      url: `/uploads/${uniqueFileName}`,
      size: buffer.length,
      createdAt: new Date().toISOString()
    };
    if (!dbStore['files']) dbStore['files'] = [];
    dbStore['files'].unshift(meta);
    minPos['files'] = (minPos['files'] ?? 0) - 1;
    await dbUpsertRows('files', [meta], minPos['files']);
    if (dbStore['files'].length > 500) {
      const overflow = dbStore['files'].slice(500).map((f: any) => String(f.id));
      dbStore['files'] = dbStore['files'].slice(0, 500);
      await dbDeleteRows('files', overflow);
    }

    res.json({
      status: 'ok',
      url: meta.url,
      filename: uniqueFileName,
      originalName: meta.originalName,
      size: buffer.length
    });
  } catch (err: any) {
    console.error('[Server] File upload error:', err);
    res.status(500).json({ error: 'Failed to store file', details: err?.message });
  }
});

// 9. Unduh / pulihkan berkas (dikembalikan sebagai dataUrl, dipakai PermanentImage)
app.get('/api/files/download/:filename', async (req, res) => {
  const filename = req.params.filename;
  try {
    const { data, error } = await sb.storage.from(BUCKET).download(filename);
    if (error || !data) return res.status(404).json({ error: 'File not found in storage' });
    const buf = Buffer.from(await data.arrayBuffer());
    res.json({
      status: 'ok',
      filename,
      dataUrl: `data:${mimeOf(filename)};base64,${buf.toString('base64')}`,
      size: buf.length
    });
  } catch {
    res.status(500).json({ error: 'Failed to read file from storage' });
  }
});

// 10. Statistik berkas
app.get('/api/files/stats', (req, res) => {
  const files = dbStore['files'] || [];
  res.json({
    status: 'ok',
    totalFiles: files.length,
    files: files.map((f: any) => ({ filename: f.filename, size: f.size, createdAt: f.createdAt }))
  });
});

// 11. IMPOR SEKALI PAKAI dari backup lama (aktif hanya jika ADMIN_IMPORT_KEY diisi).
//     HAPUS endpoint ini + secret-nya setelah impor selesai.
app.post('/api/admin/import', async (req, res) => {
  const key = process.env.ADMIN_IMPORT_KEY;
  if (!key) return res.status(404).send('Not found');
  if (req.header('x-import-key') !== key) return res.status(401).json({ error: 'unauthorized' });
  try {
    const { data, file } = req.body || {};
    if (data && typeof data === 'object') {
      for (const [col, rawItems] of Object.entries<any>(data)) {
        if (!Array.isArray(rawItems)) continue;
        const items = rawItems.filter((it: any) => it && it.id !== undefined && it.id !== null);
        const prevIds = (dbStore[col] || []).map((it: any) => String(it.id));
        if (items.length) await dbUpsertRows(col, items);
        const nowIds = new Set(items.map((it: any) => String(it.id)));
        const removed = prevIds.filter((id) => !nowIds.has(id));
        if (removed.length) await dbDeleteRows(col, removed);
        dbStore[col] = items;
        minPos[col] = 0;
        broadcastUpdate(col, items, { action: 'SET_COLLECTION' });
      }
    }
    if (file && file.name && file.dataUrl) {
      const raw = String(file.dataUrl);
      const buffer = raw.includes(';base64,')
        ? Buffer.from(raw.split(';base64,')[1], 'base64')
        : Buffer.from(raw, 'utf-8');
      const { error } = await sb.storage.from(BUCKET).upload(String(file.name), buffer, {
        contentType: mimeOf(String(file.name)),
        upsert: true
      });
      if (error) throw error;
    }
    res.json({ status: 'ok' });
  } catch (e: any) {
    console.error('[Server] Import error:', e);
    res.status(500).json({ error: e?.message || 'import failed' });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC ASSETS
// ==========================================
async function startServer() {
  await initDatabase();
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/uploads/**', '**/*.json', '**/dist/**', '**/.git/**']
        }
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build in progress. Please refresh in a moment.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fokus Server] Server running on http://0.0.0.0:${PORT} with Real-Time Multi-User Multi-Device Sync.`);
  });
}

startServer();
