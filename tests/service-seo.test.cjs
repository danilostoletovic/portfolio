const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {routes}=require('../scripts/localization.cjs');
const origin='https://danilostoletovic.com',services=routes.filter(r=>r.startsWith('/services/'));
test('service intent pages have unique bilingual metadata, evidence, contact and valid localized schema',()=>{
 const titles=new Set(),descriptions=new Set();
 for(const language of ['en','sr'])for(const route of services){
  const url=origin+'/'+language+route,html=fs.readFileSync(language+route+'index.html','utf8');
  const title=html.match(/<title>([^]*?)<\/title>/)[1],description=html.match(/name="description" content="([^"]+)"/)[1];
  assert(!titles.has(title));titles.add(title);assert(!descriptions.has(description));descriptions.add(description);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes(`rel="canonical" href="${url}"`));
  assert(!html.includes('content="noindex'));assert(html.includes('data-contact'));assert(html.includes('id="contact-popup"'));
  assert(html.includes(`href="/${language}/case-studies/`));assert(html.includes('service-directory'));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1])['@graph'];
  const service=graph.find(n=>n['@type']==='Service');assert(service);assert.equal(service.url,url);assert(service.provider['@id']);
  assert(graph.some(n=>n['@type']==='BreadcrumbList'));assert(!graph.some(n=>['LocalBusiness','AggregateRating','Review'].includes(n['@type'])));
  if(route.includes('ai-integrations'))assert(!service.serviceType.includes('website')); 
  for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const target=new URL(href.replaceAll('&amp;','&'),url);if(target.origin!==origin)continue;
   const file=path.join('.',target.pathname,target.pathname.endsWith('/')?'index.html':'');assert(fs.existsSync(file),`${url}: ${file}`);
   if(target.hash&&file.endsWith('.html'))assert(fs.readFileSync(file,'utf8').includes(`id="${target.hash.slice(1)}"`));
  }
 }
});
test('all five services are linked from each homepage, and canonical routes enter sitemap and redirects',()=>{
 const sitemap=fs.readFileSync('sitemap.xml','utf8'),redirects=fs.readFileSync('_redirects','utf8');
 assert.equal(services.length,5);
 for(const route of services)for(const lang of ['en','sr']){
  assert(fs.readFileSync(`${lang}/index.html`,'utf8').includes(`href="/${lang}${route}"`));
  assert(sitemap.includes(`<loc>${origin}/${lang}${route}</loc>`));
  assert(redirects.includes(`${route} /en${route} 301`));
  assert(!redirects.split('\n').some(line=>line.startsWith('/'+lang+route+' ')));
 }
});
