// Isolated Edge QA with existing Playwright harness; no live chat or analytics.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/^  Content-Security-Policy: (.+)$/m)[1].trim();
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.writeHead(200,{'Content-Security-Policy':csp,'Content-Type':{'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg'}[path.extname(file)]||'text/plain'});res.end(fs.readFileSync(file));
});
function contrast(a,b){const luminance=c=>{const rgb=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const language of ['en','sr'])for(const width of [1440,768,390,320]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'}),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)missing.push(r.url());});
   await page.route('https://**/*',r=>r.abort());await page.goto(`${origin}/${language}/`);
   assert.equal(await page.locator('.buyer-faq details').count(),6);assert.equal(await page.locator('.buyer-faq details[open]').count(),0);
   assert.equal(await page.locator('.hero-contact').count(),1);assert.equal(await page.locator('.work-card').count(),5);
   const summary=page.locator('.buyer-faq summary').first();await summary.focus();await page.keyboard.press('Enter');assert(await summary.locator('..').evaluate(e=>e.open));await page.keyboard.press('Space');assert(!(await summary.locator('..').evaluate(e=>e.open)));
   await page.locator('#service-website').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#service-idea').getAttribute('aria-selected'),'true');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'offer-idea');
   const targets=await page.locator('.project-menu>summary,.site-header nav>a,.language-switcher a,.feedback-select button,.press-filters button').evaluateAll(elements=>elements.filter(e=>e.getClientRects().length).map(e=>({label:e.textContent.trim(),height:e.getBoundingClientRect().height})));assert(targets.every(e=>e.height>=44),JSON.stringify(targets));
   await page.locator('.project-archive>summary').click();await page.locator('#ana-project .inspect-link').click();assert.equal(await page.locator('#case-secretary').evaluate(e=>e.tagName),'DIV');assert.equal(await page.locator('#case-secretary').getAttribute('tabindex'),'0');
   await page.locator('#case-secretary [data-inspector-exit]').click();assert.equal(await page.locator('#service-ai').getAttribute('aria-selected'),'true');assert(!(await page.locator('#project-inspector').evaluate(e=>e.open)));
   await page.locator('#buyer-questions').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`.local-review/faq-${language}-${width}.png`)});
   for(const dark of [false,true]){
    if(dark)await page.locator('#theme-toggle-check').check({force:true});
    const colors=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['--ink','--muted'].map(token=>{const el=document.createElement('span');el.style.color=s.getPropertyValue(token);el.style.backgroundColor=s.getPropertyValue('--paper');document.body.append(el);const c=getComputedStyle(el);const pair=[c.color,c.backgroundColor];el.remove();return pair;});});
    colors.forEach(pair=>assert(contrast(...pair)>=4.5,`${language} ${width} ${dark} contrast ${pair}`));
   }
   await page.locator('#theme-toggle-check').uncheck({force:true});
   // Text-only 200% stress: double computed sizes of text-bearing elements,
   // taking all measurements before mutation so inheritance isn't doubled twice.
   await page.evaluate(()=>{const items=[...document.querySelectorAll('body *')].filter(e=>!['SCRIPT','STYLE'].includes(e.tagName)&&[...e.childNodes].some(n=>n.nodeType===3&&/\S/.test(n.textContent))).map(e=>[e,parseFloat(getComputedStyle(e).fontSize)]);for(const [e,size]of items)e.style.fontSize=size*2+'px';});
   const overflow=await page.evaluate(()=>({width:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(e=>e.getClientRects().length&&(e.getBoundingClientRect().right>innerWidth+1||e.scrollWidth>e.clientWidth+1)).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,80),right:e.getBoundingClientRect().right,scroll:e.scrollWidth,client:e.clientWidth}))}));
   assert(overflow.width<=width,`${language} ${width}: 200% text overflow ${JSON.stringify(overflow)}`);
   await page.locator('.buyer-faq summary').first().click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(root,`.local-review/refined-${language}-${width}-200.png`)});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);await page.close();console.log(`PASS ${language} ${width}px: native FAQ, tab keyboard path, service handoff, 44px controls, light/dark contrast, 200% text`);
  }
  const page=await browser.newPage();await page.route('https://**/*',r=>r.abort());
  for(const language of ['en','sr']){await page.goto(`${origin}/${language}/#offer-ai`);assert(await page.locator('#offer-ai').isVisible());assert.equal(await page.locator('#service-ai').getAttribute('aria-selected'),'true');}
  await page.goto(origin+'/en/');
  await page.evaluate(()=>{window.recorded=[];window.umami={track:(...args)=>{recorded.push(args);return Promise.resolve();}};document.addEventListener('click',e=>{if(e.target.closest('a[href^="mailto:"],a[href^="tel:"],a[href^="https:"]'))e.preventDefault();});});
  await page.locator('.hero-actions [data-secretary]').click();await page.keyboard.press('Escape');
  await page.locator('.email-row>a').click();await page.locator('a[href^="tel:"]').first().click();
  await page.locator('a[href*="upwork.com"]').first().click();await page.locator('.project-archive>summary').click();await page.locator('#yolo-smart-vehicle .inspect-link').click();await page.locator('#case-smart-vehicle [data-chapter="3"]').click();await page.locator('#case-smart-vehicle a[href="https://smartvehicle.dev/"]').click();await page.keyboard.press('Escape');
  await page.locator('[data-language="sr"]').evaluate(e=>{e.addEventListener('click',event=>event.preventDefault());e.click();});
  assert.deepEqual(await page.evaluate(()=>recorded),[['ana_open'],['contact_email'],['contact_phone'],['freelance_profile'],['project_reference'],['language_switch']]);
  await page.evaluate(()=>{window.umami={track:()=>{throw Error('Analytics unavailable')}};document.querySelector('.email-row>a').click();});await page.close();
  const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.route('https://**/*',r=>r.abort());
  for(const language of ['en','sr']){await nojs.goto(`${origin}/${language}/`);await nojs.locator('.buyer-faq summary').first().click();assert(await nojs.locator('.buyer-faq details').first().evaluate(e=>e.open));await nojs.goto(`${origin}/${language}/#offer-ai`);assert(await nojs.locator('#offer-ai').isVisible());}
  await nojs.close();console.log('PASS no-JS FAQ; one bounded event per action; no private payloads; analytics failure isolation');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
