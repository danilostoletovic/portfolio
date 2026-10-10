const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('functions/_middleware.js','utf8');
const modulePromise=import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
async function request(path,headers={}){
 const {onRequest}=await modulePromise;
 return onRequest({request:new Request('https://danilostoletovic.com'+path,{headers}),env:{ASSETS:{fetch:async req=>new Response(req.method==='HEAD'?null:'# Portfolio',{headers:{'Content-Security-Policy':"default-src 'self'",'Content-Type':'text/markdown'}})}},next:async()=>new Response('static',{status:path.includes('missing')?404:200})});
}
test('root has one temporary HTTP hop, preference negotiation and no shared caching',async()=>{
 for(const [headers,language] of [[{},'en'],[{'Accept-Language':'sr-Latn-RS,en;q=0.8'},'sr'],[{'Accept-Language':'de,sr;q=0.5'},'en'],[{'Accept-Language':'en;q=0.2,sr;q=0.9'},'sr'],[{'Accept-Language':'sr;q=0'},'en'],[{'Accept-Language':'sr','Cookie':'portfolioLanguage=en'},'en']]){
  const response=await request('/?ref=project',headers);
  assert.equal(response.status,302);assert.equal(response.headers.get('Location'),`https://danilostoletovic.com/${language}/?ref=project`);
  assert.equal(response.headers.get('Cache-Control'),'no-store');assert(response.headers.get('Vary').includes('Cookie'));
  assert.equal(response.headers.get('Content-Security-Policy'),"default-src 'self'");
  assert.equal((await request(`/${language}/`,headers)).status,200);
 }
 assert.equal((await request('/index.html')).status,302);
});
test('explicit locales, unknown paths and Markdown discovery retain their responses',async()=>{
 assert.equal((await request('/en/',{'Accept-Language':'sr'})).status,200);
 assert.equal((await request('/sr/',{'Cookie':'portfolioLanguage=en'})).status,200);
 assert.equal((await request('/missing')).status,404);
 const markdown=await request('/',{'Accept':'text/markdown'});assert.equal(markdown.status,200);assert.equal(await markdown.text(),'# Portfolio');
 assert(!fs.readFileSync('index.html','utf8').includes('src="/js/language-entry.js'));
 assert(fs.existsSync('404.html'));assert(fs.existsSync('_headers'));assert(fs.existsSync('_redirects'));
});
