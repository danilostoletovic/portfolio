const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const testimonials = JSON.parse(fs.readFileSync(path.join(root, 'data/testimonials.json'), 'utf8'));
const escape = value => value.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for (const entry of testimonials) {
  if (entry.approvedForPublication !== true || ['name','country','role','quote'].some(key => typeof entry[key] !== 'string' || !entry[key].trim())) {
    throw new Error('Every testimonial must contain complete, publication-approved content.');
  }
}
const html = testimonials.map(entry => `<figure class="testimonial"><blockquote><p>“${escape(entry.quote)}”</p></blockquote><figcaption><strong>${escape(entry.name)}</strong> — ${escape(entry.country)}<br><span class="small">${escape(entry.role)}</span></figcaption></figure>`).join('\n      ');
const markdown = testimonials.map(entry => `### ${entry.name} — ${entry.country}\n\n> ${entry.quote}\n\n— ${entry.name}, ${entry.role}`).join('\n\n');
for (const [file, content] of [['index.html', html], ['index.md', markdown]]) {
  const filename = path.join(root, file);
  let source = fs.readFileSync(filename, 'utf8');
  const block = /<!-- testimonials:start -->[\s\S]*?<!-- testimonials:end -->/g;
  if ([...source.matchAll(block)].length !== 1) throw new Error(`Expected one testimonial region in ${file}.`);
  source = source.replace(block, () => `<!-- testimonials:start -->\n${file.endsWith('.html')?'      ':''}${content}\n${file.endsWith('.html')?'      ':''}<!-- testimonials:end -->`);
  fs.writeFileSync(filename, source);
}
