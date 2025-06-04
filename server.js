const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'tsubaki.db');

const db = new sqlite3.Database(DB_PATH);

const CATALOG_DIR = path.join(__dirname, 'catalog');
const IMAGE_DIR = path.join(__dirname, 'images');
for (const dir of [CATALOG_DIR, IMAGE_DIR]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'catalog') cb(null, CATALOG_DIR);
    else if (file.fieldname === 'image') cb(null, IMAGE_DIR);
    else cb(null, __dirname);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + file.fieldname + ext;
    cb(null, name);
  }
});
const upload = multer({ storage });

app.use(express.json());
app.use(express.static(__dirname));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS chains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    modelNo TEXT UNIQUE,
    type TEXT,
    spec TEXT,
    tolerance TEXT,
    catalog TEXT,
    image TEXT
  )`);
  // Database initialized; records will be added through the admin interface
  // using PDF and image uploads.
});

app.get('/api/chains', (req, res) => {
  db.all('SELECT * FROM chains', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/chains', upload.fields([{ name: 'catalog' }, { name: 'image' }]), (req, res) => {
  const { modelNo, type, spec, tolerance } = req.body;
  const catalogFile = req.files.catalog ? path.join('catalog', req.files.catalog[0].filename) : '';
  const imageFile = req.files.image ? path.join('images', req.files.image[0].filename) : '';
  const stmt = db.prepare(
    'INSERT INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(modelNo, type, spec, tolerance, catalogFile, imageFile, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put(
  '/api/chains/:id',
  upload.fields([{ name: 'catalog' }, { name: 'image' }]),
  (req, res) => {
    const { id } = req.params;
    const { modelNo, type, spec, tolerance } = req.body;

    db.get('SELECT catalog, image FROM chains WHERE id=?', [id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Not found' });

      const catalogFile = req.files.catalog
        ? path.join('catalog', req.files.catalog[0].filename)
        : row.catalog;
      const imageFile = req.files.image
        ? path.join('images', req.files.image[0].filename)
        : row.image;

      db.run(
        'UPDATE chains SET modelNo=?, type=?, spec=?, tolerance=?, catalog=?, image=? WHERE id=?',
        [modelNo, type, spec, tolerance, catalogFile, imageFile, id],
        function (err2) {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ updated: this.changes });
        }
      );
    });
  }
);

app.delete('/api/chains/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM chains WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
