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
    noHp: String(payload.noHp || '').trim(),

    // Sosial media pribadi
    linkedin: String(payload.linkedin || '').trim(),
    instagram: String(payload.instagram || '').trim(),
    facebook: String(payload.facebook || '').trim(),
    tiktok: String(payload.tiktok || '').trim(),

    // Data pekerjaan
    workTempat: String(payload.workTempat || '').trim(),
    workAlamat: String(payload.workAlamat || '').trim(),
    workPosisi: String(payload.workPosisi || '').trim(),
    workJenis: String(payload.workJenis || '').trim(),

    // Sosial media tempat bekerja
    workLinkedin: String(payload.workLinkedin || '').trim(),
    workInstagram: String(payload.workInstagram || '').trim(),
    workFacebook: String(payload.workFacebook || '').trim(),
    workTiktok: String(payload.workTiktok || '').trim()
  };
}

function validateCreatePayload(data) {
  const errors = [];
  if (!data.nama) errors.push('nama wajib diisi');
  if (!data.email) errors.push('email wajib diisi');
  if (data.tahunLulus !== null && data.tahunLulus !== undefined && data.tahunLulus !== '') {
    if (!Number.isFinite(Number(data.tahunLulus))) errors.push('tahunLulus harus berupa angka jika diisi');
  }
  return errors;
}

function applyPatch(existing, patch) {
  const out = { ...existing };
  const allowed = [
    'nama',
    'nim',
    'jurusan',
    'tahunLulus',
    'email',
    'noHp',
    'linkedin',
    'instagram',
    'facebook',
    'tiktok',
    'workTempat',
    'workAlamat',
    'workPosisi',
    'workJenis',
    'workLinkedin',
    'workInstagram',
    'workFacebook',
    'workTiktok'
  ];

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

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
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

async function upsertByEmail(payload) {
  const data = normalizeCreatePayload(payload);
  const errors = validateCreatePayload(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.statusCode = 400;
    throw err;
  }

  const emailKey = normalizeEmail(data.email);
  if (!emailKey) {
    const err = new Error('email wajib diisi');
    err.statusCode = 400;
    throw err;
  }

  const items = await readAll();
  const idx = items.findIndex((a) => normalizeEmail(a.email) === emailKey);
  const now = new Date().toISOString();

  if (idx === -1) {
    const alumni = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      lastTracking: null
    };
    items.push(alumni);
    await writeAll(items);
    return { action: 'created', item: alumni };
  }

  const next = applyPatch(items[idx], data);
  next.updatedAt = now;
  items[idx] = next;
  await writeAll(items);
  return { action: 'updated', item: next };
}

function normalizeNim(nim) {
  return String(nim || '').trim();
}

async function importUpsert(payload) {
  const data = normalizeCreatePayload(payload);

  // Import mode: allow email kosong (karena sumber data bisa hanya punya NIM)
  // Minimal: nama + (email atau nim)
  if (!data.nama) {
    const err = new Error('nama wajib diisi');
    err.statusCode = 400;
    throw err;
  }

  const emailKey = normalizeEmail(data.email);
  const nimKey = normalizeNim(data.nim);
  if (!emailKey && !nimKey) {
    const err = new Error('email atau nim wajib diisi');
    err.statusCode = 400;
    throw err;
  }

  const items = await readAll();
  const now = new Date().toISOString();

  const idx = items.findIndex((a) => {
    if (emailKey) return normalizeEmail(a.email) === emailKey;
    return normalizeNim(a.nim) === nimKey;
  });

  if (idx === -1) {
    const alumni = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
      lastTracking: null
    };
    items.push(alumni);
    await writeAll(items);
    return { action: 'created', item: alumni };
  }

  const next = applyPatch(items[idx], data);
  next.updatedAt = now;
  items[idx] = next;
  await writeAll(items);
  return { action: 'updated', item: next };
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
  if (patch.email !== undefined && String(next.email || '').trim() === '') {
    const err = new Error('email tidak boleh kosong');
    err.statusCode = 400;
    throw err;
  }
  if (patch.tahunLulus !== undefined && next.tahunLulus !== null && !Number.isFinite(Number(next.tahunLulus))) {
    const err = new Error('tahunLulus harus berupa angka jika diisi');
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
  upsertByEmail,
  importUpsert,
  update,
  remove,
  setTracking
};
