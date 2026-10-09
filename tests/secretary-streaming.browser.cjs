// Deterministic transport test, not a provider latency benchmark.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/^  Content-Security-Policy: (.+)$/m)[1].trim();
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Security-Policy':csp,'Content-Type':{'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css'}[path.extname(file)]||'application/octet-stream'});res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const records=[];
 try{for(const language of ['en','sr'])for(const width of [390,1440])for(const mode of ['stream','json','failure']){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://**/*',r=>r.abort());
  await page.addInitScript(({mode})=>{
   localStorage.setItem('secretaryChallengeSeen','true');window.testMode=mode;window.testReplies=[];
   window.addEventListener('portfolio:ana-latency',e=>window.testReplies.push(e.detail));
   const original=window.fetch;window.fetch=async(url,options)=>{
    if(!String(url).includes('secretary.danilostoletovic.com/chat'))return original(url,options);
    window.sent=JSON.parse(options.body);window.submitted=performance.now();window.accept=options.headers.Accept;
    const text='Ćao **Ana**. [Project](/case-studies/secretary/)\n- Safe <img src=x onerror=alert(1)>\n- `code`';
    if(mode==='json'){await new Promise(r=>setTimeout(r,900));return Response.json({reply:text});}
    return new Response(new ReadableStream({start(c){const encode=new TextEncoder(),frame=x=>encode.encode('data: '+JSON.stringify(x)+'\n\n');
     setTimeout(()=>c.enqueue(frame({type:'delta',text:'Ćao **Ana**. '})),200);
     setTimeout(()=>{if(mode==='failure')c.enqueue(frame({error:{code:'upstream_error',message:'safe error'}}));else{c.enqueue(frame({type:'delta',text:text.slice('Ćao **Ana**. '.length)}));c.enqueue(frame({type:'done',reply:text}));}c.close();},900);
    }}),{headers:{'Content-Type':'text/event-stream'}});
   };
  },{mode});
  await page.goto(`http://127.0.0.1:${server.address().port}/${language}/`);await page.locator('.secretary-launcher').click();await page.locator('#secretary-input').fill('Hello');await page.locator('.secretary-form').evaluate(form=>form.requestSubmit());
  if(mode!=='json'){await page.waitForFunction(()=>document.querySelector('.secretary-reply[hidden]')===null&&[...document.querySelectorAll('.secretary-reply')].some(e=>e.textContent.includes('Ćao')));const first=await page.evaluate(()=>performance.now()-window.submitted);assert(first<800);records.push({language,width,mode,firstVisibleMs:first});}
  await page.waitForFunction(()=>!document.querySelector('.secretary-reset').disabled);
  assert.equal(await page.evaluate(()=>window.accept),'text/event-stream');
  if(mode==='failure'){assert.equal(await page.locator('.secretary-message--user').count(),0);assert.equal(await page.locator('#secretary-input').inputValue(),'Hello');assert.equal(await page.evaluate(()=>window.testReplies.length),0);}
  else{const reply=page.locator('.secretary-message--assistant').last();assert.equal(await reply.locator('strong').textContent(),'Ana');assert.equal(await reply.locator('li').count(),2);assert.equal(await reply.locator('img').count(),0);assert.equal(await reply.locator('a').getAttribute('href'),`/${language}/case-studies/secretary/`);assert.equal(await page.evaluate(()=>window.testReplies.length),1);records.push({language,width,mode,completed:await page.evaluate(()=>window.testReplies[0])});}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);await page.close();
 }console.log(JSON.stringify({synthetic:true,records},null,2));}finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
