/* Static localization: shared HTML sources, no client rendering dependency. */
const fs=require('node:fs'),path=require('node:path');
const {root,routes,normalize,escape,transform,sourceFile}=require('./localization.cjs');
const en=require('../data/locales/en.json'),sr=require('../data/locales/sr.json'),runtime=require('../data/locales/runtime.json');
const origin='https://danilostoletovic.com';
const missing=new Set();
const translate=(value,language)=>{
 if(!value)return value;
 const key=normalize(value);
 if(language==='en')return en[key]??value;
 if(!Object.hasOwn(sr,key))missing.add(key);
 return sr[key]??value;
};
function localeURL(value,language) {
 if(!value.startsWith('/')&&!value.startsWith(origin))return value;
 const absolute=value.startsWith(origin),url=new URL(value,origin);
 if(url.origin!==origin)return value;
 const route=url.pathname.replace(/^\/(en|sr)(?=\/|$)/,'')||'/';
 if(!routes.includes(route))return value;
 url.pathname='/'+language+(route==='/'?'/':route);
 return absolute?url.href:url.pathname+url.search+url.hash;
}
function alternates(route){return ['en','sr-Latn','x-default'].map(l=>`<link rel="alternate" hreflang="${l}" href="${l==='x-default'&&route==='/'?origin+'/':origin+'/'+(l==='sr-Latn'?'sr':'en')+route}">`).join('\n');}
function switcher(route,language){return `<div class="language-switcher" role="group" aria-label="${language==='sr'?'Jezik':'Language'}">${['en','sr'].map(l=>`<a href="/${l}${route}" data-language="${l}" lang="${l==='sr'?'sr-Latn':'en'}" hreflang="${l==='sr'?'sr-Latn':'en'}" aria-label="${l==='en'?'English':'Srpski, latinica'}"${l===language?' aria-current="true"':''}>${l.toUpperCase()}</a>`).join('')}</div>`;}
for(const route of routes){
 let source=fs.readFileSync(sourceFile(route),'utf8').replace(/<script[^>]*src="\/js\/language-entry\.js[^>]*><\/script>\s*/g,'').replace(/<noscript id="language-entry-choices">[^]*?<\/noscript>\s*/g,'').replace(/<link[^>]*hreflang="[^"]*"[^>]*>\s*/g,'');
 for(const language of ['en','sr']){
  let html=transform(source,v=>translate(v,language));
  html=html.replace(/<br([^>]*)>(?=\S)/g,'<br$1> ');
  const url=origin+'/'+language+route,lang=language==='sr'?'sr-Latn':'en';
  html=html.replace(/<html lang="[^"]*"/,'<html lang="'+lang+'"').replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`);
  if(!html.includes('rel="canonical"'))html=html.replace('</head>',`<link rel="canonical" href="${url}"></head>`);
  if(route==='/404.html')html=html.replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="noindex, follow">');
  if(route==='/')html=html.replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">');
  html=html.replace(/\b(href|src)="([^"#]*)"/g,(match,attr,value)=>{
   // Root-relative assets remain shared; only actual public HTML routes localize.
   if(attr==='src'&&!/^(?:https?:|\/|data:)/.test(value))return `src="/${value}"`;
   if(attr==='href'&&!/^(?:https?:|\/|#|mailto:|tel:|data:)/.test(value))return `href="/${value}"`;
   return `${attr}="${attr==='href'?localeURL(value,language):value}"`;
  });
  html=html.replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`).replace(/<meta property="og:locale(?:[:]alternate)?"[^>]*>/g,'');
  html=html.replace(/<meta name="twitter:url" content="[^"]*">/,`<meta name="twitter:url" content="${url}">`);
  if(route!=='/404.html'){
   if(!html.includes('name="twitter:url"'))html=html.replace('</head>',`<meta name="twitter:url" content="${url}"></head>`);
   if(!html.includes('name="twitter:card"'))html=html.replace('</head>','<meta name="twitter:card" content="summary_large_image"></head>');
   const image=html.match(/<meta property="og:image" content="([^"]*)"/)?.[1];
   if(image&&!html.includes('name="twitter:image"'))html=html.replace('</head>',`<meta name="twitter:image" content="${image}"></head>`);
  }
  html=html.replace(/<script type="application\/ld\+json">([^]*?)<\/script>/g,(_,json)=>{
   function localize(value,key=''){
    if(Array.isArray(value))return value.map(v=>localize(v,key));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,localize(v,k)]));
    if(typeof value!=='string')return value;
    if(key==='inLanguage')return lang;
    if(value.startsWith(origin))return localeURL(value,language);
    if(['description','headline','jobTitle','serviceType','name'].includes(key)&&Object.hasOwn(sr,normalize(value)))return translate(value,language);
    return value;
   }
   return '<script type="application/ld+json">'+JSON.stringify(localize(JSON.parse(json))).replace(/</g,'\\u003c')+'</script>';
  });
  const title=html.match(/<title>([^]*?)<\/title>/)?.[1]||'',description=html.match(/<meta name="description" content="([^"]*)"/)?.[1]||'';
  html=html.replace(/<meta name="twitter:(?:title|description)"[^>]*>/g,'').replace(/<meta name="title"[^>]*>/g,'');
  html=html.replace('</head>',`${alternates(route)}\n<meta property="og:locale" content="${language==='sr'?'sr_RS':'en_US'}"><meta property="og:locale:alternate" content="${language==='sr'?'en_US':'sr_RS'}">\n<meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}">\n<link rel="stylesheet" href="/css/localization.css?v=1">\n<script id="locale-messages" type="application/json">${JSON.stringify(language==='sr'?runtime:{}).replace(/</g,'\\u003c')}</script><script src="/js/i18n.js?v=1"></script>\n</head>`);
  html=html.replace(/<\/nav>(\s*<label class="theme-control")/,`${switcher(route,language)}</nav>$1`);
  // The old 404 header uses different markup; it still gets the same accessible links.
  if(!html.includes('data-language='))html=html.replace('</header>',switcher(route,language)+'</header>');
  html=html.replace(/\/js\/(secretary|workshop)\.js\?v=\d+/g,'/js/$1.js?v=bilingual-1');
  const filename=path.join(root,language,route.endsWith('/')?route+'index.html':route);
  fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,html);
 }
}
if(missing.size)throw new Error('Missing Serbian translations:\n'+[...missing].join('\n'));
// The root remains the English authoring template and Markdown negotiation surface.
let entry=fs.readFileSync(path.join(root,'index.html'),'utf8');
// Production root routing is HTTP-level. Static previews retain a readable
// English page and explicit language choices without requiring JavaScript.
entry=entry.replace(/<script[^>]*src="\/js\/language-entry\.js[^>]*><\/script>\s*/g,'');
entry=entry.replace(/<meta name="robots" content="[^"]*">/,'<meta name="robots" content="noindex, follow">').replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${origin}/en/">`);
entry=entry.replace(/<link[^>]*hreflang="[^"]*"[^>]*>\s*/g,'').replace('</head>',alternates('/')+'\n</head>');
entry=entry.replace(/<noscript id="language-entry-choices">[^]*?<\/noscript>\s*/g,'');
entry=entry.replace(/(<body[^>]*>)/,'$1\n<noscript id="language-entry-choices"><p>Choose your language / Izaberi jezik: <a href="/en/" lang="en">English</a> · <a href="/sr/" lang="sr-Latn">Srpski</a></p></noscript>');
fs.writeFileSync(path.join(root,'index.html'),entry);
const publicRoutes=routes.filter(r=>r!=='/404.html');
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${publicRoutes.flatMap(route=>['en','sr'].map(language=>`<url><loc>${origin}/${language}${route}</loc>${['en','sr-Latn','x-default'].map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${l==='x-default'&&route==='/'?origin+'/':origin+'/'+(l==='sr-Latn'?'sr':'en')+route}"/>`).join('')}</url>`)).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(root,'_redirects'),publicRoutes.filter(r=>r!=='/').map(r=>`${r} /en${r} 301\n${r.slice(0,-1)} /en${r} 301`).join('\n')+'\n');
console.log(`Built ${publicRoutes.length*2} crawlable localized pages, two localized error pages, reciprocal SEO and legacy redirects.`);
