const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const routes = ['/', '/case-studies/smart-vehicle/', '/case-studies/secretary/', '/case-studies/class-timetable/', '/case-studies/promptui/', '/case-studies/portfolio/', '/services/mobile-app-development/', '/services/business-websites/', '/404.html'];
const decode = s => s.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/g, x => ({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '})[x]);
const normalize = s => decode(s).replace(/\s+/g, ' ').trim();
const escape = s => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function transform(html, translate) {
 return html.replace(/<!--[^]*?-->|<(script|style)\b[^>]*>[^]*?<\/\1\s*>|<[^>]+>|[^<]+/gi, token => {
  if (/^<(?:script|style|!--)/i.test(token)) return token;
  if (token.startsWith('<')) {
   token = token.replace(/\b(alt|title|aria-label|placeholder|data-ana-prompt)="([^"]*)"/g, (_,attr,value) => `${attr}="${escape(translate(normalize(value)))}"`);
   if (/^<meta\b/i.test(token) && /(?:name="(?:description|keywords|twitter:title|twitter:description|twitter:image:alt)"|property="(?:og:title|og:description|og:image:alt)")/.test(token)) token = token.replace(/content="([^"]*)"/, (_,value) => `content="${escape(translate(normalize(value)))}"`);
   return token;
  }
  const key = normalize(token);
  return key ? token.replace(/\S[^]*\S|\S/, () => escape(translate(key))) : token;
 });
}
function sourceFile(route) { return path.join(root, route === '/' ? 'index.html' : route.endsWith('/') ? route+'index.html' : route); }
module.exports = {root,routes,normalize,escape,transform,sourceFile};
