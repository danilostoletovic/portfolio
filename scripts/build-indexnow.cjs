const fs=require('node:fs');
const {host,key}=require('../data/indexnow.json');
if(host!=='danilostoletovic.com'||!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid IndexNow configuration');
fs.writeFileSync(`${key}.txt`,key);
const marker=process.env.CF_PAGES_COMMIT_SHA||process.env.INDEXNOW_DEPLOY_SHA;
if(marker){
 if(!/^[a-f0-9]{40}$/.test(marker))throw Error('Invalid deployment commit');
 fs.writeFileSync('deployment-version.txt',marker);
}else if(fs.existsSync('deployment-version.txt'))fs.unlinkSync('deployment-version.txt');
const file='_headers';let headers=fs.readFileSync(file,'utf8').replace(/\n# IndexNow static verification[^]*$/,'');
headers+=`\n# IndexNow static verification\n/${key}.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: public, max-age=0, must-revalidate\n\n/deployment-version.txt\n  Content-Type: text/plain; charset=utf-8\n  Cache-Control: no-store\n  X-Robots-Tag: noindex\n`;
fs.writeFileSync(file,headers);
