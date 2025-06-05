const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.join(__dirname, 'tsubaki.db');
const OUTPUT = path.join(__dirname, 'export.csv');

const db = new sqlite3.Database(DB_PATH);

function escape(value) {
  if (value == null) return '';
  const str = String(value).replace(/"/g, '""');
  return '"' + str + '"';
}

db.all('SELECT * FROM chains', (err, rows) => {
  if (err) {
    console.error(err);
    db.close();
    return;
  }
  const header = 'id,modelNo,type,spec,tolerance,catalog,image\n';
  const lines = rows.map(r => [r.id, r.modelNo, r.type, r.spec, r.tolerance, r.catalog, r.image]
    .map(escape).join(','));
  fs.writeFileSync(OUTPUT, header + lines.join('\n'));
  console.log(`Exported ${rows.length} rows to ${OUTPUT}`);
  db.close();
});