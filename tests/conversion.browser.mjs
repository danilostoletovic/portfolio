import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PATH || 'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error') errors.push(m.text());});
 await page.goto('http://localhost:8000');
 for (const width of [320,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Overflow at ${width}`);
  for (const summary of await page.locator('#offers summary').all()) {
   await summary.focus();
   if (!(await summary.locator('..').getAttribute('open')!==null)) await summary.press('Enter');
   assert.equal(await summary.locator('..').evaluate(e=>e.open),true);
   assert.ok(await summary.locator('..').getByRole('link').isVisible());
  }
 }
 const trigger=page.locator('[data-secretary]');
 await trigger.focus(); await trigger.press('Enter');
 await page.getByLabel('Your question').waitFor();
 await page.keyboard.press('Escape');
 assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);

 await page.screenshot({path:'secretary-upgrade-desktop.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'secretary-upgrade-mobile.png',fullPage:true});
 await page.getByLabel('Toggle light or dark theme').check();
 await page.screenshot({path:'secretary-upgrade-dark.png',fullPage:true});
 const noJS=await browser.newPage({javaScriptEnabled:false,viewport:{width:320,height:800}});
 await noJS.goto('http://localhost:8000');
 await noJS.locator('#offer-website summary').focus();
 assert.equal(await noJS.getByRole('link',{name:'Build my site'}).isVisible(),true);
 await noJS.locator('[data-secretary]').focus(); await noJS.keyboard.press('Enter');
 assert.match(noJS.url(),/#contact$/);
 assert.deepEqual(errors,[]);
 console.log('PASS: four widths, keyboard offers, contextual dialog focus restoration, no-JS offer/contact fallback, no console errors.');
} finally {await browser.close();}

