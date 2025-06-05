const fs = require('fs');
const path = require('path');
const axios = require('axios');
const parseCatalogPdf = require('./parsePdf');

const CATALOG_DIR = path.join(__dirname, 'catalog');
const JSON_PATH = path.join(__dirname, 'chains.json');

const pdfUrls = [
  'http://file.tsubakimoto-tck.co.kr/drivechain2020-web.pdf',
  'http://file.tsubakimoto-tck.co.kr/smallconveyorchain2024-web.pdf',
  'https://tsubakimoto-tck.co.kr/gs/data/gs_shop_category/3_gs_file2_0_1958484775.pdf'
];

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
  for (const url of pdfUrls) {
    const name = path.join(CATALOG_DIR, path.basename(url));
    try {
      if (!fs.existsSync(name)) {
        console.log(`Downloading ${url}`);
        await download(url, name);
      }
      console.log(`Parsing ${name}`);
      const item = await processPdf(name);
      chains.push(item);
    } catch (err) {
      console.error('Failed to process', url, err.message);
    }
  }
  fs.writeFileSync(JSON_PATH, JSON.stringify(chains, null, 2));
  console.log('Saved', JSON_PATH);
}

main().catch(err => console.error(err));
