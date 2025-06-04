const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const parseCatalogPdf = require('./parsePdf');

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

// ----- User authentication -----
app.post('/api/register', (req, res) => {
  const { username, password, phone, fullname, company, position } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'missing data' });
  const stmt = db.prepare(
    'INSERT INTO users (username, password, phone, fullname, company, position) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(username, password, phone, fullname, company, position, function (err) {
    if (err) return res.status(400).json({ error: 'user exists' });
    res.json({ id: this.lastID });
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE username=? AND password=?',
    [username, password],
    (err, row) => {
      if (err || !row) return res.status(401).json({ error: 'invalid' });
      res.json({ ok: true });
    }
  );
});

app.post('/api/history', (req, res) => {
  const { username, query } = req.body;
  if (!username || !query) return res.status(400).json({ error: 'missing' });
  db.run(
    'INSERT INTO search_history (username, query) VALUES (?, ?)',
    [username, JSON.stringify(query)],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

app.get('/api/history', (req, res) => {
  const username = req.query.username;
  db.all(
    'SELECT query, ts FROM search_history WHERE username=? ORDER BY ts DESC LIMIT 10',
    [username],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows.map(r => ({ query: JSON.parse(r.query), ts: r.ts })));
    }
  );
});

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
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    phone TEXT,
    fullname TEXT,
    company TEXT,
    position TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    query TEXT,
    ts DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // Insert a couple of sample rows the first time the DB is created so the UI
  // has something to display. These can be removed through the admin page.
  db.get('SELECT COUNT(*) AS cnt FROM chains', (err, row) => {
    if (!err && row && row.cnt === 0) {
      const stmt = db.prepare(
        'INSERT INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.run('RF2040', 'Roller Chain', '1/2 pitch', '+0/-0.1', 'catalog/sample.pdf', '');
      stmt.run('BS25', 'Conveyor Chain', '1 pitch', '+0/-0.2', 'catalog/sample.pdf', '');
      stmt.run(
        'RS08B-1',
        'Roller Chain',
        '5/8" pitch',
        '+0/-0.15',
        'catalog/drivechain2020-web.pdf',
        ''
      );
      stmt.run(
        'SC08B',
        'Small Conveyor Chain',
        '1 pitch',
        '+0/-0.3',
        'catalog/smallconveyorchain2024-web.pdf',
        ''
      );
      stmt.run(
        'RS10B-1',
        'Roller Chain',
        '5/8" pitch',
        '+0/-0.2',
        'catalog/3_gs_file2_0_1958484775.pdf',
        ''
      );
      stmt.finalize();
    }
  });

  db.get('SELECT COUNT(*) AS cnt FROM users', (err, row) => {
    if (!err && row && row.cnt === 0) {
      const u = db.prepare(
        'INSERT INTO users (username, password, phone, fullname, company, position) VALUES (?, ?, ?, ?, ?, ?)'
      );
      u.run('admin', 'admin', '', 'Administrator', '', '');
      u.finalize();
    }
  });
});

app.get('/api/chains', (req, res) => {
  const { type, model, spec, tol } = req.query;
  let sql = 'SELECT * FROM chains WHERE 1=1';
  const params = [];
  if (type) {
    sql += ' AND LOWER(type) LIKE ?';
    params.push('%' + type.toLowerCase() + '%');
  }
  if (model) {
    sql += ' AND LOWER(modelNo) LIKE ?';
    params.push('%' + model.toLowerCase() + '%');
  }
  if (spec) {
    sql += ' AND LOWER(spec) LIKE ?';
    params.push('%' + spec.toLowerCase() + '%');
  }
  if (tol) {
    sql += ' AND LOWER(tolerance) LIKE ?';
    params.push('%' + tol.toLowerCase() + '%');
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/chains/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM chains WHERE id=?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

app.post(
  '/api/chains',
  upload.fields([{ name: 'catalog' }, { name: 'image' }]),
  async (req, res) => {
    try {
      let { modelNo, type, spec, tolerance } = req.body;
      const catalogFile = req.files.catalog
        ? path.join('catalog', req.files.catalog[0].filename)
        : '';
      const imageFile = req.files.image
        ? path.join('images', req.files.image[0].filename)
        : '';

      if (req.files.catalog) {
        const parsed = await parseCatalogPdf(
          path.join(__dirname, catalogFile)
        );
        modelNo = modelNo || parsed.modelNo;
        type = type || parsed.type;
        spec = spec || parsed.spec;
        tolerance = tolerance || parsed.tolerance;
      }

      const stmt = db.prepare(
        'INSERT INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.run(
        modelNo,
        type,
        spec,
        tolerance,
        catalogFile,
        imageFile,
        function (err) {
          if (err) return res.status(400).json({ error: err.message });
          res.json({ id: this.lastID });
        }
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

app.put(
  '/api/chains/:id',
  upload.fields([{ name: 'catalog' }, { name: 'image' }]),
  async (req, res) => {
    const { id } = req.params;
    let { modelNo, type, spec, tolerance } = req.body;

    db.get('SELECT catalog, image FROM chains WHERE id=?', [id], async (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Not found' });

      let catalogFile = row.catalog;
      let imageFile = row.image;

      if (req.files.catalog) {
        catalogFile = path.join('catalog', req.files.catalog[0].filename);
        const parsed = await parseCatalogPdf(path.join(__dirname, catalogFile));
        modelNo = modelNo || parsed.modelNo;
        type = type || parsed.type;
        spec = spec || parsed.spec;
        tolerance = tolerance || parsed.tolerance;
      }
      if (req.files.image) {
        imageFile = path.join('images', req.files.image[0].filename);
      }

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
