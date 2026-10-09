# English and Serbian Latin

Run `node scripts/build.cjs` after changing shared page content. This uses the
existing homepage, testimonial, detail-page and stylesheet builders, followed by
`build-locales.cjs`. There are no production dependencies. Commit the generated
HTML and sitemap along with their sources; direct-upload deployments need no new
build setting. For Git-based Pages builds, use `node scripts/build.cjs` with the
existing repository-root output directory.

`data/locales/en.json` and `sr.json` map normalized English source copy to its
localized text. English remains the authoring language. The build fails on any
missing Serbian string, including metadata and accessibility labels. Brand names,
project titles, source code identifiers and URLs retain their spelling. Add new
copy to both catalogs. Runtime dialog/error labels are centralized in
`data/locales/runtime.json` and embedded only in the Serbian HTML; `js/i18n.js`
provides the shared translator. User messages and model replies are not translated
by string substitution.

Root `/` (and `/index.html`) runs a small synchronous `location.replace` before
paint: valid saved `portfolioLanguage`, then the first nonempty preferred browser
language, then English. Only `sr` and `sr-*` choose Serbian; other languages choose
English. Detection never writes storage. Explicit localized URLs never detect or
redirect language. Manual links save `en` or `sr` if storage is available and retain
the current page, query and anchor. Without JavaScript, the root exposes ordinary
language links and each language has fully rendered content and navigation.

`en/index.html` and `sr/index.html` serve `/en/` and `/sr/` on ordinary static
servers, including VS Code Live Server. Right-click the root `index.html` and
choose **Open with Live Server**. No running build process or Cloudflare emulator
is needed. You can also open `/en/` or `/sr/` directly. Rebuild only after editing
shared source content or translation catalogs. Serbian copy is adapted for natural
conversation rather than word-for-word translation.

Case studies and services use `/en/.../` and `/sr/.../`. Exact legacy-path 301 redirects preserve
deep links; there is no catch-all rewrite. Localized `404.html` files retain actual
404 status through Pages' nearest-directory error handling. `_routes.json`, root
Markdown negotiation, security headers, CSP, analytics IDs, and discovery/API
resources stay unchanged. Technical resource URLs are deliberately not localized.

Both languages have self canonicals, reciprocal `en`, `sr-Latn`, and `x-default`
links, localized Open Graph/Twitter metadata and structured data, and sitemap
entries. Root HTML is `noindex, follow` with `/en/` as canonical and root as the
homepage `x-default` selection target. Old HTML remains an authoring artifact
behind explicit redirects. No IP/geolocation selection is used.

## Ana: portfolio work and Worker prerequisite

The visible Ana interface, greeting, prompts, accessibility labels and errors are
localized. The chat body remains strictly `{message, history}`. Its request sends
a fixed `Accept-Language: en` or `sr-Latn`, selected from the generated HTML lang,
not from user messages, localStorage, query parameters or arbitrary text. This is
a CORS-safelisted preference header, so existing preflight rules need no expansion.
Successful history, body limits, timeouts and the existing endpoint are preserved.
Live Server does not emulate Cloudflare headers, Functions or redirects. Ana's
live Worker retains its existing CORS restrictions; localhost chat access requires
an explicitly allowed development origin in that separate service. This change
does not relax that policy. Browser tests mock chat responses.

`secretary-language.patch` documents the companion change applied, with approved
workspace escalation, in `C:/Users/danil/Projects/secretary`. The Worker maps the
public preference to an enum and appends only fixed, server-authored reply-language
instructions inside the guarded operation. Invalid values cannot inject
instructions. Explicit visitor language requests remain allowed; personality,
knowledge, admission, CORS and input schemas stay intact. Requests without the
header retain their prior behavior. The patch also includes backend regression
tests for enum normalization, instruction separation, explicit other-language
requests, strict input and shared rate admission. Worker type-check and all 35
tests pass (298 assertions), and the Wrangler dry-run bundle build succeeds.
Neither repository has been committed or deployed.

Deploy the Secretary change before the portfolio when these diffs are approved.
Until that Worker is released, the existing live backend ignores the preference
header, so default reply language cannot yet be guaranteed on the live site.

## Verification

```
node scripts/build.cjs
node --test tests/*.test.cjs
node tests/workshop.browser.cjs
node tests/localization.browser.cjs
```

The browser checks require an isolated Playwright install via `PLAYWRIGHT_PATH`
and local Microsoft Edge. They use only local assets and mocked Ana responses,
including rate-limit errors. No live API calls or deployment occur. There is no
configured lint/type-check command in this dependency-free JavaScript repository;
use `node --check` on modified JavaScript and build scripts.

References: [Pages routing and nearest 404 handling](https://developers.cloudflare.com/pages/configuration/serving-pages/),
[Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/),
[Google multilingual SEO](https://developers.google.com/search/docs/specialty/international/localized-versions).
