import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = await readFile(new URL('../functions/_middleware.js', import.meta.url), 'utf8');
const { onRequest } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const markdown = await readFile(new URL('../index.md', import.meta.url), 'utf8');

function context(accept, method = 'GET', path = '/') {
  return {
    request: new Request(`https://danilostoletovic.com${path}`, {
      method, headers: { Accept: accept, 'If-None-Match': 'html-etag', Range: 'bytes=0-9' },
    }),
    env: { ASSETS: { fetch: async (request) => {
      assert.equal(new URL(request.url).pathname, '/index.md');
      assert.equal(new URL(request.url).search, '');
      assert.equal(request.headers.has('If-None-Match'), false);
      assert.equal(request.headers.has('Range'), false);
      return new Response(request.method === 'HEAD' ? null : markdown, {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
      });
    } } },
    next: async () => new Response('<!DOCTYPE html>', {
      headers: { 'Content-Type': 'text/html', Vary: 'Accept-Encoding' },
    }),
  };
}

for (const [accept, type] of [
  ['text/markdown', 'text/markdown'],
  ['text/markdown, text/html', 'text/markdown'],
  ['TEXT/MARKDOWN; q=1, text/html;q=0.5', 'text/markdown'],
  ['text/html, text/markdown;q=0.5', 'text/html'],
  ['text/markdown;q=0', 'text/html'],
  ['text/markdown;q=invalid', 'text/html'],
  ['text/markdown;q=0.2, text/*;q=0.8', 'text/html'],
  ['text/html,application/xhtml+xml,*/*;q=0.8', 'text/html'],
  ['*/*', 'text/html'],
  ['', 'text/html'],
]) {
  test(`Accept ${JSON.stringify(accept)} returns ${type}`, async () => {
    const response = await onRequest(context(accept));
    assert.ok(response.headers.get('Content-Type').startsWith(type));
    assert.match(response.headers.get('Vary'), /Accept/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Cloudflare-CDN-Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Content-Signal'), 'search=yes, ai-input=yes, ai-train=yes');
    if (type === 'text/markdown') {
      assert.equal(await response.text(), markdown);
      assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    } else assert.equal(response.headers.get('Vary'), 'Accept-Encoding, Accept');
  });
}

test('HEAD returns negotiated headers without a body', async () => {
  for (const accept of ['text/markdown', 'text/html']) {
    const response = await onRequest(context(accept, 'HEAD'));
    assert.equal(await response.text(), '');
    assert.ok(response.headers.get('Content-Type').startsWith(accept));
  }
});

test('discovery links survive HTML and Markdown GET/HEAD and preserve existing links', async () => {
  for (const path of ['/', '/index.html']) {
    for (const method of ['GET', 'HEAD']) {
      for (const accept of ['text/html', 'text/markdown']) {
        const ctx = context(accept, method, path);
        const existingLink = '<https://danilostoletovic.com/>; rel="canonical"';
        const getResponse = accept === 'text/markdown' ? ctx.env.ASSETS.fetch : ctx.next;
        const withLink = async (...args) => {
          const response = await getResponse(...args);
          response.headers.set('Link', existingLink);
          return response;
        };
        if (accept === 'text/markdown') ctx.env.ASSETS.fetch = withLink;
        else ctx.next = withLink;
        const response = await onRequest(ctx);
        assert.equal(response.status, 200);
        const links = response.headers.get('Link');
        assert.ok(links.includes(existingLink));
        for (const relation of ['api-catalog', 'service-desc', 'service-doc', 'describedby']) {
          assert.ok(links.includes(`rel="${relation}"`));
        }
        assert.match(links, /anchor="https:\/\/secretary\.danilostoletovic\.com\/chat"/);
        if (method === 'HEAD') assert.equal(await response.text(), '');
      }
    }
  }
});

test('index.html alias and query strings negotiate Markdown', async () => {
  const response = await onRequest(context('text/markdown', 'GET', '/index.html?source=agent'));
  assert.equal(await response.text(), markdown);
});

test('unrelated routes and non-read methods pass through', async () => {
  for (const [method, path] of [['POST', '/'], ['GET', '/missing'], ['GET', '/style.css']]) {
    const response = await onRequest(context('text/markdown', method, path));
    assert.equal(await response.text(), '<!DOCTYPE html>');
    assert.equal(response.headers.has('Content-Signal'), false);
  }
});

test('asset errors retain their status', async () => {
  const ctx = context('text/markdown');
  ctx.env.ASSETS.fetch = async () => new Response('Not found', { status: 404 });
  assert.equal((await onRequest(ctx)).status, 404);
});

test('routes and static headers match the handler contract', async () => {
  const routes = JSON.parse(await readFile(new URL('../_routes.json', import.meta.url), 'utf8'));
  assert.deepEqual(routes.include, ['/', '/index.html']);
  const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
  assert.match(headers, /\/index\.md\s+Content-Type: text\/markdown; charset=utf-8/);
  assert.match(headers, /Content-Signal: search=yes, ai-input=yes, ai-train=yes/);
  const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.equal((robots.match(/^User-agent:/gm) ?? []).length, 1);
  assert.match(robots, /User-agent: \*\s+Content-Signal: search=yes, ai-input=yes, ai-train=yes\s+Allow: \//);
});
