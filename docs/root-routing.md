# Root routing and indexing

Production checked on 2026-10-10: `/`, `/en/`, `/sr/` returned 200;
an unknown URL returned 404. Root HTML contained `noindex, follow`, an
English canonical and a client-only language redirect. No live root 4xx
was reproduced. Bing's affected URL and Cloudflare request logs are needed
to diagnose the separate 400–499 warning.

The root Pages middleware now issues a temporary 302 for GET/HEAD HTML
requests. A manual `portfolioLanguage=en|sr` cookie wins, then the highest
quality Accept-Language range; Serbian chooses `/sr/`, everything else
chooses `/en/`. Query strings survive. Explicit localized paths bypass
the Function. Redirects are no-store and vary by Accept, Accept-Language
and Cookie. No user-agent/crawler-specific rules are used.

Manual switching saves both localStorage and a same-site preference cookie.
Old localStorage-only preferences cannot be read by the edge; selecting a
language once establishes the cookie. Without cookies the URL remains
authoritative, and subsequent root visits use Accept-Language.

Markdown requests at root continue to return the public Markdown document.
The static root fallback remains an unindexed English page with language
links for Live Server or deployments without Functions. Localized pages
are the indexable canonicals. Root remains their x-default negotiation URL;
only canonical localized pages belong in the sitemap.

Build: `node scripts/build.cjs`. Deploy the repository root as the Pages
output, including `_headers`, `_redirects`, `_routes.json`, both locale
directories and the top-level `404.html`. Ensure Pages builds the
`functions/` directory; uploading static assets alone cannot install this
middleware. Dashboard build settings are external and were not changed or
verified. Root behavior belongs in the Function because Functions take
precedence over static `_redirects`. Security headers are copied from the
English static asset for generated redirects.

After an authorized deployment, verify from PowerShell:

```powershell
curl.exe -sS -I https://danilostoletovic.com/
curl.exe -sS -I -H "Accept-Language: sr-Latn-RS,en;q=0.8" https://danilostoletovic.com/
curl.exe -sS -I -H "Accept-Language: sr" -H "Cookie: portfolioLanguage=en" https://danilostoletovic.com/
curl.exe -sS -L -o NUL -w "status=%{http_code} redirects=%{num_redirects} final=%{url_effective}" https://danilostoletovic.com/
curl.exe -sS -I https://danilostoletovic.com/en/
curl.exe -sS -I https://danilostoletovic.com/sr/
curl.exe -sS -I https://danilostoletovic.com/route-check-missing-20261010
curl.exe -sS https://danilostoletovic.com/en/ | Select-String 'canonical|hreflang|name="robots"'
curl.exe -sS https://danilostoletovic.com/sr/ | Select-String 'canonical|hreflang|name="robots"'
curl.exe -sS -I -H "Accept: text/markdown" https://danilostoletovic.com/
curl.exe -sS https://danilostoletovic.com/sitemap.xml
```

Expect root 302 (one hop to a 200), explicit locales 200, unknown path 404,
Markdown 200. Redirect roots are not independently indexed pages; a
"page with redirect" classification is expected, not a failed destination.

After HTTP verification, inspect `/en/` and `/sr/` in Google Search Console,
run Test Live URL and Request Indexing. Resubmit `/sitemap.xml`. In Bing,
use URL Inspection / Live URL for both localized pages, submit those URLs
and resubmit the sitemap. Inspect the exact URL in its 4xx report; do not
turn genuine missing pages into 200 responses.

Official guidance:
- https://developers.cloudflare.com/pages/functions/routing/
- https://support.google.com/webmasters/answer/9012289
- https://www.bing.com/webmasters/help/url-inspection-55a30305
