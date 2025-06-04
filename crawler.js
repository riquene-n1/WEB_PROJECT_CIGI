const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'tsubaki.db');
const CATALOG_DIR = path.join(__dirname, 'catalog');
const db = new sqlite3.Database(DB_PATH);

async function processPdf(filePath) {
  const data = await pdf(fs.readFileSync(filePath));
  // TODO: parse `data.text` to extract real specifications
  const modelNo = path.basename(filePath, '.pdf');
  const type = 'unknown';
  const spec = 'unknown';

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT OR IGNORE INTO chains (modelNo, type, spec, tolerance, catalog, image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [modelNo, type, spec, '', filePath, ''],
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
