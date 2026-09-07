# Skills catalog API

Base URL: https://skills.xingkaixin.me

`GET /api/skills.json` returns the complete public skill catalog as a JSON array.
No authentication, pagination, or query parameters are required. Filter the
response locally by `slug` or `category`. Data updates when the site is rebuilt.

Each skill includes `slug`, `name`, the agent routing `description`, human-facing
`displayDescription` in English (`en`), Chinese (`zh`), and Japanese (`ja`),
`category`, `sourceRepo`, `sourceKind`, `firstAdded`, `lastModified`, and
`contentLanguage`. Dates use YYYY-MM-DD.

- [OpenAPI specification](/openapi.json)
- [API catalog](/.well-known/api-catalog)

## Read a skill

Request `/skills/{slug}` with `Accept: text/markdown` for its summary, installation
command, metadata, and original skill body. Use `/zh/skills/{slug}` or
`/ja/skills/{slug}` for translated summaries. The original body is not translated.
Relative file references in that body refer to the source directory linked in
the response. The English, Chinese, and Japanese homepages also support Markdown.

Browsers receive HTML by default. An explicit positive `text/markdown` preference
wins when its Accept quality is at least that of HTML. `HEAD` returns headers
without a body. Unknown skills return 404.

```sh
curl https://skills.xingkaixin.me/api/skills.json
curl -H 'Accept: text/markdown' https://skills.xingkaixin.me/
```

The browser-only WebMCP tools are separate from this HTTP API.
