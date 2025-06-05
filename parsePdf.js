const fs = require('fs');
const pdf = require('pdf-parse');

async function parseCatalogPdf(filePath) {
  const data = await pdf(fs.readFileSync(filePath));
  const text = data.text || '';
  const modelMatch = text.match(/Model\s*No\.?\s*[:\-]?\s*([A-Za-z0-9-]+)/i);
  const specMatch = text.match(/Pitch\s*[:\-]?\s*([^\n]+)/i);
  const tolMatch = text.match(/Tolerance\s*[:\-]?\s*([^\n]+)/i);
  const typeMatch = text.match(/(Roller Chain|Conveyor Chain)/i);
  return {
    modelNo: modelMatch ? modelMatch[1].trim() : '',
    type: typeMatch ? typeMatch[1].trim() : '',
    spec: specMatch ? specMatch[1].trim() : '',
    tolerance: tolMatch ? tolMatch[1].trim() : ''
  };
}

module.exports = parseCatalogPdf;
