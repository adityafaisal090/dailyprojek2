function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function scoreFromBands(value, bands) {
  for (const band of bands) {
    const lowerOk = band.minInclusive === undefined ? true : value >= band.minInclusive;
    const upperOk = band.maxInclusive === undefined ? true : value <= band.maxInclusive;
    if (!lowerOk || !upperOk) continue;

    const minScore = band.scoreMin;
    const maxScore = band.scoreMax;

    if (band.minInclusive === undefined || band.maxInclusive === undefined) {
      return maxScore;
    }

    if (band.minInclusive === band.maxInclusive) return maxScore;

    const t = (value - band.minInclusive) / (band.maxInclusive - band.minInclusive);
    return lerp(minScore, maxScore, clamp(t, 0, 1));
  }

  return 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6D2B79F5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function stableSeedFromString(s) {
  const str = String(s || 'quality-default-seed');
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sampleUniqueIndexes(length, sampleSize, seedStr) {
  const n = Math.min(sampleSize, length);
  if (n <= 0) return [];

  const rand = mulberry32(stableSeedFromString(seedStr));
  const picked = new Set();

  // Try to pick unique indexes; fallback to deterministic stride if collisions too many.
  let tries = 0;
  const maxTries = n * 20;
  while (picked.size < n && tries < maxTries) {
    picked.add(Math.floor(rand() * length));
    tries++;
  }

  if (picked.size < n) {
    picked.clear();
    const step = Math.max(1, Math.floor(length / n));
    for (let i = 0; i < n; i++) picked.add((i * step) % length);
  }

  return Array.from(picked);
}

function isNonEmpty(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function computeDataPoints(items, fields) {
  let total = 0;
  for (const a of items) {
    for (const f of fields) {
      if (isNonEmpty(a && a[f])) total++;
    }
  }
  return total;
}

function completenessCountCore(a) {
  const hasNama = isNonEmpty(a && a.nama) ? 1 : 0;
  const hasNim = isNonEmpty(a && a.nim) ? 1 : 0;
  const hasJurusan = isNonEmpty(a && a.jurusan) ? 1 : 0;
  const hasTahun = isNonEmpty(a && a.tahunLulus) ? 1 : 0;
  return hasNama + hasNim + hasJurusan + hasTahun;
}

function isRecordAccurate(a, currentYear) {
  if (!isNonEmpty(a && a.nama)) return false;
  if (!isNonEmpty(a && a.jurusan)) return false;

  // If tahunLulus filled, it should be reasonable.
  if (isNonEmpty(a && a.tahunLulus)) {
    const n = Number(a.tahunLulus);
    if (!Number.isFinite(n)) return false;
    if (n < 1970 || n > currentYear + 1) return false;
  }

  return true;
}

function computeQualityReport(items, opts = {}) {
  const fieldsForCoverage = opts.coverageFields || [
    'nama',
    'nim',
    'jurusan',
    'tahunLulus'
  ];

  const coverageDataPoints = computeDataPoints(items, fieldsForCoverage);

  // Coverage rubric (indicator: jumlah data ditemukan)
  const coverageScore = scoreFromBands(coverageDataPoints, [
    { maxInclusive: 28458, scoreMin: 0, scoreMax: 40 },
    { minInclusive: 28459, maxInclusive: 56917, scoreMin: 41, scoreMax: 60 },
    { minInclusive: 56918, maxInclusive: 85376, scoreMin: 61, scoreMax: 80 },
    { minInclusive: 85377, maxInclusive: 106720, scoreMin: 81, scoreMax: 90 },
    { minInclusive: 106721, scoreMin: 91, scoreMax: 100 }
  ]);

  // Completeness rubric based on average filled core fields (0..4)
  let sumCompleteness = 0;
  let countComplete4 = 0;
  for (const a of items) {
    const c = completenessCountCore(a);
    sumCompleteness += c;
    if (c === 4) countComplete4++;
  }
  const completenessAvg = items.length ? sumCompleteness / items.length : 0;
  const completenessScore = scoreFromBands(completenessAvg, [
    { maxInclusive: 1.999, scoreMin: 0, scoreMax: 50 },
    { minInclusive: 2, maxInclusive: 2.999, scoreMin: 51, scoreMax: 70 },
    { minInclusive: 3, maxInclusive: 3.999999999, scoreMin: 71, scoreMax: 85 },
    { minInclusive: 4, maxInclusive: 4, scoreMin: 86, scoreMax: 100 }
  ]);

  // Accuracy rubric based on sampling 500 data
  const sampleSize = Number.isFinite(Number(opts.sampleSize)) ? Math.max(1, Math.floor(Number(opts.sampleSize))) : 500;
  const seed = opts.seed || 'quality-default-seed';
  const idxs = sampleUniqueIndexes(items.length, sampleSize, seed);
  const currentYear = new Date().getFullYear();

  let accurateCount = 0;
  for (const i of idxs) {
    const a = items[i];
    if (isRecordAccurate(a, currentYear)) accurateCount++;
  }

  const accuracyScore = scoreFromBands(accurateCount, [
    { maxInclusive: 349, scoreMin: 0, scoreMax: 50 },
    { minInclusive: 350, maxInclusive: 425, scoreMin: 51, scoreMax: 75 },
    { minInclusive: 426, maxInclusive: 475, scoreMin: 76, scoreMax: 90 },
    { minInclusive: 476, scoreMin: 91, scoreMax: 100 }
  ]);

  const totalScore = (coverageScore * 0.4) + (accuracyScore * 0.4) + (completenessScore * 0.2);

  return {
    meta: {
      records: items.length,
      seed,
      sampleSize: idxs.length,
      weights: { coverage: 0.4, accuracy: 0.4, completeness: 0.2 }
    },
    indicator: {
      coverageDataPoints,
      completenessAvgFields: Number(completenessAvg.toFixed(3)),
      completenessRate4: items.length ? Number((countComplete4 / items.length).toFixed(4)) : 0,
      accuracyCorrectInSample: accurateCount
    },
    score: {
      coverage: Number(coverageScore.toFixed(2)),
      accuracy: Number(accuracyScore.toFixed(2)),
      completeness: Number(completenessScore.toFixed(2)),
      total: Number(totalScore.toFixed(2))
    }
  };
}

module.exports = {
  computeQualityReport
};
