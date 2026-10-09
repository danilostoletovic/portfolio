const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('skills have valid discovery metadata and local public artifacts', () => {
  const index = JSON.parse(read('.well-known/agent-skills/index.json'));
  assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  const names = new Set();
  for (const skill of index.skills) {
    assert.match(skill.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(skill.name.length <= 64);
    assert.ok(!names.has(skill.name));
    names.add(skill.name);
    assert.ok(skill.description.length > 0 && skill.description.length <= 1024);
    const url = new URL(skill.url);
    assert.equal(url.origin, 'https://danilostoletovic.com');
    assert.equal(url.pathname, `/.well-known/agent-skills/${skill.name}/SKILL.md`);
    assert.ok(fs.existsSync(path.join(root, url.pathname.slice(1))));
  }
  assert.ok(names.has('read-portfolio'));
  assert.ok(names.has('secretary-chat'));
});

test('discovery assets bypass homepage Functions and retain revalidating metadata headers', () => {
  const routes = JSON.parse(read('_routes.json'));
  assert.deepEqual(routes.include, ['/', '/index.html']);
  assert.ok(fs.existsSync(path.join(root, '404.html')));
  const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
  assert.ok(!/\.well-known|\*|index\.md|openapi/.test(redirects), 'Locale redirects must not catch discovery or technical resources');
  const headers = read('_headers');
  for (const pattern of ['/.well-known/agent-skills/index.json', '/.well-known/agent-skills/*/SKILL.md']) {
    assert.ok(headers.includes(pattern), `Missing discovery header rule: ${pattern}`);
    const block = headers.slice(headers.indexOf(pattern)).split(/\r?\n\r?\n/)[0];
    assert.match(block, pattern.endsWith('index.json')
      ? /Content-Type: application\/json; charset=utf-8/
      : /Content-Type: text\/markdown; charset=utf-8/);
    assert.match(block, /Cache-Control: public, max-age=0, must-revalidate/);
    assert.doesNotMatch(block, /immutable/);
    assert.match(block, /Access-Control-Allow-Origin: \*/);
  }
  assert.match(read('index.html'), /rel="agent-skills"/);
  assert.match(read('functions/_middleware.js'), /rel="agent-skills"/);
});

test('secretary discovery uses the existing endpoint without privileged or protocol claims', () => {
  const skill = read('.well-known/agent-skills/secretary-chat/SKILL.md');
  const api = JSON.parse(read('openapi.json'));
  const endpoint = `${api.servers[0].url}/chat`;
  assert.ok(skill.includes(endpoint));
  assert.ok(read('js/secretary.js').includes(endpoint));
  assert.match(skill, /Do not invoke chat during passive discovery/);
  assert.match(skill, /not an MCP server or an A2A protocol endpoint/);
  assert.match(skill, /Ana provides information and conversation only/);
  assert.match(skill, /does not create server sessions, persist tasks, or stream replies/);
});

test('production Agent Cards and speculative protocol discovery remain unpublished', () => {
  for (const file of ['.well-known/agent.json', '.well-known/agent-card.json']) {
    assert.ok(!fs.existsSync(path.join(root, file)), `${file} requires genuine A2A support first`);
  }
  for (const file of ['index.html', '_headers', 'functions/_middleware.js',
    '.well-known/ai-catalog.json', '.well-known/api-catalog', '.well-known/agent-skills/index.json', 'llms.txt']) {
    assert.doesNotMatch(read(file), /\/\.well-known\/agent(?:-card)?\.json/,
      `${file} must not advertise an unpublished Agent Card`);
  }
});

test('public capability discovery contains no internal Secretary configuration', () => {
  const index = JSON.parse(read('.well-known/agent-skills/index.json'));
  for (const file of ['.well-known/agent-skills/index.json', '.well-known/ai-catalog.json',
    '.well-known/api-catalog', ...index.skills.map(skill => new URL(skill.url).pathname.slice(1))]) {
    assert.doesNotMatch(read(file), /converseWithAna|buildSystemPrompt|OPENAI_API_KEY|ALLOWED_ORIGINS|CHAT_RATE_LIMITER/);
  }
});

test('public API contract matches confirmed conversational limits', () => {
  const api = JSON.parse(read('openapi.json'));
  assert.deepEqual(Object.keys(api.paths), ['/chat']);
  assert.deepEqual(api.security, []);
  const schema = api.paths['/chat'].post.requestBody.content['application/json'].schema;
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.message.maxLength, 2000);
  assert.equal(schema.properties.history.maxItems, 40);
  assert.deepEqual(schema.properties.history.items.properties.role.enum, ['user', 'assistant']);
  assert.equal(schema.properties.history.items.additionalProperties, false);
});
