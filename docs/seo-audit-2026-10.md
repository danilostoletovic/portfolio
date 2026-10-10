# Commercial SEO audit — 10 October 2026

## Scope and evidence

Repository review covers static generators, English/Serbian dictionaries,
all HTML routes, root Pages middleware, `_routes.json`, `_redirects`,
`_headers`, robots, sitemap, structured data, project/testimonial sources,
contact modal and IndexNow workflow. Search research is **qualitative SERP
analysis**, not a Google/Bing rank tracker: location/personalization and
search-provider coverage can change results. No search volume, keyword
difficulty or current ranking is asserted. No Search Console/Bing account
data was available, so name-only rankings are the owner's reported context.

Production HTTP checks during this run: `/` returned 302 to `/en/` with
no-store and language/cookie Vary; `/en/` and `/sr/` returned 200. English
HTML had an indexable robots directive, self canonical and reciprocal
English/Serbian/x-default links. New landing pages are locally built; their
production availability is not verified before deployment.

## Prioritized findings

| Priority | Finding and evidence | Action |
|---|---|---|
| High | Only two dedicated commercial service routes existed; AI and infrastructure were mainly homepage summaries. | Added distinct software, AI integration and maintenance pages in both languages. |
| High | Website page title led with a broad developer label, while observed Serbian results explicitly satisfy website creation intent. | Unique website-development title/description and descriptive H1; natural Serbian `izrada sajtova` copy. |
| High | Service detail discovery was limited to individual homepage offer links. | Added a compact five-service directory after the service choices and on service pages; existing Services navigation leads to it. |
| Medium | Service schema previously assigned every non-mobile page the website-development type. | New pages declare their actual serviceType; retain Person, WebPage, Service and BreadcrumbList, without fabricated business address/reviews. |
| Medium | New route expansion must propagate into locale generation, redirects and IndexNow rather than hand-maintained XML. | Shared route list now produces 22 indexable canonical localized URLs; IndexNow selection and regression checks updated. |
| Monitor | Root language negotiation is a temporary HTTP redirect, not an independently indexable page. | Correct current behavior; retain x-default root and submit destination pages. Do not treat a root redirect exclusion as an SEO error. |
| Monitor | Public testimonials are marked approved in repository data but lack independent review links. | Preserve approved wording/attribution; do not add Review/AggregateRating schema or pretend independent verification. |
| Unmeasured | Core Web Vitals and real-user mobile performance. | No CrUX/Search Console field data or Lighthouse score was obtained; no performance pass claimed. Measure after deployment. |

Technical checks find no need to change security/CSP, robots, root routing,
existing canonical/hreflang strategy or analytics. The top-level 404 prevents
an accidental SPA fallback; localized legacy source routes redirect to their
English canonicals. New pages keep static headings/content and native contact
enhancement, so meaningful content does not depend on JavaScript.

## Search observations and keyword-to-page mapping

The following are observed competitor/provider examples, not measured ranking
positions, market shares or verified competitor outcome claims:

