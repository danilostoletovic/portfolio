import '../scripts/build.mjs';
import { readFile, readdir, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';
const root = new URL('../dist/', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');
const origin = 'https://danilostoletovic.com/';
const profiles = ['https://www.upwork.com/freelancers/danilostoletovic', 'https://pro.fiverr.com/freelancers/stoletovicd'];

test('production graph has unique identities and resolvable relationships', async () => {
  const html = await read('index.html');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert.equal(blocks.length, 1);
  const data = JSON.parse(blocks[0][1]);
  assert.equal(data['@context'], 'https://schema.org');
  const graph = data['@graph'];
  const ids = new Set(graph.map(entity => entity['@id']));
  assert.equal(ids.size, graph.length);
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (value['@id']) assert.ok(ids.has(value['@id']), `Unresolved ${value['@id']}`);
    for (const child of Object.values(value)) visit(child);
  };
  visit(graph);
  const person = graph.find(e => e['@type'] === 'Person');
  assert.equal(person.url, origin);
  assert.ok(!person.alumniOf);
  assert.equal(graph.filter(e => e['@type'] === 'WebSite').length, 1);
  assert.equal(graph.filter(e => e['@type'] === 'Service').length, 2);
  assert.equal(graph.filter(e => e['@type'] === 'SoftwareSourceCode').length, 4);
  for (const profile of profiles) {
    assert.ok(person.sameAs.includes(profile));
    assert.ok(html.includes(`href="${profile}"`));
    for (const path of ['llms.txt', 'index.md', 'AGENTS.md', 'humans.txt']) assert.ok((await read(path)).includes(profile));
  }
});

test('production links and fragments resolve, with one canonical homepage', async () => {
  for (const file of ['index.html', '404.html']) {
    const html = await read(file);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length);
    for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      const url = new URL(match[1].replaceAll('&amp;', '&'), origin + file);
      if (url.origin !== new URL(origin).origin) continue;
      const target = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      await access(new URL(target, root));
      if (url.hash) assert.ok((await read(target)).includes(`id="${url.hash.slice(1)}"`), url.href);
    }
  }
  assert.equal((await read('index.html')).match(/rel="canonical" href="([^"]+)"/)[1], origin);
  const xml = await read('sitemap.xml');
  assert.deepEqual([...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]), [origin]);
  const robots = await read('robots.txt');
  assert.equal((robots.match(/User-agent:/g) || []).length, 1);
  assert.ok(robots.includes(`Sitemap: ${origin}sitemap.xml`));
  for (const path of ['/api/', '/admin/', '/functions/', '/tests/', '/.env', '/.dev.vars']) assert.ok(robots.includes(`Disallow: ${path}`));
});

test('output excludes private and development files and keeps security/client bytes intact', async () => {
  const files = await readdir(root, { recursive: true });
  for (const file of files) assert.doesNotMatch(file.replaceAll('\\', '/'), /(^|\/)(?:\.env.*|\.dev.vars.*|\.git|node_modules|functions|tests|scripts|README.md)$/);
  for (const file of ['_headers', '_routes.json', 'js/secretary.js', 'css/secretary.css']) {
    assert.deepEqual(await readFile(new URL(file, root)), await readFile(new URL(`../${file}`, import.meta.url)));
  }
  for (const file of files.filter(f => /\.(json|webmanifest)$/.test(f))) JSON.parse(await read(file.replaceAll('\\', '/')));
  for (const file of ['index.md', 'llms.txt', 'AGENTS.md']) assert.doesNotMatch(await read(file), /0 KB|Zero Client-Side JavaScript/);
});
