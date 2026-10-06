# Implementation reference and search measurement

## Reference lock

Build target: the existing danilostoletovic.com workshop design, authorized for refinement.
Preserve: paper canvas, ink borders, Georgia display headings, orange actions, existing rover illustration, light/dark themes, framework-free delivery.
Primary Refero reference: Daniël van der Winden (https://www.daniel.pizza), structured editorial content and reading rhythm.
Secondary: Mike Matas (https://mikematas.com), real product imagery without decorative mockup framing; Dennis Snellenberg (https://dennissnellenberg.com), clear personal positioning and action hierarchy.
Borrow structure and media roles; retain the existing brand tokens rather than transplanting reference palettes.

| Decision | Evidence | Role |
| --- | --- | --- |
| Existing canvas, typography, and orange actions | Current site and user's request | Brand continuity |
| Reading column with compact page index | Daniël van der Winden Refero style | Case study navigation and readable sections |
| Actual vehicle and Android imagery | Mike Matas Refero style; local landing-page assets | Evidence, not decoration |
| Direct project enquiry in hero | Dennis Snellenberg hierarchy; approved audit | Main hiring action |
| Smart Vehicle first, Secretary second | User clarification | Case study order |
| Public project evidence instead of fictional quotes | Source-grounded content | Trust |

## Search Console baseline (requires owner's account)

No private Search Console data or ranking baseline was available during implementation.
After deployment, verify the domain property, submit /sitemap.xml, and inspect the homepage and four new URLs. Save the previous 28 days of impressions, clicks, CTR, and average position, segmented by page, query, device, and country. Separate name searches (including the unaccented name) from service searches.

Compare equivalent periods after Google has had time to crawl the pages. Track actual enquiry events as well as traffic. Use observed queries to refine useful content; do not publish near-duplicate pages for every keyword variation. Do not treat llms.txt as a Google ranking signal.

Existing public profiles should link consistently to https://danilostoletovic.com/. Profile editing, external outreach, backlink placement, and account verification were not performed. No ranking improvement is guaranteed.

## Source evidence

- Smart Vehicle: landing-page/index.html, llms.txt, and local AVIF assets.
- Secretary: src/routes/chat.ts, src/knowledge, and the portfolio browser interface. The current code supports optional bounded client-supplied history; the older README's message-only description is not authoritative for that behavior.
- Secretary interface image: actual local browser capture of the initial dialog; no model request or invented conversation was used.
- Class Timetable screenshot: fetched from the author's class-timetable repository at assets/web.png. It is an actual empty-schedule interface, not a fabricated demo.
- No authentic PromptUI screenshot was supplied locally or linked from its repository README. Do not manufacture product screenshots or use another product's visuals.
- Testimonial writing samples live in testimonial-samples.md and are not published as endorsements.

## Maintaining the content

Edit case studies and service copy in scripts/build-pages.cjs, then run it with Node to regenerate the four HTML pages and sitemap. Shared content styles live in css/content.css. Keep index.md, llms.txt, the AI catalog, and Secretary knowledge aligned when public facts change.

## Visual QA

Source truth: existing workshop UI plus the reference lock above. Desktop and 390px mobile captures confirm readable headings, responsive navigation, and no horizontal overflow. Homepage light/dark modes and the optional Secretary dialog were inspected. The new content preserves original color tokens and illustration; actual product imagery supplies the new evidence. New pages use static HTML, unique metadata, canonical URLs, JSON-LD, and resolvable local navigation.

## PromptUI, Timetable, and opening update
The opening now invites visitors to turn an idea into useful software, with direct project and approved-feedback links. Reference lock remains Daniël van der Winden for editorial hierarchy and Mike Matas for real product screenshots. PromptUI uses the owner-supplied offline-demo welcome screenshot. New case studies use each project's public README, distinguish manual timetable transfer from cloud sync, and describe PromptUI as a local experiment. Smart Vehicle remains case study 01 and Secretary case study 02. Metadata, sitemap, discovery resources, and Secretary project knowledge include both new studies. Eight content/discovery tests passed; mobile layouts checked at 390px with no horizontal overflow.

Case studies now occupy a dedicated #case-studies section with navigation and correct breadcrumbs. User screenshot is the visual lock: graph paper, ink rules, monospace field labels, and restrained workshop colors. Project screenshots remain in the project overview. All eight existing checks pass.

## Press archive
Reviewed all six supplied sources on 2026-10-04. Each names the relevant project or result. Metropolitan explicitly lists Danilo second in the Niš AI assistant competition. Galaksija Cup lists a special award for a notable result; this archive does not infer a numbered placing. English descriptions are summaries, not invented article titles or quotes. Text-first two-column archive follows the existing editorial reference lock, typography and tokens; mobile becomes one column. Footer navigation avoids crowding the header. No logos, endorsement schema, external embeds or new JavaScript.
# Workshop port / October 2026

## Product rebuild / authoritative screenshots

Follow-up: remove the vehicle figure from the introduction, move service choices ahead of the case-study archive, and keep the entire archive closed until requested. Every documented project has a card and a full case study. Add mobile, website and experiment filters alongside hardware and AI; the Other/all-projects view intentionally contains all five. The new vector monogram and platform icons use the same paper/ink/orange palette as the site, with versioned URLs rather than changes to security or caching headers.

The owner's seven supplied screenshots supersede the earlier section-by-section refinement: two visual project cards, a split service chooser, one selected client excerpt, a full-width ink personal band, compact source rows, and an inbox with Ana beside it. Preserve the paper/ink/orange palette and image roles. The homepage no longer repeats project articles above a second explorer.

Initial state contains project overviews only. A deliberate case-study action opens one notebook; project and chapter selectors reveal only the requested material, with engineering decisions behind native disclosure and images behind an evidence viewer. Additional projects occupy an expandable workbench. Hiring paths remain in navigation and the service panel. On phones, service choices form a two-by-two grid, secondary projects become compact rows, and the notebook keeps flagship choices and chapter tabs within reach. No animation gates access to content.

Acceptance checks: no visible case-study chapters on arrival; one service brief and one feedback excerpt; Ana opens directly without consuming SmartVehicle; the notebook shows one project/chapter; all five static case studies remain linked; no horizontal overflow at 320, 390, 768, 1200 or 1440px. Actual request validation/CORS/rate limiting remain owned by the separate Secretary Worker. The frontend challenge is opt-in, preserving its personality without interrupting browsing.

Full brief implementation: pair SmartVehicle and Ana as featured evidence-led case studies, then expose Class Timetable, PromptUI and the portfolio as three supporting projects. Each overview links to the selected project notebook and its complete static case study. Add evidence inspection and the existing Ask Ana interface to reading pages; retain the original backend and strict CORS policy. Service choices connect to related work, feedback offers explicit project-type choices, and press filters report the visible source count. No new quotes, awards or production capabilities are invented.

Reference fidelity follow-up: match the 1200px reference's 48px gutters, 106px header, roughly 594px hero, two-line Times serif headline, full-width divider rules and landscape workbench framing. Remove the earlier orange headline underline and two-line sticker. Keep both the hero Ask Ana entry and the existing floating launcher. Load the refinement stylesheet after the embedded base styles to avoid accidental cascade differences; retain the existing responsive theme behavior.

Visual lock: the owner-supplied private workshop reference screenshot. Preserve its paper palette, orange primary action, Georgia headline, actual vehicle photograph, green rotated workbench and yellow handwritten sticker. Retain the existing Ask Ana interface. Supporting references: Daniël van der Winden for editorial navigation and Mike Matas for real product evidence; borrow organization rather than their brand styling.

Interactive project notes cover Smart Vehicle, Ana, Class Timetable, PromptUI and the portfolio. Evidence comes from existing owner/project assets. The Ana screenshot is archived; PromptUI is explicitly an offline demo. Native links and full static case studies remain available without scripts. Existing approved client quotes and sourced press links are reused without adding endorsements or ratings.
