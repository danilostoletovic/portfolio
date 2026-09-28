import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('catalog links resolve to maintained documentation and the client API', async () => {
  const catalog = JSON.parse(await read('.well-known/api-catalog'));
  const client = await read('js/secretary.js');
  assert.equal(catalog.linkset.length, 1);
  for (const entry of catalog.linkset) {
    assert.ok(client.includes(entry.anchor));
    for (const relation of ['service-desc', 'service-doc']) {
      assert.ok(entry[relation].length > 0);
      for (const link of entry[relation]) {
        const url = new URL(link.href);
        assert.equal(url.origin, 'https://danilostoletovic.com');
        assert.ok((await read(url.pathname.slice(1))).length > 0);
      }
    }
    const spec = JSON.parse(await read('openapi.json'));
    assert.equal(spec.openapi, '3.1.0');
    assert.equal(spec.servers[0].url + '/chat', entry.anchor);
    assert.deepEqual(spec.security, []);
    assert.deepEqual(spec.paths['/chat'].post.requestBody.content['application/json'].schema.required, ['message']);
    assert.deepEqual(spec.paths['/chat'].post.responses['200'].content['application/json'].schema.required, ['reply']);
  }
});

test('static discovery resources have explicit MIME types and catalog HEAD links', async () => {
  const headers = await read('_headers');
  assert.match(headers, /\/\.well-known\/api-catalog\r?\n  Content-Type: application\/linkset\+json/);
  assert.match(headers, /Link: <\/\.well-known\/api-catalog>; rel="api-catalog"/);
  for (const path of ['api.md', 'auth.md']) {
    assert.ok(headers.includes(`/${path}\n  Content-Type: text/markdown`) || headers.includes(`/${path}\r\n  Content-Type: text/markdown`));
  }
  assert.match(await read('auth.md'), /^# auth\.md\r?\n/);
  const routes = JSON.parse(await read('_routes.json'));
  assert.ok(!routes.include.includes('/.well-known/api-catalog'));
});
