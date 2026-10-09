const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {root,routes}=require('../scripts/localization.cjs');
const origin='https://danilostoletovic.com';
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('every canonical language page has equivalent alternates and localized social metadata',()=>{
 const sitemap=read('sitemap.xml');
 for(const route of routes.filter(r=>r!=='/404.html'))for(const language of ['en','sr']){
  const html=read(language+route+'index.html'),url=origin+'/'+language+route;
  for(const [locale,prefix]of [['en','en'],['sr-Latn','sr'],['x-default','en']]){
   const expected=locale==='x-default'&&route==='/'?origin+'/':origin+'/'+prefix+route;
   assert(html.includes(`<link rel="alternate" hreflang="${locale}" href="${expected}">`));
  }
  assert(html.includes(`<meta name="twitter:url" content="${url}">`));
  assert(html.includes('<meta name="twitter:card" content="summary_large_image">'));
  assert(html.includes('<meta name="twitter:image"'));
  const title=html.match(/<title>(.*?)<\/title>/)[1],description=html.match(/<meta name="description" content="([^"]*)"/)[1];
  assert(html.includes(`<meta name="twitter:title" content="${title}">`));
  assert(html.includes(`<meta name="twitter:description" content="${description}">`));
  assert(sitemap.includes(`<loc>${url}</loc>`));
  assert(!/content="noindex/.test(html));
 }
 assert(read('sr/index.html').includes('<meta name="twitter:image:alt" content="Danilo Stoletović — Full-stack developer'));
 assert(read('robots.txt').includes('Allow: /'));
});
test('buyer answers are discoverable static content and case evidence retains a direct commercial next step',()=>{
 for(const language of ['en','sr']){
  const home=read(language+'/index.html');
  const faq=home.match(/<div class="buyer-answers">([\s\S]*?)<\/div>/)[1];
  assert.equal((faq.match(/<details>/g)||[]).length,6);assert(!faq.includes('<details open'));
  assert.equal((home.match(/class="hero-contact"/g)||[]).length,1);
  assert.equal((home.match(/class="project-context"/g)||[]).length,5);
  assert(!home.includes('<article id="case-'));
  for(const route of routes.filter(r=>r.startsWith('/case-studies/'))){
   const html=read(language+route+'index.html');
   assert(html.includes('class="project-next-step"'));assert(html.includes('class="project-context"'));
   assert(html.includes('mailto:contact@danilostoletovic.com?subject='));
   assert.equal((html.match(/src="\/js\/conversion.js/g)||[]).length,1);
  }
  for(const image of home.matchAll(/<img\b[^>]*src="\/img\/projects\/[^>]+>/g)){
   assert(/width="\d+"/.test(image[0])&&/height="\d+"/.test(image[0]));assert(image[0].includes('loading="lazy"'));
  }
 }
});
test('localized embedded styles stay synchronized with their shared sources',()=>{
 for(const language of ['en','sr'])for(const [id,file]of [['portfolio-styles','style.css'],['secretary-styles','css/secretary.css']]){
  const html=read(language+'/index.html'),css=read(file).replace(/\r\n/g,'\n').trim();
  assert.equal(html.match(new RegExp(`<style id="${id}">([\\s\\S]*?)</style>`))[1].trim(),css);
 }
});
