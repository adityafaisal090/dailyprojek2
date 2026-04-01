const asyncHandler = require('../middleware/asyncHandler');
const { HttpError } = require('../middleware/errorHandler');
const alumniStore = require('../models/alumniStore');

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

exports.track = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const alumni = await alumniStore.getById(id);
  if (!alumni) throw new HttpError(404, 'Alumni tidak ditemukan');

  // Simulasi proses pelacakan (delay ringan)
  await new Promise((r) => setTimeout(r, 800));

  const pekerjaanList = [
    'Software Engineer',
    'Data Analyst',
    'Product Manager',
    'UI/UX Designer',
    'Research Assistant',
    'DevOps Engineer'
  ];
  const perusahaanList = [
    'Tokopedia',
    'Gojek',
    'Traveloka',
    'Telkom Indonesia',
    'BRI',
    'Startup Lokal'
  ];
  const sumberList = ['LinkedIn', 'Google Scholar', 'ResearchGate'];

  const result = {
    pekerjaan: pick(pekerjaanList),
    perusahaan: pick(perusahaanList),
    sumber: pick(sumberList),
    trackedAt: new Date().toISOString()
  };

  await alumniStore.setTracking(id, result);

  res.json({
    success: true,
    data: {
      alumniId: id,
      nama: alumni.nama,
      ...result
    },
    message: 'Pelacakan alumni berhasil'
  });
});
