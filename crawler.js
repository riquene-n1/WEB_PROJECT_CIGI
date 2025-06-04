const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const parseCatalogPdf = require('./parsePdf');

const DB_PATH = path.join(__dirname, 'tsubaki.db');
const CATALOG_DIR = path.join(__dirname, 'catalog');
const db = new sqlite3.Database(DB_PATH);

async function processPdf(filePath) {
  const parsed = await parseCatalogPdf(filePath);
  const modelNo = parsed.modelNo || path.basename(filePath, '.pdf');
  const type = parsed.type || 'unknown';
  const spec = parsed.spec || 'unknown';
  const tol = parsed.tolerance || '';

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO chains (modelNo, type, spec, tolerance, catalog, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [modelNo, type, spec, tol, filePath, ''],
      function (err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

async function main() {
  const files = fs.readdirSync(CATALOG_DIR).filter(f => f.endsWith('.pdf'));
  for (const file of files) {
    const full = path.join(CATALOG_DIR, file);
    console.log(`Processing ${full}`);
    await processPdf(full);
  }
}

main()
  .catch(err => console.error(err))
  .finally(() => db.close());
