(() => {
  'use strict';
  const context = typeof document.modelContext?.registerTool === 'function'
    ? document.modelContext : navigator.modelContext;
  if (typeof context?.registerTool !== 'function') return;

  const sections = ['offers', 'work', 'how-i-work', 'testimonials', 'about', 'contact'];
  const inputSchema = {
    type: 'object',
    properties: { section: { type: 'string', enum: sections } },
    required: ['section'],
    additionalProperties: false
  };
  function getSection(args) {
    if (!args || !sections.includes(args.section)) throw new Error('Unknown portfolio section.');
    const section = document.getElementById(args.section);
    if (!section) throw new Error('Portfolio section is unavailable.');
    return section;
  }
  const tools = [
    {
      name: 'read_portfolio_section',
      description: 'Read public portfolio services, projects, process, testimonials, biography, or contact information and links.',
      inputSchema,
      annotations: { readOnlyHint: true },
      execute: async args => {
        const section = getSection(args);
        return {
          url: `https://danilostoletovic.com/#${section.id}`,
          text: section.innerText,
          links: Array.from(section.querySelectorAll('a[href]'), link => ({
            label: link.textContent.trim(), url: link.href
          }))
        };
      }
    },
    {
      name: 'navigate_portfolio',
      description: 'Bring a public portfolio section into view on this page.',
      inputSchema,
      execute: async args => {
        const section = getSection(args);
        section.scrollIntoView({ behavior: 'instant', block: 'start' });
        return { section: section.id, url: `https://danilostoletovic.com/#${section.id}` };
      }
    }
  ];

  let registration;
  function register() {
    if (registration) return;
    registration = new AbortController();
    const signal = registration.signal;
    for (const tool of tools) {
      // Handle both Promise-returning and older synchronous implementations.
      try {
        Promise.resolve(context.registerTool(tool, { signal })).catch(error => {
          if (!signal.aborted) console.warn(`WebMCP: ${tool.name} could not be registered.`, error);
        });
      } catch (error) {
        console.warn(`WebMCP: ${tool.name} could not be registered.`, error);
      }
    }
  }
  window.addEventListener('pagehide', () => {
    registration?.abort();
    registration = undefined;
  });
  window.addEventListener('pageshow', register);
  register();
})();
