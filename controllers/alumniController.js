const asyncHandler = require('../middleware/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const alumniStore = require('../models/alumniStore');
const { computeQualityReport } = require('../services/dataQuality');

exports.getAll = asyncHandler(async (req, res) => {
  const alumni = await alumniStore.getAll();
  res.json({ success: true, data: alumni });
});

exports.create = asyncHandler(async (req, res) => {
  const alumni = await alumniStore.create(req.body);
  res.status(201).json({ success: true, data: alumni, message: 'Alumni berhasil ditambahkan' });
});

exports.update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await alumniStore.update(id, req.body);
  if (!updated) throw new HttpError(404, 'Alumni tidak ditemukan');
  res.json({ success: true, data: updated, message: 'Data alumni berhasil diperbarui' });
});

exports.remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ok = await alumniStore.remove(id);
  if (!ok) throw new HttpError(404, 'Alumni tidak ditemukan');
  res.json({ success: true, message: 'Alumni berhasil dihapus' });
});

exports.quality = asyncHandler(async (req, res) => {
  const items = await alumniStore.getAll();
  const report = computeQualityReport(items, { sampleSize: 500, seed: 'daily-project-3' });
  res.json({ success: true, data: report });
});
