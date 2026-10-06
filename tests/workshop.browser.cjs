// Isolated QA. Point PLAYWRIGHT_PATH at a separate Playwright install; no production dependency.
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/^  Content-Security-Policy: (.+)$/m)[1].trim();
const server=http.createServer((req,res)=>{
 let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404).end();return;}
 res.setHeader('Content-Security-Policy',csp);
 res.setHeader('Content-Type',{'.html':'text/html','.css':'text/css','.js':'text/javascript','.avif':'image/avif','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon'}[path.extname(file)]||'text/plain');
 res.end(fs.readFileSync(file));
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  for(const width of [1440,1200,768,390,320]){
   const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   let chatRequests=0;
   await page.route('https://**/*',route=>{if(route.request().url().includes('secretary.danilostoletovic.com/chat')){chatRequests++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({reply:'Browser QA reply.'})});}return route.abort();});
   await page.goto(origin);
   assert(await page.locator('.brand-lockup img').evaluate(img=>img.complete&&img.naturalWidth>0),'Workshop logo must load');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Overflow ${width}`);
   assert.equal(await page.locator('.case-page:visible').count(),0,'No expanded case studies on arrival');
   assert.equal(await page.locator('.service-panel:visible').count(),1);
   assert.equal(await page.locator('.testimonial:visible').count(),1);
   assert.equal(await page.locator('.case-chapter:visible').count(),0);
   assert.equal(await page.locator('#project-inspector').isVisible(),false);
   assert.equal(await page.locator('.work-card:visible').count(),0,'The project archive starts collapsed');
   assert.equal(await page.locator('.hero figure').count(),0,'No vehicle figure in the hero');
   const words=await page.locator('body').innerText();assert(words.split(/\s+/).length<850,`Initial density ${words.split(/\s+/).length}`);
   await page.locator('main img').evaluateAll(async images=>{await Promise.all(images.map(img=>{img.loading='eager';return img.decode().catch(()=>{});}));});
   await page.screenshot({path:path.join(root,`.local-review/product-${width}.png`),fullPage:true});
   await page.screenshot({path:path.join(root,`.local-review/product-hero-${width}.png`)});
   await page.locator('.project-archive>summary').click();assert.equal(await page.locator('.work-card:visible').count(),5);
   // Ana is directly accessible without opening or consuming SmartVehicle.
   await page.locator('#ana-project .inspect-link').click();
   assert(await page.locator('#case-secretary').isVisible());assert(!(await page.locator('#case-smart-vehicle').isVisible()));
   assert.equal(await page.locator('.case-page:visible').count(),1);assert.equal(await page.locator('.case-chapter:visible').count(),1);
   await page.screenshot({path:path.join(root,`.local-review/product-ana-${width}.png`)});
   await page.locator('#select-secretary').focus();await page.keyboard.press('Home');assert(await page.locator('#case-smart-vehicle').isVisible());
   for(const id of ['smart-vehicle','secretary','class-timetable','promptui','portfolio']){
    await page.locator(`#select-${id}`).click();
    assert(await page.locator(`#case-${id}`).isVisible());assert.equal(await page.locator('.case-page:visible').count(),1);
    await page.locator(`#case-${id} [data-chapter="1"]`).click();
    await page.locator(`#case-${id} details summary`).filter({hasText:'engineering decision'}).click();
    await page.locator(`#case-${id} [data-chapter="2"]`).click();
    assert.equal(await page.locator('.case-chapter:visible').count(),1);
   }
   await page.locator('#select-smart-vehicle').click();await page.locator('#case-smart-vehicle [data-chapter="2"]').click();
   await page.locator('#case-smart-vehicle .evidence-grid .evidence-link').first().click();
   assert(await page.locator('.evidence-dialog').isVisible());await page.keyboard.press('ArrowRight');assert((await page.locator('.evidence-dialog p').textContent()).startsWith('2 / 4'));
   await page.keyboard.press('Escape');assert(await page.locator('#project-inspector').isVisible());
   await page.locator('[data-close-inspector]').click();assert(!(await page.locator('#project-inspector').isVisible()));
   await page.locator('#service-ai').click();assert(await page.locator('#offer-ai').isVisible());assert.equal(await page.locator('.service-panel:visible').count(),1);
   await page.locator('#offer-ai [data-open-project]').click();assert(await page.locator('#case-secretary').isVisible());
   await page.locator('[data-ana-prompt]').first().click();await page.locator('.secretary-panel').waitFor();
   assert.equal(await page.locator('.secretary-form textarea').inputValue(),'What projects has Danilo built?');assert.equal(chatRequests,0,'Draft prompt must not send automatically');
   await page.locator('.secretary-form').evaluate(form=>form.requestSubmit());await page.getByText('Browser QA reply.',{exact:true}).waitFor();assert.equal(chatRequests,1);await page.keyboard.press('Escape');
   await page.locator('[data-feedback="2"]').click();assert(await page.locator('#client-feedback-2').isVisible());assert.equal(await page.locator('.testimonial:visible').count(),1);
   await page.locator('[data-press="recognition"]').click();assert.equal(await page.locator('.press-archive>li:visible').count(),2);
   await page.locator('[data-work-filter="hardware"]').click();assert.equal(await page.locator('.work-card:visible').count(),1);
   for(const [category,count] of [['ai',2],['mobile',1],['web',1],['experiments',1],['all',5]]){await page.locator(`[data-work-filter="${category}"]`).click();assert.equal(await page.locator('.work-card:visible').count(),count);}
   await page.locator('#theme-toggle-check').check();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(root,`.local-review/product-dark-${width}.png`),fullPage:true});
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: low-density arrival, independent cases, keyboard, gallery, services, feedback, press, drafted Ana chat, dark theme`);
  }
  const fallback=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});
  await fallback.goto(origin);assert.equal(await fallback.locator('.case-page:visible').count(),0);assert.equal(await fallback.locator('.inspect-link:visible').count(),0);
  await fallback.locator('.project-archive>summary').click();assert.equal(await fallback.locator('.project-grid .inspect-link:visible').count(),5);
  await fallback.locator('#service-ai').click();assert(await fallback.locator('#offer-ai').isVisible());assert(!(await fallback.locator('#offer-website').isVisible()));
  assert(await fallback.locator('a[href="mailto:contact@danilostoletovic.com"]').first().count());assert.equal(await fallback.locator('.press-archive>li:visible').count(),6);console.log('PASS no-JavaScript fallback: five full case-study links, public coverage, direct email');await fallback.close();
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:900}});await page.route('https://**/*',route=>route.abort());
   for(const slug of ['smart-vehicle','secretary','class-timetable','promptui','portfolio']){
    await page.goto(`${origin}/case-studies/${slug}/`);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${slug} overflow ${width}`);
    assert(await page.locator('.secretary-launcher').isVisible());
    if(await page.locator('.page-body .evidence-link').count()){await page.locator('.page-body .evidence-link').first().click();assert(await page.locator('.evidence-dialog').isVisible());await page.keyboard.press('Escape');}
    await page.locator('.project-menu summary').click();assert.equal(await page.locator('.project-menu a:visible').count(),5);await page.locator('.project-menu summary').click();
   }await page.close();console.log(`PASS ${width}px: all five full case studies, evidence dialogs, navigation, Ana launcher`);
  }
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
