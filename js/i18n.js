/* Locale comes from a generated, explicit URL. Conversation content stays separate. */
(() => {
 'use strict';
 const language = document.documentElement.lang === 'sr-Latn' ? 'sr' : 'en';
 let messages = {};
 try { messages = JSON.parse(document.getElementById('locale-messages')?.textContent || '{}'); } catch { /* English fallback. */ }
 const t = value => {
  if (typeof value !== 'string') return value;
  const key = value.replace(/\s+/g, ' ').trim();
  return messages[key] ? value.replace(/\S[\s\S]*\S|\S/, () => messages[key]) : value;
 };
 const localPath = (value, locale = language) => {
  const url = new URL(value, location.href);
  if (url.origin !== location.origin || !(/^\/(?:en|sr)(?:\/|$)/.test(url.pathname) || /^(?:\/?|\/case-studies\/[^/]+\/?|\/services\/[^/]+\/?)$/.test(url.pathname))) return value;
  const suffix = url.pathname.replace(/^\/(en|sr)(?=\/|$)/, '').replace(/\/index\.html$/, '/') || '/';
  return '/' + locale + suffix + url.search + url.hash;
 };
 Object.defineProperty(window, 'PortfolioLocale', {value:Object.freeze({language,t,localPath}), writable:false});
 document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-language]').forEach(link => {
   const update = () => { link.href = localPath(location.href, link.dataset.language); };
   update(); window.addEventListener('hashchange', update);
   link.addEventListener('click', () => {
    const selected=link.dataset.language;
    if(!['en','sr'].includes(selected))return;
    try { localStorage.setItem('portfolioLanguage', selected); } catch { /* Optional storage. */ }
    document.cookie=`portfolioLanguage=${selected}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
   });
  });
 });
})();
