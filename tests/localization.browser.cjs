// Optional isolated browser QA; no production dependency or live Ana request.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),{routes}=require('../scripts/localization.cjs');
const redirects=fs.readFileSync(path.join(root,'_redirects'),'utf8').trim().split(/\r?\n/).map(line=>line.split(' '));
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/^  Content-Security-Policy: (.+)$/m)[1].trim();
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost'),redirect=req.headers['x-test-pages-routing']==='true' && redirects.find(r=>r[0]===url.pathname);
 if(redirect){res.writeHead(301,{Location:redirect[1]+url.search}).end();return;}
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname)),status=200;
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){status=404;file=path.join(root,/^\/sr\//.test(url.pathname)?'sr/404.html':/^\/en\//.test(url.pathname)?'en/404.html':'404.html');}
 res.writeHead(status,{'Content-Security-Policy':csp,'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.avif':'image/avif','.ico':'image/x-icon'}[path.extname(file)]||'text/plain'});res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const mock=async page=>page.route('https://**/*',route=>route.abort());
 try{
  for(const [locale,expected]of [['sr-RS','sr'],['en-US','en'],['de-DE','en']]){
   const context=await browser.newContext({locale}),page=await context.newPage();await mock(page);
   await page.goto(origin+'/?ref=qa#about');await page.waitForURL(`**/${expected}/?ref=qa#about`);assert.equal(await page.evaluate(()=>localStorage.getItem('portfolioLanguage')),null);await context.close();
  }
  console.log('PASS Serbian, English and German first visits; replace navigation; query and anchor retention');
  for(const [start,next]of [['sr','en'],['en','sr']]){
   const context=await browser.newContext({locale:start==='sr'?'sr-RS':'en-US'}),page=await context.newPage();await mock(page);
   await page.goto(origin+`/${start}/case-studies/secretary/#boundaries`);
   await page.locator(`[data-language="${next}"]`).click();await page.waitForURL(`**/${next}/case-studies/secretary/#boundaries`);
   assert.equal(await page.evaluate(()=>localStorage.getItem('portfolioLanguage')),next);
   await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),next==='sr'?'sr-Latn':'en');
   await page.goBack();await page.waitForURL(`**/${start}/case-studies/secretary/#boundaries`);await page.goForward();await page.waitForURL(`**/${next}/case-studies/secretary/#boundaries`);
   await page.goto(origin);await page.waitForURL(`**/${next}/`);
   await page.goto(origin+`/${start}/`);assert.equal(new URL(page.url()).pathname,'/'+start+'/');assert.equal(await page.evaluate(()=>localStorage.getItem('portfolioLanguage')),next);await context.close();
  }
  console.log('PASS both manual preferences, same page and anchor, refresh, back/forward, root persistence, explicit URL authority');
  const blocked=await browser.newContext({locale:'sr-RS'});await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw Error('Blocked')}})});const blockedPage=await blocked.newPage();await mock(blockedPage);await blockedPage.goto(origin);await blockedPage.waitForURL('**/sr/');await blockedPage.locator('[data-language="en"]').click();await blockedPage.waitForURL('**/en/');await blocked.close();
  for(const width of [1440,768,390,320]){
   const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   let request;await page.route('https://**/*',route=>{
    if(route.request().url().includes('secretary.danilostoletovic.com/chat')){request=route.request();return route.fulfill({status:429,contentType:'application/json',body:'{}'});}return route.abort();
   });
   for(const language of ['en','sr']){
    await page.goto(origin+'/'+language+'/');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${language} ${width} overflow`);
    assert(await page.locator(`[data-language="${language}"][aria-current="true"]`).isVisible());
    await page.screenshot({path:path.join(root,`.local-review/${language}-hero-${width}.png`)});
    assert.equal(await page.locator('script[data-website-id]').count(),1,'Analytics stays present');
    await page.locator('.project-archive>summary').click();for(const filter of ['hardware','ai','mobile','web','experiments','all'])await page.locator(`[data-work-filter="${filter}"]`).click();
    await page.locator('#ana-project .inspect-link').click();assert(await page.locator('#case-secretary').isVisible());
    await page.locator('[data-ana-prompt]').first().click();assert.equal(await page.locator('.secretary-input').count(),0);await page.locator('#secretary-input').fill('Please answer in French.');
    await page.locator('.secretary-form').evaluate(form=>form.requestSubmit());await page.locator('.secretary-status').filter({hasText:language==='sr'?'Trenutno je gužva':'front desk'}).waitFor();
    assert.deepEqual(Object.keys(request.postDataJSON()).sort(),['history','message']);assert.equal(request.headers()['accept-language'],language==='sr'?'sr-Latn':'en');assert.equal(request.postDataJSON().message,'Please answer in French.');
    await page.screenshot({path:path.join(root,`.local-review/${language}-ana-${width}.png`)});await page.keyboard.press('Escape');
    await page.locator('#service-server').click();assert(await page.locator('#offer-server').isVisible());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(root,`.local-review/${language}-home-${width}.png`)});
   }
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px bilingual navigation, project/service controls, Ana labels/errors, bounded chat contract and language header`);
  }
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await mock(nojs);
  for(const language of ['en','sr'])for(const route of routes.filter(r=>r!=='/404.html')){
   const response=await nojs.goto(origin+'/'+language+route);assert.equal(response.status(),200);assert(await nojs.locator('h1').isVisible());assert(await nojs.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${language}${route} no-JS overflow`);
  }
  await nojs.goto(origin);assert(await nojs.locator('#language-entry-choices').isVisible());await nojs.locator('#language-entry-choices a[href="/sr/"]').click();assert.equal(new URL(nojs.url()).pathname,'/sr/');await nojs.close();
  const page=await browser.newPage();await mock(page);for(const language of ['en','sr']){const response=await page.goto(origin+'/'+language+'/missing-page');assert.equal(response.status(),404);assert.equal(await page.locator('html').getAttribute('lang'),language==='sr'?'sr-Latn':'en');}
  await page.setExtraHTTPHeaders({'x-test-pages-routing':'true'});await page.goto(origin+'/case-studies/secretary/#boundaries');assert.equal(new URL(page.url()).pathname,'/en/case-studies/secretary/');assert.equal(new URL(page.url()).hash,'#boundaries');await page.close();
  console.log('PASS all 16 independently crawlable no-JS pages, no-JS language choice, legacy redirects, localized 404 status');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
