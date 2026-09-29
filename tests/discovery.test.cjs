const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/webmcp.js'), 'utf8');

function browser(mode = 'document', registerError = false) {
  const registered = [];
  const events = {};
  const section = { id: 'work', innerText: 'Published projects',
    querySelectorAll: () => [{ textContent: ' Repository ', href: 'https://github.com/danilostoletovic' }],
    scrollIntoView: () => { section.scrolled = true; } };
  const context = { registerTool(tool, options) {
    registered.push({ tool, options });
    return registerError ? Promise.reject(new Error('Unsupported')) : Promise.resolve();
  } };
  const document = { getElementById: id => id === 'work' ? section : null };
  const navigator = {};
  if (mode === 'document') document.modelContext = context;
  if (mode === 'navigator') navigator.modelContext = context;
  vm.runInNewContext(source, { document, navigator, AbortController,
    window: { addEventListener: (name, fn) => { events[name] = fn; } },
    console: { warn() {} } });
  return { registered, events, section };
}

test('skill digest matches the deployed artifact bytes and metadata', () => {
  const index = JSON.parse(fs.readFileSync(path.join(root, '.well-known/agent-skills/index.json')));
  assert.equal(index.$schema, 'https://schemas.agentskills.io/discovery/0.2.0/schema.json');
  for (const skill of index.skills) {
    const bytes = fs.readFileSync(path.join(root, new URL(skill.url).pathname.slice(1)));
    assert.equal(skill.digest, `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`);
    assert.ok(bytes.toString().includes(`name: ${skill.name}\n`));
    assert.ok(bytes.toString().includes(`description: ${skill.description}\n`));
    assert.equal(skill.type, 'skill-md');
  }
});
for (const mode of ['document', 'navigator']) {
  test(`WebMCP registers with ${mode}, reads content, navigates, and restores after pagehide`, async () => {
    const { registered, events, section } = browser(mode);
    assert.equal(registered.length, 2);
    const [read, navigate] = registered.map(entry => entry.tool);
    const result = await read.execute({ section: 'work' });
    assert.equal(result.text, section.innerText);
    assert.equal(result.links[0].label, 'Repository');
    await assert.rejects(read.execute({ section: '__proto__' }), /Unknown/);
    await assert.rejects(read.execute({ section: 'about' }), /unavailable/);
    await navigate.execute({ section: 'work' });
    assert.equal(section.scrolled, true);
    events.pageshow();
    assert.equal(registered.length, 2);
    events.pagehide();
    assert.equal(registered[0].options.signal.aborted, true);
    events.pageshow();
    assert.equal(registered.length, 4);
    assert.equal(registered[2].options.signal.aborted, false);
  });
}
test('unsupported browser does not register tools', () => {
  assert.equal(browser('none').registered.length, 0);
});
test('rejected registration is handled without breaking page scripts', async () => {
  browser('document', true);
  await new Promise(resolve => setImmediate(resolve));
});
