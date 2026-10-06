// Optional authoring tool: render the source SVG into platform icons. No runtime dependency.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const svg=fs.readFileSync(path.join(root,'img/logo.svg'),'utf8');
  fs.writeFileSync(path.join(root,'img/favicon/favicon.svg'),svg);
  const sizes=[[512,'web-app-manifest-512x512.png'],[192,'web-app-manifest-192x192.png'],[180,'apple-touch-icon.png'],[96,'favicon-96x96.png'],[32,'favicon-32x32.png'],[16,'favicon-16x16.png']];
  const icoImages=[];
  for(const [size,name] of sizes){
   const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
   await page.setContent(`<html><style>html,body{margin:0;width:100%;height:100%;background:#f6f3e9}svg{display:block;width:100%;height:100%}</style>${svg}</html>`);
   const png=await page.screenshot({path:path.join(root,'img/favicon',name)});
   if(size===32||size===16)icoImages.push({size,png});await page.close();
  }
  const header=Buffer.alloc(6+16*icoImages.length);header.writeUInt16LE(1,2);header.writeUInt16LE(icoImages.length,4);
  let offset=header.length;
  icoImages.forEach(({size,png},i)=>{const entry=6+16*i;header[entry]=size;header[entry+1]=size;header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6);header.writeUInt32LE(png.length,entry+8);header.writeUInt32LE(offset,entry+12);offset+=png.length;});
  fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([header,...icoImages.map(item=>item.png)]));
  fs.copyFileSync(path.join(root,'favicon.ico'),path.join(root,'img/favicon/favicon.ico'));
  for(const file of ['site.webmanifest','img/favicon/site.webmanifest']){
   const manifest=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));manifest.background_color='#f6f3e9';manifest.theme_color='#bd431e';
   manifest.icons.forEach(icon=>icon.src=icon.src.replace(/\?.*$/,'')+'?v=workshop-2');
   fs.writeFileSync(path.join(root,file),JSON.stringify(manifest,null,2)+'\n');
  }
  const notFound=path.join(root,'404.html');
  fs.writeFileSync(notFound,fs.readFileSync(notFound,'utf8').replace(/(href="\/img\/favicon\/[^"?]+)(?:\?[^"\s]*)?"/g,'$1?v=workshop-2"'));
  console.log('Rendered workshop SVG, six platform PNGs and multi-resolution favicon.ico.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
