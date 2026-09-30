# Secretary API

Danilo's portfolio uses a separately maintained Cloudflare Worker to answer questions about his work, projects, and technical experience.

- Endpoint: `POST https://secretary.danilostoletovic.com/chat`
- Request content type: `application/json`
- Request body: `{"message":"What projects has Danilo built?","history":[{"role":"user","content":"Who is Danilo?"},{"role":"assistant","content":"..."}]}`. `history` is an optional ordered array of prior messages; each item has `role` (`user` or `assistant`) and `content` (string). The portfolio client sends at most 20 messages and approximately 12,000 characters, and does not include the current `message` in `history`.
- Successful response: HTTP 200 with a JSON object containing a nonempty `reply` string.
- [OpenAPI description](https://danilostoletovic.com/openapi.json)
- [Access and authentication](https://danilostoletovic.com/auth.md)

The existing portfolio client sends no API key, bearer token, or cookies. Each request contains only the current question. There is no registration step. Browser clients remain subject to the Worker's CORS policy; publishing these docs does not add allowed origins.

Send a nonblank question. The portfolio client waits up to 30 seconds. Handle HTTP errors and network failures; on HTTP 429, wait before retrying and respect `Retry-After` when present. No fixed quota or uptime guarantee is advertised.

Replies are AI-generated text and may be inaccurate. Do not send passwords or sensitive information. For passive discovery, read this document and the API catalog without submitting chat requests. No health endpoint is advertised.
