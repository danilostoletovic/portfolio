const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {root,routes,transform}=require('../scripts/localization.cjs');
const sr=require('../data/locales/sr.json');
test('homepages use ordinary static directory indexes and natural Serbian copy',()=>{
 for(const language of ['en','sr']){
  assert(fs.existsSync(path.join(root,language,'index.html')));
  assert(!fs.existsSync(path.join(root,language+'.html')));
 }
 assert.equal(sr['Your idea deserves'],'Tvoja ideja');
 assert.equal(sr['light.'],'zaživi.');
});
test('root detection respects preference, first browser language, fallback and explicit URLs',()=>{
 const source=fs.readFileSync(path.join(root,'js/language-entry.js'),'utf8');
 function detect({saved,languages=['en-US'],pathname='/',blocked=false}={}){
  const redirects=[];vm.runInNewContext(source,{location:{pathname,search:'?ref=test',hash:'#about',replace:url=>redirects.push(url)},navigator:{languages,language:languages[0]},localStorage:{getItem(){if(blocked)throw Error('Denied');return saved},setItem(){throw Error('Detection must never save preferences')}}});return redirects;
 }
 for(const language of ['sr','sr-RS','sr-Latn','sr-Latn-RS'])assert.deepEqual(detect({languages:[language]}),['/sr/?ref=test#about']);
 for(const language of ['en','en-GB','de-DE','fr',''])assert.deepEqual(detect({languages:[language]}),['/en/?ref=test#about']);
 assert.deepEqual(detect({saved:'en',languages:['sr-RS']}),['/en/?ref=test#about']);
 assert.deepEqual(detect({saved:'sr',languages:['en-US']}),['/sr/?ref=test#about']);
 assert.deepEqual(detect({saved:'garbage',languages:['sr']}),['/sr/?ref=test#about']);
 assert.deepEqual(detect({blocked:true,languages:['sr']}),['/sr/?ref=test#about']);
 assert.deepEqual(detect({languages:['de','sr']}),['/en/?ref=test#about']);
 for(const pathname of ['/en','/sr','/en/case-studies/secretary/','/sr/services/business-websites/'])assert.deepEqual(detect({pathname,saved:'sr'}),[]);
});
test('localized pages are static, translated, Latin-only, reciprocal and share unchanged technical assets',()=>{
 const sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 for(const route of routes)for(const language of ['en','sr']){
  const filename=language+route+(route.endsWith('/')?'index.html':'');
  const html=fs.readFileSync(path.join(root,filename),'utf8'),url='https://danilostoletovic.com/'+language+route;
  assert(html.includes(`<html lang="${language==='sr'?'sr-Latn':'en'}"`));
  assert(html.includes(`<link rel="canonical" href="${url}">`));
  assert(!html.includes('/js/language-entry.js'));
  assert(html.includes('hreflang="en"'));assert(html.includes('hreflang="sr-Latn"'));assert(html.includes('hreflang="x-default"'));
  assert(html.includes(`data-language="${language}"`));
  if(route!=='/404.html')assert(sitemap.includes(`<loc>${url}</loc>`));
  if(language==='sr')assert(!/[\u0400-\u04ff]/.test(html));
  for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.equal(JSON.parse(json)['@context'],'https://schema.org');
  for(const [,href]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   const target=new URL(href,'https://danilostoletovic.com'+(route==='/'?'/'+language:'/'+language+route));
   if(target.origin!=='https://danilostoletovic.com')continue;
   let f=path.join(root,target.pathname);if(target.pathname.endsWith('/'))f=path.join(f,'index.html');
   assert(fs.existsSync(f),`${filename}: missing ${target.pathname}`);
  }
 }
 assert(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('content="noindex, follow"'));
});
test('translation catalogs cover every static source string without silently missing new copy',()=>{
 for(const route of routes){let html=fs.readFileSync(path.join(root,route==='/'?'index.html':route.endsWith('/')?route+'index.html':route),'utf8').replace(/<noscript id="language-entry-choices">[^]*?<\/noscript>/g,'');transform(html,key=>{if(key)assert(Object.hasOwn(sr,key),`Missing translation: ${key}`);return key;});}
 assert(!/[\u0400-\u04ff]/.test(JSON.stringify(sr)));
});
