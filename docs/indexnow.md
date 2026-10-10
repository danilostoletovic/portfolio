# IndexNow

IndexNow notifications run in GitHub Actions, never in visitors' browsers.
No new Worker, dependency, tracker or paid service is used.

## Configuration and deployment

`data/indexnow.json` contains the production host and a cryptographically
generated 256-bit hex key. Its required public verification file is
`/{key}.txt` with exact UTF-8 key bytes. This key is deliberately public:
it is not a Cloudflare API credential and does not grant site write access.
No GitHub secrets are required beyond the workflow's built-in read-only
`GITHUB_TOKEN`. Do not store other credentials here.

This checkout had no existing GitHub Actions deployment workflow. The added
workflow listens for GitHub `deployment_status` events; it does not deploy.
Cloudflare's Git integration/status checks must not be assumed to emit
GitHub Deployment API events. Connect the actual deployment pipeline to
create a deployment on the default branch with environment exactly
`Production`, `production_environment: true`, and the immutable deployed
commit SHA; report `success` only after a successful production deployment.
Preview/PR deployments must use different/non-production environments.
If deployment already runs in Actions, the equivalent integration is a
post-success job calling the same script, with the production SHA and last
successful production SHA. Never run it merely after checkout or a push.
This external deployment-status bridge is still required unless already
provided by infrastructure outside this repository.

Production build command remains `node scripts/build.cjs`. Cloudflare Pages
sets `CF_PAGES_COMMIT_SHA`; the build writes `deployment-version.txt` using
that SHA. A different deployment runner must set `INDEXNOW_DEPLOY_SHA` to
its immutable Git commit before building. Include the key file, version
file, sitemap, `_headers`, `_redirects`, `_routes.json`, localized directories
and Pages Functions in the deployed output. The two new text paths bypass
the root-only Function and do not match language redirects.

After an authorized deployment, verify:

```powershell
$key = (Get-Content data/indexnow.json | ConvertFrom-Json).key
curl.exe -sS -D - "https://danilostoletovic.com/$key.txt"
curl.exe -sS -D - https://danilostoletovic.com/deployment-version.txt
```

Expect direct HTTP 200, text/plain, exact key content and the deployed commit.
No live key-file verification or live IndexNow submission was performed
during implementation. Current production cannot serve newly added files
until deployment.

## Automatic selection and safeguards

The sitemap supplies candidate URLs. Only exact HTTPS production-domain
localized URLs with self-referencing canonical HTML and no `noindex` or
meta-refresh are selected. Root, legacy redirects, 404s, APIs, query/hash
variants and external URLs are excluded. Existing SEO files and routing
remain intact.

The previous successful GitHub production deployment supplies the baseline.
Comparison includes added/modified generated HTML and changed referenced
JS/CSS/images. Previously canonical URLs removed from the sitemap are
submitted only after production returns 404, 410 or a permanent redirect.
Without a known baseline the documented fallback is all current canonicals;
historical deletions cannot be inferred. Normal unchanged deploys skip
submission. Keep generated localized HTML committed so prior commit
snapshots match the site's build structure.

Before POST, the script checks production's commit marker, exact key file,
and live canonical/indexability or removal status for every selected URL.
Missing/stale files or CDN propagation delays block submission. Retry the
workflow once production is ready. A status event cannot bypass these checks.

POST uses https://api.indexnow.org/indexnow with `host`, `key`, `keyLocation`
and `urlList`. Requests time out after 15 seconds. Network errors, 5xx and
429 get at most four attempts with exponential backoff / Retry-After.
Long Retry-After values fail visibly for a later manual retry. 400, 403 and
422 fail immediately with a diagnostic. 200 means received; 202 means key
validation pending. Neither proves indexing. Concurrency serializes runs;
URL deduplication avoids duplicate entries. Repeated status events or retries
may still repeat a batch: no persistent external deduplication store is added.
Failures produce visible Actions errors/warnings but do not affect deployment.

## Manual submission

On the default branch, Actions → “IndexNow after production deployment” →
Run workflow. Choose `all` or `specific`; for specific, supply an exact
current sitemap canonical such as `https://danilostoletovic.com/sr/`.
External, redirected, noncanonical, noindex or arbitrary deleted URLs are
rejected. The selected default-branch commit must already be live; do not
run manual submissions from a branch ahead of production. Removed pages
are handled by the automatic known-baseline comparison.

Official protocol and response meanings:
https://www.indexnow.org/documentation

Local validation: `node scripts/build.cjs`,
`node --test tests/*.test.cjs`. IndexNow API responses and live verification
responses are mocked in tests; tests never send notifications.
