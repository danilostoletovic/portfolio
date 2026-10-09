const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const origin='https://danilostoletovic.com';
const routes=['/case-studies/smart-vehicle/','/case-studies/secretary/','/case-studies/class-timetable/','/case-studies/promptui/','/case-studies/portfolio/','/services/mobile-app-development/','/services/business-websites/'];
function fileFor(url) { return path.join(root,url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname); }
test('new public pages have unique metadata, valid structured data, and resolvable local navigation',()=>{
 const titles=new Set();
 for(const route of routes) {
  const html=fs.readFileSync(fileFor(new URL(route,origin)),'utf8');
  const title=html.match(/<title>(.*?)<\/title>/)[1];
  assert(!titles.has(title));titles.add(title);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert(html.includes(`<link rel="canonical" href="${origin}${route}">`));
  assert(html.includes('<meta name="description"'));
  for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
   const data=JSON.parse(json);assert.equal(data['@context'],'https://schema.org');
   assert(!json.includes('AggregateRating'));assert(!json.includes('Review'));
  }
  for(const [,href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
   const url=new URL(href.replaceAll('&amp;','&'),origin+route);
   if(url.origin!==origin) continue;
   const filename=fileFor(url);assert(fs.existsSync(filename),`${route}: missing ${url.pathname}`);
   if(url.hash && filename.endsWith('.html')) {
    const target=fs.readFileSync(filename,'utf8');
    assert(target.includes(`id="${url.hash.slice(1)}"`),`${route}: missing anchor ${url.hash}`);
   }
  }
 }
});
test('sitemap and discovery catalogs include the new pages',()=>{
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 const homepage=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const markdown=fs.readFileSync(path.join(root,'index.md'),'utf8');
 const llms=fs.readFileSync(path.join(root,'llms.txt'),'utf8');
 const catalog=JSON.parse(fs.readFileSync(path.join(root,'.well-known/ai-catalog.json'),'utf8'));
 for(const route of routes) {
  for (const language of ['en', 'sr']) assert(sitemap.includes(`<loc>${origin}/${language}${route}</loc>`));
  assert(homepage.includes(`href="${route}"`));
  assert(markdown.includes(origin+route));assert(llms.includes(origin+route));
  assert(catalog.entries.some(e=>e.url===origin+route));
 }
});
test('workshop project overviews and evidence links resolve to real public content',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert(html.includes('id="ana-project"'));
 assert(html.includes('id="yolo-smart-vehicle"'));
 for(const slug of ['smart-vehicle','secretary','class-timetable','promptui','portfolio']) {
  assert(html.includes(`data-open-project="${slug}"`));
  assert(html.includes(`id="case-${slug}"`));
  const page=fs.readFileSync(path.join(root,'case-studies',slug,'index.html'),'utf8');
  assert(page.includes('/js/secretary.js?v=7'));
  assert(page.includes('/js/workshop.js?v=4'));
 }
 for(const [,href] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
  const url=new URL(href.replaceAll('&amp;','&'),origin+'/');
  if(url.origin!==origin)continue;
  assert(fs.existsSync(fileFor(url)),`Missing homepage resource: ${url.pathname}`);
  if(url.hash&&fileFor(url).endsWith('.html'))assert(fs.readFileSync(fileFor(url),'utf8').includes(`id="${url.hash.slice(1)}"`),`Missing homepage target ${url.hash}`);
 }
 assert(html.includes('project archive — use Ask Ana for the current experience'));
 assert(html.includes('Offline demo / no live model response shown'));
 assert(html.includes('<dialog id="project-inspector"'));
 assert(!html.includes('class="flagship-projects"'));
 const main=html.match(/<main id="main-content"[\s\S]*?<\/main>/)[0];
 assert(!main.includes('class="case-chapter"'),'Technical chapters must stay outside initial homepage content');
 assert(main.includes('class="project-archive"'),'The project archive should be progressively disclosed');
 assert(!main.includes('class="hero-bench"'),'Hero must not include the SmartVehicle figure');
 assert(main.indexOf('id="offers"')<main.indexOf('id="work"'),'Services must precede projects');
 assert(main.includes('class="service-workbench"'));
 assert(main.includes('class="feedback-stage"'));
 for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);
});
test('fictional testimonial drafts are separated from published content and AI knowledge',()=>{
 const drafts=fs.readFileSync(path.join(root,'data/testimonial-samples.md'),'utf8');
 assert(drafts.includes('fictional placeholders'));
 const approved=JSON.parse(fs.readFileSync(path.join(root,'data/testimonials.json'),'utf8'));
 assert.equal(approved.length,3);
 assert(approved.every(entry=>entry.approvedForPublication===true));
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const markdown=fs.readFileSync(path.join(root,'index.md'),'utf8');
 for(const entry of approved) { assert(html.includes(entry.quote)); assert(markdown.includes(entry.quote)); }
 for(const filename of ['index.html','index.md',...routes.map(r=>r+'index.html'),'../secretary/src/knowledge/projects.json']) {
  const text=fs.readFileSync(path.join(root,filename),'utf8');
  for(const name of ['Oliver Jones','Erik Johansson']) assert(!text.includes(name));
 }
});
