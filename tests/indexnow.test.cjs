const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {canonicalPages,safeURL,selectChanges,payload,submit,verifyLive}=require('../scripts/indexnow.cjs');
const {key}=require('../data/indexnow.json'),origin='https://danilostoletovic.com';
const html=url=>`<link rel="canonical" href="${url}"><meta name="robots" content="index,follow">`;
test('public key is exact static text, bypasses root-only Functions and has explicit headers',()=>{
 assert.match(key,/^[a-f0-9]{64}$/);assert.equal(fs.readFileSync(`${key}.txt`,'utf8'),key);
 const routes=JSON.parse(fs.readFileSync('_routes.json'));assert.deepEqual(routes.include,['/','/index.html']);
 assert(fs.readFileSync('_headers','utf8').includes(`/${key}.txt\n  Content-Type: text/plain`));
 assert(!fs.readFileSync('_redirects','utf8').includes(key));
});
test('only bilingual canonical indexable pages selected; unsafe and technical URLs rejected',()=>{
 const urls=canonicalPages(fs.readFileSync('sitemap.xml','utf8'),file=>fs.readFileSync(file,'utf8'));
 assert.equal(urls.length,22);assert(urls.includes(origin+'/en/'));assert(urls.includes(origin+'/sr/'));assert(!urls.includes(origin+'/'));
 for(const url of [origin+'/',origin+'/api/',origin+'/en/404.html',origin+'/en/?a=1',origin+'/en/#about','https://evil.test/en/','http://danilostoletovic.com/en/',origin+'/case-studies/secretary/'])assert.throws(()=>safeURL(url));
 const url=origin+'/en/';const xml=`<loc>${url}</loc>`;
 assert.deepEqual(canonicalPages(xml,()=>html(url).replace('index,follow','noindex,follow')),[]);
 assert.deepEqual(canonicalPages(xml,()=>html(origin+'/sr/')),[]);
 assert.deepEqual(canonicalPages(xml,()=>html(url)+'<meta http-equiv="refresh" content="0">'),[]);
 const body=payload(urls);assert.equal(body.host,'danilostoletovic.com');assert.equal(body.keyLocation,`${origin}/${key}.txt`);assert.equal(body.urlList.length,22);
});
test('change detection includes added, modified and deleted pages, skips unchanged pages',()=>{
 const en=origin+'/en/',sr=origin+'/sr/',added=origin+'/en/new/',deleted=origin+'/sr/old/';
 const before={'en/index.html':'same','sr/index.html':'old','sr/old/index.html':'deleted'};
 const now={'en/index.html':'same','sr/index.html':'new','en/new/index.html':'added'};
 const result=selectChanges([en,sr,added],[en,sr,deleted],file=>now[file],file=>before[file],[]);
 assert.deepEqual(result.urls,[sr,added,deleted]);assert.deepEqual(result.deleted,[deleted]);
 assert.deepEqual(selectChanges([en],[en],()=>'<script src="/js/a.js">',()=>'<script src="/js/a.js">',['js/a.js']).urls,[en]);
 assert.deepEqual(selectChanges([en],[en],()=>html(en),()=>html(en),['README.md']).urls,[]);
});
test('IndexNow handles acceptance, permanent rejection, rate limits and transient/network failures',async()=>{
 for(const status of [200,202])assert.equal(await submit([origin+'/en/'],async(url,options)=>{assert.equal(url,'https://api.indexnow.org/indexnow');assert.equal(JSON.parse(options.body).key,key);return new Response(null,{status});}),status);
 for(const status of [400,403,422]){let calls=0;await assert.rejects(submit([origin+'/en/'],async()=>{calls++;return new Response(null,{status});},async()=>{}));assert.equal(calls,1);}
 let calls=0,delays=[];
 assert.equal(await submit([origin+'/en/'],async()=>new Response(null,{status:++calls===1?429:200,headers:{'Retry-After':'2'}}),async ms=>delays.push(ms)),200);assert.deepEqual(delays,[2000]);
 calls=0;await assert.rejects(submit([origin+'/en/'],async()=>{calls++;throw Error('offline');},async()=>{}));assert.equal(calls,4);
 calls=0;assert.equal(await submit([origin+'/en/'],async()=>new Response(null,{status:++calls===1?503:200}),async()=>{}),200);
});
test('live verification blocks wrong deployments, missing keys, redirects/noindex and unremoved deletions',async()=>{
 const sha='a'.repeat(40),url=origin+'/en/',old=origin+'/sr/old/';
 function mock(overrides={}){return async target=>{
  const suffix=target.slice(origin.length);
  if(overrides[suffix])return overrides[suffix]();
  if(suffix==='/deployment-version.txt')return new Response(sha);
  if(suffix===`/${key}.txt`)return new Response(key,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
  if(target===old)return new Response('gone',{status:404});
  return new Response(html(target));
 };}
 await verifyLive([url,old],[old],sha,mock());
 await assert.rejects(verifyLive([url],[],sha,mock({'/deployment-version.txt':()=>new Response('b'.repeat(40))})));
 await assert.rejects(verifyLive([url],[],sha,mock({[`/${key}.txt`]:()=>new Response('<html>fallback</html>')})));
 await assert.rejects(verifyLive([url],[],sha,mock({'/en/':()=>new Response(null,{status:302})})));
 await assert.rejects(verifyLive([url],[],sha,mock({'/en/':()=>new Response(html(url),{headers:{'X-Robots-Tag':'noindex'}})})));
 await assert.rejects(verifyLive([old],[old],sha,mock({'/sr/old/':()=>new Response(html(old))})));
});
test('workflow is post-success production only with concurrency, live checks and nonfatal notification',()=>{
 const workflow=fs.readFileSync('.github/workflows/indexnow.yml','utf8');
 assert(workflow.includes('deployment_status'));assert(workflow.includes("deployment_status.state == 'success'"));assert(workflow.includes('production_environment == true'));assert(workflow.includes("deployment.environment == 'Production'"));
 assert(!workflow.includes('pull_request:'));assert(!workflow.includes('push:'));assert(workflow.includes('workflow_dispatch:'));assert(workflow.includes('cancel-in-progress: false'));assert(workflow.includes('continue-on-error: true'));
 assert(workflow.indexOf('node scripts/build.cjs')<workflow.indexOf('node scripts/indexnow.cjs'));
});
