const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
for (const [id, file] of [['portfolio-styles', 'style.css'], ['secretary-styles', 'css/secretary.css']]) {
  const css = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n').trim();
  if (/<\/style/i.test(css) || /@import\b|url\(/i.test(css)) {
    throw new Error(`${file}: review HTML escaping and relative asset URLs before inlining.`);
  }
  const block = new RegExp(`<style id="${id}">[\\s\\S]*?</style>`, 'g');
  if ([...html.matchAll(block)].length !== 1) throw new Error(`Expected one ${id} style block.`);
  html = html.replace(block, () => `<style id="${id}">\n${css}\n  </style>`);
}
fs.writeFileSync(htmlPath, html);
