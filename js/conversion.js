/* Existing Umami only. Fixed event names; never send URLs, contact details or chat. */
(() => {
 'use strict';
 const report = name => {
  try {
   if (typeof window.umami?.track === 'function') {
    const pending = window.umami.track(name);
    pending?.catch?.(() => {});
   }
  } catch { /* Analytics must never block navigation or the assistant. */ }
 };
 document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href]');
  if (!link) return;
  // Language controls have their own category, even when their href changes.
  if (link.matches('[data-language]')) { report('language_switch'); return; }
  if (link.matches('[data-secretary]')) return; // Report actual dialog opening instead.
  const href = link.getAttribute('href');
  if (/^mailto:/i.test(href)) report('contact_email');
  else if (/^tel:/i.test(href)) report('contact_phone');
  else {
   let url; try { url = new URL(href, location.href); } catch { return; }
   if (['www.upwork.com','pro.fiverr.com'].includes(url.hostname)) report('freelance_profile');
   else if (url.origin !== location.origin && link.closest('.case-page, .page-body, .source-specimen') &&
    ['github.com','smartvehicle.dev','play.google.com','apps.microsoft.com'].includes(url.hostname)) report('project_reference');
  }
 });
 window.addEventListener('portfolio:ana-opened', () => report('ana_open'));
})();
