# auth.md

## Audience and access

This document is for agents reading Danilo Stoletović's public portfolio or discovering its Secretary API. Public portfolio documents can be fetched without authentication.

## Supported method

The existing Secretary client uses unauthenticated HTTPS requests to `POST https://secretary.danilostoletovic.com/chat` with `Content-Type: application/json` and a body containing a `message` string. See the [API documentation](https://danilostoletovic.com/api.md) and [OpenAPI description](https://danilostoletovic.com/openapi.json).

## Registration and credentials

No agent registration or provisioning endpoint is available in this integration. No API keys, bearer tokens, cookies, or client credentials are required by the portfolio client. There are no credential issuance, claim, or revocation flows to invoke. Unauthenticated chat access does not issue an anonymous agent identity or credential.

No OAuth authorization server, protected resource metadata, or `agent_auth` registration flow is advertised. Do not probe `POST /agent/auth` or invent a registration URL. This document describes current access; it does not implement agent registration.

## Usage

Respect rate limits and HTTP errors, including `Retry-After` when supplied. Browser access remains subject to the API's CORS policy. Do not submit chat requests during passive discovery, and do not send sensitive information.
