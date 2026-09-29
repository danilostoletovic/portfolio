const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, '.well-known/agent-skills/index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
for (const skill of index.skills) {
  const url = new URL(skill.url, 'https://danilostoletovic.com');
  if (url.origin !== 'https://danilostoletovic.com'
      || !/^\/\.well-known\/agent-skills\/[a-z0-9-]+\/SKILL\.md$/.test(url.pathname)) {
    throw new Error('Expected a local skill artifact URL.');
  }
  const bytes = fs.readFileSync(path.join(root, url.pathname.slice(1)));
  skill.digest = `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
}
fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
