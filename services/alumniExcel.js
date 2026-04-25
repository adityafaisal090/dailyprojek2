const ExcelJS = require('exceljs');

function normalizeHeader(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[_\-\.\/\\\(\)\[\]\{\}:;,'"`~!@#$%^&*+=?<>|]/g, '');
}

function normalizeText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v);
  return String(v).trim();
}

function normalizeCellValue(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text.trim();
    if (typeof v.result === 'string' || typeof v.result === 'number') return String(v.result).trim();
    if (Array.isArray(v.richText)) {
      return v.richText.map((t) => t && t.text ? String(t.text) : '').join('').trim();
    }
    if (v.hyperlink && v.text) return String(v.hyperlink).trim();
    return String(v).trim();
  }
  return String(v).trim();
}

function normalizeWorkJenis(v) {
  const raw = normalizeText(v).toLowerCase();
  if (!raw) return '';
  if (raw.includes('pns') || raw.includes('asn') || raw.includes('negeri')) return 'PNS';
  if (raw.includes('wira') || raw.includes('usaha') || raw.includes('entre')) return 'Wirausaha';
  if (raw.includes('swasta') || raw.includes('private')) return 'Swasta';
  return normalizeText(v);
}

function buildHeaderIndex(rowObj) {
  const idx = new Map();
  for (const key of Object.keys(rowObj || {})) {
    idx.set(normalizeHeader(key), key);
  }
  return idx;
}

function getCell(rowObj, headerIndex, candidates) {
  for (const c of candidates) {
    const originalKey = headerIndex.get(normalizeHeader(c));
    if (originalKey !== undefined) {
      const v = rowObj[originalKey];
      if (v !== undefined && v !== null && String(v).trim() !== '') return v;
    }
  }
  return '';
}

function mapRowToPayload(rowObj) {
  const headerIndex = buildHeaderIndex(rowObj);

  return {
    nama: normalizeText(getCell(rowObj, headerIndex, ['nama', 'name', 'namaalumni', 'namalulusan', 'namalulus'])),
    nim: normalizeText(getCell(rowObj, headerIndex, ['nim', 'studentid', 'nrp'])),
    jurusan: normalizeText(getCell(rowObj, headerIndex, ['jurusan', 'prodi', 'programstudi', 'programstudi/prodi', 'programstudi', 'program studi'])),
    tahunLulus: (() => {
      const direct = getCell(rowObj, headerIndex, ['tahunlulus', 'tahunlulus', 'tahun', 'graduationyear']);
      const dt = normalizeText(direct);
      if (dt) {
        const n = Number(dt);
        if (Number.isFinite(n)) return n;
      }

      const tanggal = normalizeText(getCell(rowObj, headerIndex, ['tanggallulus', 'tanggal lulus', 'tgl lulus']));
      if (!tanggal) return null;
      const m = tanggal.match(/\b(19\d{2}|20\d{2})\b/);
      if (!m) return null;
      const year = Number(m[1]);
      return Number.isFinite(year) ? year : null;
    })(),

    email: normalizeText(getCell(rowObj, headerIndex, ['email', 'e-mail', 'mail'])),
    noHp: normalizeText(getCell(rowObj, headerIndex, ['nohp', 'no hp', 'hp', 'nohandphone', 'handphone', 'telepon', 'telp', 'phone', 'wa', 'whatsapp'])),

    linkedin: normalizeText(getCell(rowObj, headerIndex, ['linkedin', 'linkedinurl', 'linklinkedin'])),
    instagram: normalizeText(getCell(rowObj, headerIndex, ['ig', 'instagram', 'instagramurl'])),
    facebook: normalizeText(getCell(rowObj, headerIndex, ['fb', 'facebook', 'facebookurl'])),
    tiktok: normalizeText(getCell(rowObj, headerIndex, ['tiktok', 'tik tok', 'tiktokurl'])),

    workTempat: normalizeText(getCell(rowObj, headerIndex, ['tempatbekerja', 'tempat bekerja', 'perusahaan', 'company', 'instansi', 'kantor'])),
    workAlamat: normalizeText(getCell(rowObj, headerIndex, ['alamatbekerja', 'alamat bekerja', 'alamatkantor', 'alamat kantor', 'alamatperusahaan', 'alamat perusahaan', 'officeaddress'])),
    workPosisi: normalizeText(getCell(rowObj, headerIndex, ['posisi', 'jabatan', 'jobtitle', 'role'])),
    workJenis: normalizeWorkJenis(getCell(rowObj, headerIndex, ['jenis', 'jenispekerjaan', 'status', 'kategori', 'tipe', 'pns', 'swasta', 'wirausaha', 'pns/swasta/wirausaha'])),

    workLinkedin: normalizeText(getCell(rowObj, headerIndex, ['linkedinperusahaan', 'linkedin perusahaan', 'linkedinkantor', 'linkedin kantor', 'worklinkedin', 'linkedintempatbekerja'])),
    workInstagram: normalizeText(getCell(rowObj, headerIndex, ['igperusahaan', 'instagramperusahaan', 'instagram perusahaan', 'igkantor', 'instagramkantor', 'workinstagram'])),
    workFacebook: normalizeText(getCell(rowObj, headerIndex, ['fbperusahaan', 'facebookperusahaan', 'facebook perusahaan', 'fbkantor', 'facebookkantor', 'workfacebook'])),
    workTiktok: normalizeText(getCell(rowObj, headerIndex, ['tiktokperusahaan', 'tiktok perusahaan', 'tiktokkantor', 'tiktok kantor', 'worktiktok']))
  };
}

async function readXlsxAsRowObjects(filePath) {
  const lower = String(filePath || '').toLowerCase();
  if (lower.endsWith('.xls') && !lower.endsWith('.xlsx')) {
    const err = new Error('Format .xls belum didukung. Silakan simpan ulang sebagai .xlsx');
    err.code = 'UNSUPPORTED_XLS';
    throw err;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const ws = workbook.worksheets && workbook.worksheets[0];
  if (!ws) return [];

  const headerRow = ws.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeCellValue(cell.value);
  });

  const rows = [];
  for (let rowNumber = 2; rowNumber <= ws.rowCount; rowNumber++) {
    const row = ws.getRow(rowNumber);
    const rowObj = { __rowNumber: rowNumber };

    for (let col = 1; col < headers.length; col++) {
      const h = headers[col];
      if (!h) continue;
      rowObj[h] = normalizeCellValue(row.getCell(col).value);
    }

    const values = Object.keys(rowObj)
      .filter((k) => k !== '__rowNumber')
      .map((k) => String(rowObj[k] || '').trim());

    if (values.length === 0 || values.every((v) => v === '')) continue;
    rows.push(rowObj);
  }

  return rows;
}

module.exports = {
  readXlsxAsRowObjects,
  mapRowToPayload
};
