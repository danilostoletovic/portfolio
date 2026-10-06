# Secretary API

Danilo's portfolio uses a separately maintained Cloudflare Worker to answer questions about his work, projects, and technical experience.

- Endpoint: `POST https://secretary.danilostoletovic.com/chat`
- Request content type: `application/json`
- Request body: `{"message":"What projects has Danilo built?","history":[{"role":"user","content":"Who is Danilo?"},{"role":"assistant","content":"..."}]}`. `history` is an optional ordered array of prior messages; each item has `role` (`user` or `assistant`) and `content` (string). History is limited to 40 messages and 12,000 characters in total; user messages are limited to 2,000 characters. The current `message` is sent separately and is not duplicated in `history`. The complete UTF-8 JSON request must fit within 16 KiB. Unknown request fields and other roles are rejected.
- Successful response: HTTP 200 with a JSON object containing a nonempty `reply` string.
- [OpenAPI description](https://danilostoletovic.com/openapi.json)
- [Access and authentication](https://danilostoletovic.com/auth.md)

The existing portfolio client sends no API key, bearer token, or cookies. Each request contains the current question plus successful prior user/assistant turns in `history`. There is no registration step. Browser clients remain subject to the Worker's CORS policy; publishing these docs does not add allowed origins.

Ana provides public professional and portfolio information, project-fit guidance, and conversation. She does not send email, schedule meetings, access private data, modify external systems, execute tools or code, access runtime files, or make arbitrary HTTP requests. There are no visitor-authenticated actions, server sessions, persisted tasks, or streaming replies. History is client-supplied on each request. This custom chat API is not an A2A endpoint or an MCP server.

Send a nonblank question. The portfolio client waits up to 30 seconds. Handle HTTP errors and network failures; on HTTP 429, wait before retrying and respect `Retry-After` when present. No fixed quota or uptime guarantee is advertised.

Replies are AI-generated text and may be inaccurate. Do not send passwords or sensitive information. For passive discovery, read this document and the API catalog without submitting chat requests. No health endpoint is advertised.
