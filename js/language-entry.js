/* Runs synchronously in the root head, before content can paint. */
(() => {
 'use strict';
 if (!['/', '/index.html'].includes(location.pathname)) return;
 let language;
 try { const saved = localStorage.getItem('portfolioLanguage'); if (saved === 'en' || saved === 'sr') language = saved; } catch { /* Storage is optional. */ }
 if (!language) {
  const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language]).find(value => typeof value === 'string' && value.trim());
  language = /^sr(?:-|$)/i.test(preferred || '') ? 'sr' : 'en';
 }
 location.replace('/' + language + '/' + location.search + location.hash);
})();
