const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'tsubaki.db');

const db = new sqlite3.Database(DB_PATH);

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
  db.get('SELECT COUNT(*) AS count FROM chains', (err, row) => {
    if (!err && row.count === 0) {
      const stmt = db.prepare(
        'INSERT INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
      );
      // Insert a couple of placeholder rows so the interface has data to display
      // Real catalog and image files will be provided after crawling the
      // official Tsubakimoto site.
      stmt.run('RF2040', 'roller', '1/2 pitch', '+0/-0.1', '#', '#');
      stmt.run('CONV500', 'conveyor', 'Standard', '+0/-0.2', '#', '#');
      stmt.finalize();
    }
  });
});

app.get('/api/chains', (req, res) => {
  db.all('SELECT * FROM chains', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/chains', (req, res) => {
  const { modelNo, type, spec, tolerance, catalog, image } = req.body;
  const stmt = db.prepare(
    'INSERT INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(modelNo, type, spec, tolerance, catalog, image, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

app.put('/api/chains/:id', (req, res) => {
  const { id } = req.params;
  const { modelNo, type, spec, tolerance, catalog, image } = req.body;
  db.run(
    'UPDATE chains SET modelNo=?, type=?, spec=?, tolerance=?, catalog=?, image=? WHERE id=?',
    [modelNo, type, spec, tolerance, catalog, image, id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

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
