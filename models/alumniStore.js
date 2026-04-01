const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'alumni.json');

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

async function readAll() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
}

function normalizeCreatePayload(payload) {
  return {
    nama: String(payload.nama || '').trim(),
    nim: String(payload.nim || '').trim(),
    jurusan: String(payload.jurusan || '').trim(),
    tahunLulus: payload.tahunLulus !== undefined && payload.tahunLulus !== null
      ? Number(payload.tahunLulus)
      : null,
    email: String(payload.email || '').trim(),
    noHp: String(payload.noHp || '').trim()
  };
}

function validateCreatePayload(data) {
  const errors = [];
  if (!data.nama) errors.push('nama wajib diisi');
  if (!data.jurusan) errors.push('jurusan wajib diisi');
  if (!Number.isFinite(data.tahunLulus)) errors.push('tahunLulus wajib berupa angka');
  if (!data.email) errors.push('email wajib diisi');
  return errors;
}

function applyPatch(existing, patch) {
  const out = { ...existing };
  const allowed = ['nama', 'nim', 'jurusan', 'tahunLulus', 'email', 'noHp'];

  for (const key of allowed) {
    if (patch[key] === undefined) continue;
    if (key === 'tahunLulus') {
      out.tahunLulus = patch.tahunLulus === null ? null : Number(patch.tahunLulus);
      continue;
    }
    out[key] = String(patch[key]).trim();
  }

  return out;
}

async function getAll() {
  return await readAll();
}

async function getById(id) {
  const items = await readAll();
  return items.find((a) => a.id === id) || null;
}

async function create(payload) {
  const data = normalizeCreatePayload(payload);
  const errors = validateCreatePayload(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.statusCode = 400;
    throw err;
  }

  const items = await readAll();
  const now = new Date().toISOString();
  const alumni = {
    id: crypto.randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
    lastTracking: null
  };
  items.push(alumni);
  await writeAll(items);
  return alumni;
}

async function update(id, patch) {
  const items = await readAll();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const next = applyPatch(items[idx], patch);

  // Basic validation: if fields set, they can't be empty
  if (next.nama !== undefined && String(next.nama).trim() === '') {
    const err = new Error('nama tidak boleh kosong');
    err.statusCode = 400;
    throw err;
  }
  if (next.jurusan !== undefined && String(next.jurusan).trim() === '') {
    const err = new Error('jurusan tidak boleh kosong');
    err.statusCode = 400;
    throw err;
  }

  next.updatedAt = new Date().toISOString();
  items[idx] = next;
  await writeAll(items);
  return next;
}

async function remove(id) {
  const items = await readAll();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return false;
  items.splice(idx, 1);
  await writeAll(items);
  return true;
}

async function setTracking(id, trackingResult) {
  const items = await readAll();
  const idx = items.findIndex((a) => a.id === id);
  if (idx === -1) return null;

  const next = { ...items[idx] };
  next.lastTracking = trackingResult;
  next.updatedAt = new Date().toISOString();

  items[idx] = next;
  await writeAll(items);
  return next;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  setTracking
};
