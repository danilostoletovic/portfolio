import { renderTestimonials } from './testimonials.mjs';
// Dependency-free, explicit public asset allowlist. Functions compile separately in Pages.
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

export const publicFiles = [
  'LICENSE', 'index.html', '404.html', 'index.md', 'llms.txt', 'AGENTS.md', 'humans.txt',
  'robots.txt', 'sitemap.xml', 'site.webmanifest', 'favicon.ico', 'security.txt',
  'openapi.json', 'api.md', 'auth.md', '_headers', '_routes.json',
  'style.css', 'style.min.css', 'css/secretary.css', 'js/secretary.js',
  '.well-known/ai-catalog.json', '.well-known/api-catalog', '.well-known/security.txt',
  'img/profilePicture.avif', 'img/profilePicture-140.avif', 'img/profilePicture-280.avif',
  'img/logo.avif', 'img/desktop.png', 'img/mobile.png', 'img/securityHeaders.png',
  'img/favicon/favicon.svg', 'img/favicon/favicon.ico', 'img/favicon/favicon-96x96.png',
  'img/favicon/apple-touch-icon.png', 'img/favicon/site.webmanifest',
  'img/favicon/web-app-manifest-192x192.png', 'img/favicon/web-app-manifest-512x512.png',
];
const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await mkdir(output, { recursive: true });
// Fail closed if a previous output contains anything outside the allowlist.
for (const entry of await readdir(output, { recursive: true, withFileTypes: true })) {
  if (entry.isDirectory()) continue;
  const assetPath = relative(fileURLToPath(output), join(entry.parentPath, entry.name)).replaceAll('\\', '/');
  if (!entry.isFile() || !publicFiles.includes(assetPath)) throw new Error('Unexpected output entry; inspect dist before rebuilding.');
}
for (const file of publicFiles) {
  const destination = new URL(file, output);
  await mkdir(dirname(fileURLToPath(destination)), { recursive: true });
  await copyFile(new URL(file, root), destination);
}
const quotes = renderTestimonials(JSON.parse(await readFile(new URL('data/testimonials.json', root), 'utf8')));
for (const file of ['index.html', 'index.md']) {
  const path = new URL(file, output);
  let content = await readFile(path, 'utf8');
  if (quotes) content = content.replace(/<!-- testimonials:start -->[\s\S]*?<!-- testimonials:end -->/, () => '<!-- testimonials:start -->\n' + quotes + '\n<!-- testimonials:end -->');
  await writeFile(path, content);
}
console.log(`Built ${publicFiles.length} allowlisted public files in dist/.`);
