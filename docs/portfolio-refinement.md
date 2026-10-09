# Portfolio refinement audit

This is a refinement of the established workshop, not a replacement design.
The main headline, five projects, approved testimonials and attribution, six press
and recognition sources, service categories, Ana persona, contact channels,
static hosting and language routes are preserved. No deployment or external
configuration changes were made. The supplied category scores are inputs, not
independently measured results; no new numerical design or conversion score is claimed.

## Research and reference lock

Research used the connected Refero MCP: three style searches, full style details
for five references, and an inspected FAQ screen. The section-search tool returned
“Tool not found”; screen search and screen/image retrieval worked instead.

| Real reference | Refero style/screen ID | What works and why | Principle adopted |
| --- | --- | --- | --- |
| [Mike Matas](https://mikematas.com) | `749d923d-8d1a-48f6-b4dc-da755fbf1c62` | Precise short text and product evidence carry the identity; little chrome competes with the work. | Two restrained flagship links in the hero, actual evidence retained. |
| [Daniël van der Winden](https://www.daniel.pizza) | `08e84c0f-da94-4d25-a1d4-ab20fc6b4df5` | Editorial type roles and ordered factual entries make a personal site easy to scan. | Small “My role” and commercial relevance labels across all case studies. |
| [Destroy Today](https://destroytoday.com) | `df64c286-f888-4a50-87c1-369508d24482` | Underlined contextual links make interaction apparent without adding ornamental UI. | Contextual service/contact links and a direct hero contact path. |
| [INK](https://weareink.co.uk) | `b9a2fcef-dbc0-418d-b438-a5fa878b73ed` | Project imagery explains real output; quiet links let evidence retain priority. | Preserve photographs/screenshots and attach a next step to the relevant case. |
| [Pentagram](https://pentagram.com) | `b7aaed72-51f5-4bbe-ae51-7cfa31a1de58` | Compact labels, typographic hierarchy and structured project presentation support inspection. | Repeated factual context and a consistent commercial next step, without making every project identical. |
| [Family FAQ](https://refero.design/pages/5ab0d7a8-a7aa-42f9-984f-ca3491fe9d70) | `5ab0d7a8-a7aa-42f9-984f-ca3491fe9d70` | Short questions, dividers and inline disclosure let readers choose which answer matters. | Six native `details` questions beside the service/process journey. No custom accordion runtime. |

The existing site is the primary visual target: `--paper`, `--ink`, `--accent`,
system fonts, serif headings, sharp edges and existing spacing conventions.
Borrowed principles are hierarchy and contextual disclosure, not source colors,
fonts, distinctive layouts or imagery. Reject gradients, new font downloads,
rounded-card systems, agency positioning, fabricated metrics and decorative motion.

## Audit evidence and priorities

The public root and `/en/`, `/sr/` pages were read through the browser/search tool.
Repository inspection covered the two generators, localization catalogs/build,
static detail pages, styles, interaction scripts, Cloudflare middleware/routing,
headers, robots, sitemap, structured data, analytics and test harnesses.

1. **Buyer uncertainty:** no homepage FAQ existed. Existing service descriptions
   already explained delivery, but scope, price, turnaround and support required
   visitors to infer answers or leave the homepage. Added six carefully qualified
   answers, closed by default, with no fixed price, availability promise or guarantee.
2. **Conversion handoff:** the inspector sent every project to generic services;
   standalone cases lacked a consistent contextual next step. Cases now identify
   the author's actual role and relevant commercial skill. Inspector exits select
   the matching service, and standalone cases provide relevant service links and
   project-specific email subjects. AI service anchors work with and without JS.
3. **SEO inconsistencies:** homepage Twitter URLs pointed to the unlocalized root,
   Serbian Twitter image alt remained English, and detail pages lacked card/image
   declarations. Corrected those. Existing canonical, `lang`, reciprocal alternate,
   x-default, sitemap, robots and root detection behavior passed verification and
   were retained; language URLs were not changed.
4. **Accessibility:** mobile case-menu summary measured 31.8px before refinement;
   case articles were assigned an incompatible `tabpanel` role. Neutral `div`
   panels now receive that role and are focusable from the tab list. Menu/filter
   targets meet a 44px height in tested layouts. A genuine 200% text-only stress
   test revealed overflow at 320px; flexible grid tracks and wrapping fix it without
   hiding content. Reduced motion disables transitions/animations as well as smooth scrolling.
5. **Reliability/performance:** four homepage project images lacked intrinsic
   dimensions. Dimensions now match the real files, while lazy loading and existing
   crops remain. Project assets range from roughly 11–147KB; existing compression
   is already reasonable. No font network requests or new dependencies were added.
6. **Measurement:** Umami was already installed, with no action events in the
   inspected code. Added one delegated listener plus one actual Ana-opening event.

## Analytics contract

The existing Umami instance receives only these fixed event names:
`contact_email`, `contact_phone`, `freelance_profile`, `project_reference`,
`ana_open`, `language_switch`.

No custom payload includes URLs, email addresses, phone numbers, language strings,
chat content, messages, form fields or visitor identifiers. Ana is counted after
the dialog actually opens, not again through its trigger link. No extra pageviews
or second provider are introduced. Missing, blocked or throwing analytics cannot
break navigation. Existing Umami pageview behavior remains unchanged.
API reference: [Umami tracker functions](https://docs.umami.is/docs/tracker-functions).

## Before and after

| Locally measured/checkable item | Before | After |
| --- | --- | --- |
| Homepage buyer questions | 0 | 6, all answers initially closed |
| Mobile case-menu target height | 31.8px | At least 44px |
| Four project-card images with explicit dimensions | 0/4 | 4/4 |
| Case-specific service handoff | Generic section | Relevant service selected |
| Homepage Twitter URL | Root in both languages | Canonical locale route |
| Serbian Twitter image label | English | Serbian Latin |
| Runtime dependencies added | — | 0 |
| Additional runtime JS | — | About 1.4KB uncompressed |
| New refinement stylesheet | — | About 4.4KB uncompressed |

These are implementation measurements, not measured sales improvements. Field
Core Web Vitals and conversion changes require post-release observation; no new
Lighthouse score, ranking improvement or WCAG certification is claimed.

## Files and architecture

- Content: `data/buyer-questions.json`, `data/project-context.json`, and both
  `data/locales/{en,sr}.json` catalogs.
- Rendering/SEO: `scripts/render-product.cjs`, `scripts/build-pages.cjs`,
  `scripts/build-locales.cjs`, `scripts/localization.cjs`.
- Presentation/interaction: `css/refinement.css`, `js/workshop.js`,
  `js/secretary.js`, `js/conversion.js`.
- Generated output: root homepage, five source cases, two source service pages,
  their `/en/` and `/sr/` counterparts, and localized error-page metadata.
- Verification: `tests/refinement.test.cjs`, `tests/refinement.browser.cjs`.
- Documentation: this note and README.

Cloudflare security headers, CSP, Functions, redirects, sitemap URLs, analytics
website ID, API endpoints, discovery metadata and Secretary backend are unchanged.
The build remains static and compatible with Live Server.

## Verification and limits

```
node scripts/build.cjs
node --test tests/*.test.cjs
node tests/workshop.browser.cjs
node tests/localization.browser.cjs
node tests/refinement.browser.cjs
```

Browser tests use isolated Playwright via `PLAYWRIGHT_PATH` and headless Microsoft
Edge. External scripts and Ana requests are blocked or mocked; tests send no live
chat, analytics or client messages. There is no configured lint/type-check command;
modified JavaScript passes `node --check`.

Validated: 25 unit/static tests; browser widths 1440, 1200, 768, 390 and 320px in
the existing workshop suite; both languages at 1440, 768, 390 and 320px in the
localization/refinement suites; keyboard tabs/FAQ/dialogs, evidence galleries,
project/service controls, Ana mock success and rate-limit handling, storage failure,
manual language persistence, back/forward, explicit URLs, equivalent-page switching,
16 no-JS public pages, 404 behavior, and modeled Pages legacy redirects.

Refinement checks cover native FAQ without JS, 200% text stress, light/dark base
text-palette contrast at least 4.5:1, 44px navigation/filter targets, exactly one
bounded event per tested action, analytics-failure isolation and zero page-script
errors/missing local resources in those paths. Static checks cover reciprocal SEO,
sharing metadata, sitemap and source/embedded stylesheet synchronization. Repeated
builds produce identical homepage/sitemap bytes. Desktop/mobile FAQ screenshots
were visually inspected.

Remaining: real field CWV, assistive-technology user testing, independent public
review links if authorized sources become available, and measured conversion
results after an approved release. Testimonials were preserved from existing
publication-approved data; no new independent verification links were invented.
Localhost Ana CORS remains controlled by the separate Worker. Live model replies,
external-link uptime and production analytics delivery were not tested in this run.
