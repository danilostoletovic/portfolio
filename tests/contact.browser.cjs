const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html; charset=utf-8'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const lang of ['en','sr'])for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});await page.route('https://**/*',r=>r.abort());
   await page.goto(`http://127.0.0.1:${server.address().port}/${lang}/`);
   for(const service of ['website','idea','ai','server']){
    await page.locator(`#service-${service}`).click();await page.locator(`#offer-${service} [data-contact]`).click();
    const expected=await page.locator(`[data-contact-template="${service}"]`).evaluate(e=>e.content.querySelector('span').textContent);
    assert((await page.locator('#contact-message').inputValue()).startsWith(expected));
    await page.locator('#contact-budget').selectOption('200-500');await page.locator('#contact-urgency').selectOption('month');
    assert.equal(await page.locator('#contact-budget').inputValue(),'200-500');
    if(lang==='en'&&service==='website'&&[1440,390].includes(width))await page.screenshot({path:path.join(root,`.local-review/contact-${width}.png`)});
    await page.keyboard.press('Escape');
   }
   await page.locator('#service-website').click();
   const trigger=page.locator('[data-contact]').first();await trigger.click();
   assert(await page.locator('#contact-popup').evaluate(e=>e.open));assert.equal(await page.evaluate(()=>document.activeElement.id),'contact-email');
   await page.locator('#quick-contact button').click();assert.equal(await page.locator('#contact-email').evaluate(e=>e.validity.valueMissing),true);
   await page.locator('#contact-message').fill('A retained draft');await page.keyboard.press('Escape');
   assert(!(await page.locator('#contact-popup').evaluate(e=>e.open)));assert(await trigger.evaluate(e=>e===document.activeElement));
   await trigger.click();assert.equal(await page.locator('#contact-message').inputValue(),'A retained draft');
   for(let n=0;n<10;n++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.getElementById('contact-popup').contains(document.activeElement)));}
   assert(await page.locator('#contact-popup a[href^="mailto:"]').count());
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.contact-close').click();await page.close();
  }
  console.log('Contact: English/Serbian, desktop/mobile, validation, focus trap/restoration, Escape and retained drafts passed.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
