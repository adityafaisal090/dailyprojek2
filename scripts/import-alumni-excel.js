const fs = require('fs/promises');
const path = require('path');

const alumniStore = require('../models/alumniStore');
const { readXlsxAsRowObjects, mapRowToPayload } = require('../services/alumniExcel');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

(async function main() {
  const argPath = process.argv[2];
  const defaultPath = path.join('data', 'alumni.xlsx');
  const filePath = argPath ? argPath : defaultPath;

  const resolved = path.resolve(process.cwd(), filePath);
  if (!(await fileExists(resolved))) {
    console.error(`File tidak ditemukan: ${filePath}`);
    console.error('Taruh file .xlsx di folder data/ lalu jalankan:');
    console.error('  npm run import:alumni -- data/alumni.xlsx');
    process.exit(1);
  }

  const rowObjects = await readXlsxAsRowObjects(resolved);

  let created = 0;
  let updated = 0;
  const skipped = [];
  let skippedCount = 0;
  const MAX_SKIPPED_SAMPLES = 50;

  for (const rowObj of rowObjects) {
    const payload = mapRowToPayload(rowObj);

    if (!payload.nama) {
      skippedCount++;
      if (skipped.length < MAX_SKIPPED_SAMPLES) skipped.push({ row: rowObj.__rowNumber ?? null, reason: 'nama kosong' });
      continue;
    }
    if (!payload.nim) {
      skippedCount++;
      if (skipped.length < MAX_SKIPPED_SAMPLES) skipped.push({ row: rowObj.__rowNumber ?? null, reason: 'nim kosong' });
      continue;
    }

    const result = await alumniStore.importUpsert(payload);
    if (result.action === 'created') created++;
    else updated++;
  }

  const summary = {
    file: filePath,
    totalRows: rowObjects.length,
    created,
    updated,
    skippedCount,
    skippedSample: skipped
  };

  console.log(JSON.stringify({ success: true, message: 'Import Excel selesai', data: summary }, null, 2));
})().catch((err) => {
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
});
