const fs = require('fs');
const path = require('path');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const cheerio = require('cheerio');
const parseCatalogPdf = require('./parsePdf');

const CATALOG_DIR = path.join(__dirname, 'catalog');
const JSON_PATH = path.join(__dirname, 'chains.json');

const fallbackUrls = [
  'http://file.tsubakimoto-tck.co.kr/drivechain2020-web.pdf',
  'http://file.tsubakimoto-tck.co.kr/smallconveyorchain2024-web.pdf',
  'https://tsubakimoto-tck.co.kr/gs/data/gs_shop_category/3_gs_file2_0_1958484775.pdf'
];

async function fetchPdfUrls() {
  try {
    const res = await axios.get('https://tsubakimoto-tck.co.kr/goods_main.php');
    const $ = cheerio.load(res.data);
    const urls = new Set();
    $('a[href$=".pdf"]').each((i, el) => {
      let href = $(el).attr('href');
      if (!href) return;
      if (!href.startsWith('http')) {
        href = new URL(href, 'https://tsubakimoto-tck.co.kr').href;
      }
      urls.add(href);
    });
    if (urls.size === 0) throw new Error('no links found');
    return Array.from(urls);
  } catch (err) {
    console.error('Failed to fetch PDF list:', err.message);
    return fallbackUrls;
  }
}

async function download(url, dest) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(dest, res.data);
}

async function processPdf(filePath) {
  const parsed = await parseCatalogPdf(filePath);
  return {
    id: Date.now(),
    modelNo: parsed.modelNo || path.basename(filePath, '.pdf'),
    type: parsed.type || '',
    spec: parsed.spec || '',
    tolerance: parsed.tolerance || '',
    catalog: filePath,
    image: ''
  };
}

async function main() {
  if (!fs.existsSync(CATALOG_DIR)) fs.mkdirSync(CATALOG_DIR, { recursive: true });
  let chains = [];
  if (fs.existsSync(JSON_PATH)) {
    chains = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  }
  const db = new sqlite3.Database(path.join(__dirname, 'tsubaki.db'));
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
  });

  const urls = await fetchPdfUrls();
  for (const url of urls) {
    const name = path.join(CATALOG_DIR, path.basename(url));
    try {
      if (!fs.existsSync(name)) {
        console.log(`Downloading ${url}`);
        await download(url, name);
      }
      console.log(`Parsing ${name}`);
      const item = await processPdf(name);
      chains.push(item);

      const stmt = db.prepare(
        'INSERT OR IGNORE INTO chains (modelNo, type, spec, tolerance, catalog, image) VALUES (?, ?, ?, ?, ?, ?)'
      );
      stmt.run(item.modelNo, item.type, item.spec, item.tolerance, item.catalog, item.image);
      stmt.finalize();
    } catch (err) {
      console.error('Failed to process', url, err.message);
    }
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(chains, null, 2));
  console.log('Saved', JSON_PATH);
  db.close();
}

main().catch(err => console.error(err));
