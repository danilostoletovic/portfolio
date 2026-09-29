// Only explicitly approved entries may reach public HTML or Markdown.
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = value => { if (!value) return ''; const u = new URL(value); if (u.protocol !== 'https:') throw new Error('Testimonial URLs must use HTTPS'); return escape(u.href); };
export function renderTestimonials(entries) {
  if (!Array.isArray(entries)) throw new Error('Testimonials must be an array');
  const publicEntries = entries.filter(entry => entry.public === true);
  const html = publicEntries.map(entry => {
    for (const key of ['name','project','role','testimonial','service','date']) if (typeof entry[key] !== 'string' || !entry[key].trim()) throw new Error('Missing testimonial field: ' + key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(Date.parse(entry.date))) throw new Error('Invalid testimonial date');
    const projectURL = url(entry.projectURL), image = url(entry.image);
    return '<figure class="testimonial">' + (image ? '<img src="' + image + '" alt="" width="48" height="48" loading="lazy">' : '') + '<blockquote><p>' + escape(entry.testimonial) + '</p></blockquote><figcaption><strong>' + escape(entry.name) + '</strong> · ' + escape(entry.role) + ', ' + escape(entry.project) + '<br>' + escape(entry.service) + ' · <time datetime="' + escape(entry.date) + '">' + escape(entry.date) + '</time>' + (projectURL ? ' · <a href="' + projectURL + '" rel="noopener noreferrer">View project ↗</a>' : '') + '</figcaption></figure>';
  }).join('\n');
  // HTML is valid in Markdown and shares the same escaping and public-only filter.
  return html;
}
