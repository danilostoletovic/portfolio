/* One static popup shared by the existing pages and localization build. */
const fs=require('node:fs');
const {routes,sourceFile}=require('./localization.cjs');
const copy={
 "A few details help me understand the scope. Everything is editable.":"Par detalja mi pomaže da razumem šta ti treba. Sve možeš da izmeniš.",
 "Budget (optional)":"Budžet (nije obavezno)", "Not sure yet":"Još nisam siguran", "Under €200":"Manje od 200 €", "€200–500":"200–500 €", "€500–1,000":"500–1.000 €", "€1,000+":"Više od 1.000 €",
 "When do you need it? (optional)":"Kada ti treba? (nije obavezno)", "Flexible / let's discuss":"Dogovorićemo se", "As soon as possible":"Što pre", "Within a month":"U narednih mesec dana", "Within 1–3 months":"Za 1–3 meseca",
 "These are your preferences, not a quote or a delivery promise.":"Ovo su tvoje želje, ne ponuda cene ili obećanje roka.",
 "I need a website for:":"Treba mi sajt za:", "New website or redesign:":"Novi sajt ili redizajn:", "Pages and features I have in mind:":"Stranice i funkcije koje imam na umu:", "Sites I like (optional):":"Sajtovi koji mi se sviđaju (nije obavezno):",
 "My app idea:":"Moja ideja za aplikaciju:", "Who will use it:":"Ko će je koristiti:", "Platforms (Android, web, desktop, etc.):":"Platforme (Android, web, desktop itd.):", "The most important features:":"Najvažnije funkcije:",
 "I'd like AI to help with:":"Želim da mi AI pomogne oko:", "The current workflow:":"Kako sada radimo:", "Information or systems it should work with:":"Informacije ili sistemi sa kojima treba da radi:",
 "The infrastructure problem:":"Problem sa infrastrukturom:", "Current hosting and stack:":"Trenutni hosting i tehnologije:", "What is failing, and when it started:":"Šta ne radi i od kada:", "What I'd like to improve:":"Šta želim da poboljšam:",
 "×":"×", "CONTACT":"KONTAKT",
 "Let's talk about your project.":"Hajde da pričamo o tvom projektu.",
 "Tell me what you need. No complicated forms.":"Reci mi šta ti treba. Bez komplikovanih formulara.",
 "Your email":"Tvoj email", "Name (optional)":"Ime (nije obavezno)",
 "Your message":"Tvoja poruka", "Open email draft":"Otvori email poruku",
 "This opens your email app with a draft. Nothing is sent automatically.":"Otvoriće se tvoja email aplikacija sa pripremljenom porukom. Ništa se ne šalje automatski.",
 "Close contact form":"Zatvori formular", "Prefer email? Write directly.":"Radije bi email? Piši mi direktno."
};
for(const locale of ['en','sr']){
 const file=`data/locales/${locale}.json`,dict=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const [en,sr] of Object.entries(copy))dict[en]=locale==='en'?en:sr;
 fs.writeFileSync(file,JSON.stringify(dict,null,2)+'\n');
}
const popup=`<dialog id="contact-popup" aria-labelledby="contact-popup-title"><button type="button" class="contact-close" aria-label="Close contact form">×</button><p class="eyebrow">CONTACT</p><h2 id="contact-popup-title">Let's talk about your project.</h2><p>Tell me what you need. No complicated forms.</p><form id="quick-contact"><label for="contact-email">Your email</label><input id="contact-email" type="email" autocomplete="email" required maxlength="254"><label for="contact-name">Name (optional)</label><input id="contact-name" autocomplete="name" maxlength="80"><label for="contact-message">Your message</label><textarea id="contact-message" required maxlength="3000" rows="5"></textarea><button class="button" type="submit">Open email draft</button><p class="contact-disclosure">This opens your email app with a draft. Nothing is sent automatically.</p></form><a href="mailto:contact@danilostoletovic.com">Prefer email? Write directly.</a></dialog>`;
for(const route of routes){
 const file=sourceFile(route);let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<dialog id="contact-popup"[^]*?<\/dialog>/g,'');
 html=html.replace(/<a\b([^>]*href="mailto:contact@danilostoletovic\.com[^"]*"[^>]*)>([^]*?)<\/a>/g,(all,attrs,body)=>{
  if(attrs.includes('data-secretary')||body.includes('contact@danilostoletovic.com')||attrs.includes('data-contact'))return all;
  return `<a data-contact${attrs}>${body}</a>`;
 });
 if(!html.includes('/css/contact.css'))html=html.replace('</head>','<link rel="stylesheet" href="/css/contact.css">\n</head>');
 if(!html.includes('/js/contact.js'))html=html.replace('</body>','<script src="/js/contact.js" defer></script>\n</body>');
 const templates={website:['I need a website for:','New website or redesign:','Pages and features I have in mind:','Sites I like (optional):'],idea:['My app idea:','Who will use it:','Platforms (Android, web, desktop, etc.):','The most important features:'],ai:["I'd like AI to help with:",'The current workflow:','Information or systems it should work with:'],server:['The infrastructure problem:','Current hosting and stack:','What is failing, and when it started:',"What I'd like to improve:"]};
 const extras=`<div class="contact-options"><div><label for="contact-budget">Budget (optional)</label><select id="contact-budget"><option value="">Not sure yet</option><option value="under-200">Under €200</option><option value="200-500">€200–500</option><option value="500-1000">€500–1,000</option><option value="1000-plus">€1,000+</option></select></div><div><label for="contact-urgency">When do you need it? (optional)</label><select id="contact-urgency"><option value="">Flexible / let's discuss</option><option value="asap">As soon as possible</option><option value="month">Within a month</option><option value="quarter">Within 1–3 months</option></select></div></div><p class="contact-preferences">These are your preferences, not a quote or a delivery promise.</p>`;
 let enhanced=popup.replace('Tell me what you need. No complicated forms.','A few details help me understand the scope. Everything is editable.').replace('<button class="button" type="submit">',extras+'<button class="button" type="submit">');
 enhanced=enhanced.replace('</dialog>',Object.entries(templates).map(([id,lines])=>`<template data-contact-template="${id}">${lines.map(line=>`<span>${line}</span>`).join('')}</template>`).join('')+'</dialog>');
 html=html.replace('</body>',enhanced+'\n</body>');fs.writeFileSync(file,html);
}
