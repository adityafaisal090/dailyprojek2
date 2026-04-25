const fs = require('fs/promises');
const path = require('path');

const { computeQualityReport } = require('../services/dataQuality');

async function main() {
  const dataFile = path.join(__dirname, '..', 'data', 'alumni.json');
  const raw = await fs.readFile(dataFile, 'utf8');
  const items = JSON.parse(raw || '[]');

  const report = computeQualityReport(Array.isArray(items) ? items : [], {
    sampleSize: 500,
    seed: 'daily-project-3'
  });

  console.log(JSON.stringify({ success: true, data: report }, null, 2));
}

main().catch((err) => {
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
});
