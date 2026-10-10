/* Server-side CI utility only. Fixed production origin and API endpoint. */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const config=require('../data/indexnow.json');
const origin=`https://${config.host}`,endpoint='https://api.indexnow.org/indexnow';
function safeURL(value){
 const url=new URL(value);
 if(url.origin!==origin||url.username||url.password||url.search||url.hash||!/^\/(en|sr)\/(?:[a-z0-9-]+\/)*$/.test(url.pathname)||url.href!==value)throw Error('Only exact production localized canonical URLs are allowed');
 return url;
}
function indexable(html,url){
 return !/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*(?:noindex|none)/i.test(html)&&
  !/<meta\b[^>]*http-equiv=["']refresh/i.test(html)&&
  [...html.matchAll(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)/gi)].some(m=>m[1]===url);
}
function pageFile(url){return safeURL(url).pathname.slice(1)+'index.html';}
function canonicalPages(xml,read){
 const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 return [...new Set(urls)].filter(url=>{safeURL(url);return indexable(read(pageFile(url)),url);});
}
function selectChanges(current,previous,readNow,readBefore,changedFiles){
 const old=new Set(previous),now=new Set(current);
 const changed=current.filter(url=>!old.has(url)||readNow(pageFile(url))!==readBefore(pageFile(url))||changedFiles.some(file=>{
  // Shared assets are a relevant change only for pages that reference them.
  return /^(?:js|css|img)\//.test(file)&&readNow(pageFile(url)).includes('/'+file);
 }));
 return {urls:[...changed,...previous.filter(url=>!now.has(url))],deleted:previous.filter(url=>!now.has(url))};
}
function payload(urls){
 if(!/^[a-f0-9]{64}$/.test(config.key)||config.host!=='danilostoletovic.com')throw Error('Invalid key configuration');
 urls.forEach(safeURL);
 if(!urls.length||urls.length>10000)throw Error('Batch must contain 1–10,000 URLs');
 return {host:config.host,key:config.key,keyLocation:`${origin}/${config.key}.txt`,urlList:[...new Set(urls)]};
}
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function submit(urls,fetcher=fetch,sleep=pause){
 const body=JSON.stringify(payload(urls));
 for(let attempt=0;attempt<4;attempt++){
  let response;
  try{response=await fetcher(endpoint,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json; charset=utf-8'},body,signal:AbortSignal.timeout(15000)});}
  catch(error){if(attempt===3)throw Error('IndexNow network failure after retries');await sleep(1000*2**attempt);continue;}
  const status=response.status,retryAfter=response.headers.get('Retry-After');await response.body?.cancel();
  if(status===200||status===202){console.log(`IndexNow ${status}: received ${urls.length} URL(s)${status===202?' (key validation pending)':''}. This does not confirm indexing.`);return status;}
  if([400,403,422].includes(status))throw Error(`IndexNow ${status}: ${ {400:'invalid request',403:'key verification failed',422:'URL/key mismatch'}[status] }`);
  if(status!==429&&status<500)throw Error(`Unexpected IndexNow status ${status}`);
  if(attempt===3)throw Error(`IndexNow ${status}: retry limit reached`);
  const delay=retryAfter?(Number.isFinite(Number(retryAfter))?Number(retryAfter)*1000:Date.parse(retryAfter)-Date.now()):1000*2**attempt;
  // Respect long rate limits by failing visibly; a later manual retry is safer.
  if(delay>60000)throw Error('IndexNow requested a retry later than this run permits');
  await sleep(Math.max(1000,Number.isFinite(delay)?delay:1000*2**attempt));
 }
}
async function get(url,fetcher=fetch){
 const response=await fetcher(url,{redirect:'manual',cache:'no-store',headers:{'Cache-Control':'no-cache'},signal:AbortSignal.timeout(15000)});
 return {status:response.status,headers:response.headers,text:await response.text()};
}
async function verifyLive(urls,deleted,sha,fetcher=fetch){
 if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('A trusted deployment commit is required');
 const marker=await get(`${origin}/deployment-version.txt`,fetcher);
 if(marker.status!==200||marker.text.trim()!==sha)throw Error('Production commit is not live; no submission made');
 const key=await get(`${origin}/${config.key}.txt`,fetcher);
 if(key.status!==200||key.text!==config.key||!key.headers.get('Content-Type')?.startsWith('text/plain'))throw Error('Production key file is not directly available as exact plain text');
 for(const url of urls){
  safeURL(url);const response=await get(url,fetcher);
  if(deleted.includes(url)){
   if(![404,410,301,308].includes(response.status))throw Error(`Removed URL is not removed live: ${url}`);
  }else if(response.status!==200||/\b(noindex|none)\b/i.test(response.headers.get('X-Robots-Tag')||'')||!indexable(response.text,url))throw Error(`Not indexable live: ${url}`);
 }
}
function gitRead(ref,file){if(!/^[a-f0-9]{40}$/.test(ref))throw Error('Invalid baseline commit');return execFileSync('git',['show',`${ref}:${file}`],{encoding:'utf8',stdio:['ignore','pipe','pipe']});}
async function main(){
 const read=file=>fs.readFileSync(path.resolve(file),'utf8');
 const current=canonicalPages(read('sitemap.xml'),read);
 let selected={urls:current,deleted:[]};
 const mode=process.env.INDEXNOW_MODE||'changed',sha=process.env.INDEXNOW_DEPLOY_SHA;
 if(mode==='specific'){
  const url=process.env.INDEXNOW_URL;safeURL(url);if(!current.includes(url))throw Error('URL is not a current indexable canonical page');selected.urls=[url];
 }else if(mode==='changed'&&process.env.INDEXNOW_BASE_SHA){
  const base=process.env.INDEXNOW_BASE_SHA;
  // Fail rather than silently accept an invalid/incomplete provided baseline.
  const previous=canonicalPages(gitRead(base,'sitemap.xml'),file=>gitRead(base,file));
  const changes=execFileSync('git',['diff','--name-only',base,sha,'--'],{encoding:'utf8'}).trim().split('\n');
  selected=selectChanges(current,previous,read,file=>gitRead(base,file),changes);
 }else if(mode==='changed')console.log('No successful deployment baseline: submitting all current canonicals once. Historical deletions require a known baseline.');
 else if(mode!=='all')throw Error('Invalid submission mode');
 if(!selected.urls.length){console.log('No indexable pages changed; skipped.');return;}
 await verifyLive(selected.urls,selected.deleted,sha);
 await submit(selected.urls);
}
module.exports={safeURL,indexable,canonicalPages,selectChanges,payload,submit,verifyLive};
if(require.main===module)main().catch(error=>{console.error(`::error::${error.message}`);process.exitCode=1;});