- [Nikola Miljković](https://www.nikolamiljkovic.live/) and
  [Lazar Petković](https://www.lazarpetkovic.com/) illustrate personal freelancer
  positioning and explicit website services in Serbian geographic queries.
- [Advertise Design](https://advertise-design.com/izrada-web-sajtova/) and
  [Topweb](https://topweb.rs/izrada-sajtova-nis/) have dedicated Niš website pages;
  this indicates local commercial competition, not permission to invent an office.
- [Custify](https://custify.rs/usluge/web-aplikacije/) and
  [StartUp Solutions](https://www.izradawebstranica.rs/usluge/izrada-web-aplikacija)
  distinguish applications/internal tools from brochure websites.
- [Alexander Gorbunov](https://alexgorbunov.com/) demonstrates an independent
  developer counterpart to larger custom-software providers.
- [Blackbird](https://blackbird.rs/), [Veles Digital](https://veles.digital/)
  and [Biznis Automatika](https://biznisautomatika.rs/) show software/AI/workflow
  competitors. ERP-wide claims need expertise beyond the evidence in this portfolio.
- [Salty maintenance](https://www.salty.rs/usluge/odrzavanje) distinguishes
  ongoing site support from initial construction.
- [Whitepage](https://www.whitepage.studio/services/presentation-design) and
  [PresentSlide](https://presentslide.com/) show specialist presentation-design
  intent. Serbian presentation searches also surface educational material;
  this is a mixed intent, not validated demand for Danilo's service.

| Query family, including additional terms observed | Intent / geographic fit | Observed competition | Landing page and realistic fit |
|---|---|---|---|
| Freelance web developer Serbia; website development Serbia; business website developer | Hire an independent website builder; Serbia + remote | Freelancers and studios with specific service descriptions | Existing `/services/business-websites/`, improved; demonstrable portfolio implementation |
| Izrada sajtova; izrada web sajtova Niš; izrada poslovnog sajta; redizajn sajta | Buy a site/redesign; Niš query may seek local presence | Dedicated local studio/city pages, often with portfolios/pricing | Same website page in `/sr/`; truthful Serbia/remote wording, no cloned city doorway pages or office claim |
| Custom software developer; softver po meri; izrada web aplikacija po meri; interni alati | Build an application/workflow rather than a marketing site | Agencies, individual engineers and freelancer marketplaces | New `/services/custom-software-development/`; Class Timetable/SmartVehicle evidence; scoped integrations, not an enterprise suite claim |
| Izrada aplikacija; Android app developer; Flutter developer | Hire for device/platform-specific development | Agencies and marketplace profiles | Existing `/services/mobile-app-development/`; keep separate from general internal software |
| AI automation for businesses; AI integracije; poslovni AI asistent; API integracije | Integrate a useful assistant or repetitive workflow | AI firms and automation specialists | New `/services/ai-integrations/`; Ana is concrete evidence; no guaranteed savings or nonexistent actions |
| Business process automation; automatizacija poslovanja | Broad workflow/ERP intent, sometimes consulting | Workflow and ERP integration providers | Narrow supported subset on AI/software pages; do not claim comprehensive ERP transformation |
| Website maintenance; održavanje sajtova; tehnička podrška za sajt; Cloudflare/DNS support | Repair or maintain an existing site | Hosting providers and maintenance-specific studio pages | New `/services/website-maintenance/`; scope review, no unverified 24/7 or every-CMS promise |
| Technical consulting | Broad advisory intent; remote | Consultants and engineering firms | Covered as review/scoping within supported services; standalone page deferred until specific deliverables/evidence are defined |
| Professional presentation design; izrada prezentacija | Buy polished slides; Serbian results may be educational | Specialist presentation providers + mixed educational results | Deferred: no verified presentation service or project evidence in repository |

All page mappings use equivalent `/en/` and `/sr/` prefixes. No duplicate
keyword-only pages, price guarantees, fictional client outcomes or city pages
were introduced. The website page owns website creation; maintenance owns
existing-site support; mobile owns device-specific applications; custom software
owns broader workflows; AI owns assistant/model integration.

## Implementation and design

`scripts/seo-services.cjs` pairs original English/Serbian copy and feeds the
existing generator. It uses the portfolio's existing editorial reading page,
native details/navigation, sharp borders and typographic hierarchy rather than
a new visual system. Previous Refero research for this site's contact experience
(The Org's labelled form hierarchy, restrained sharp field treatment) remains
the contact reference; no new decorative landing-page layout was introduced.

Each added service has fit, deliverables, project evidence, process, practical
questions and a contact CTA. Copy makes support boundaries explicit. Shared
Service schema references the individual provider; breadcrumbs and localized
social metadata continue through the existing build. No dependency was added.

## Validation and remaining work

Tests check unique titles/descriptions, one H1, canonical/hreflang consistency,
all service internal links/anchors/assets, localized Service/Breadcrumb JSON,
homepage discovery, sitemap inclusion, no canonical-path redirects, and contact
availability. Existing bilingual browser harness checks all indexable pages
without JavaScript and mobile/tablet/desktop interaction/layout. Network calls
to Ana and analytics are mocked; this is not live email or model delivery testing.

After an authorized deployment, verify new localized URLs return 200, recheck
robots/canonicals/redirects and submit the sitemap. IndexNow will discover them
through the expanded canonical sitemap, but its production deployment event
bridge remains an external setup requirement. Use Search Console and Bing query
data to validate which commercial terms actually bring impressions/inquiries.
The key-file/commit-marker checks still gate IndexNow submissions.

Measure mobile Core Web Vitals and a representative Lighthouse run with a real
network profile; browser no-overflow tests do not establish LCP/INP/CLS. Seek
relevant independent links and permission-backed public review evidence. Add
further service pages only when concrete deliverables and work samples support
them. Review enquiries rather than chasing a keyword-density score.
 
Executed results: production build passed; all 37 automated tests passed.
The Edge browser harness passed English/Serbian navigation and service checks
at 1440, 768, 390 and 320 pixels, including 200% root text scaling and contact
popup opening/closing. All 22 canonical pages returned 200 through the local
static/edge harness without JavaScript. Rendered Serbian mobile service output
was visually inspected. No deploy, commit or live IndexNow submission occurred.
