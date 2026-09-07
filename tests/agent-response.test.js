import assert from "node:assert/strict";
import test from "node:test";
import worker, { prefersMarkdown } from "../apps/web/public/_worker.js";

test("content negotiation honors explicit Markdown, quality, and HTML defaults", () => {
  for (const accept of ["", "*/*", "text/*", "text/html", "text/markdown;q=0", "text/markdown;q=0.2,text/html;q=0.8", "text/markdown;q=invalid", "text/markdown;q=0.5,*/*;q=1"]) {
    assert.equal(prefersMarkdown(accept), false, accept);
  }
  for (const accept of ["text/markdown", "TEXT/MARKDOWN", "text/html,text/markdown", "text/markdown;q=0.8,text/html;q=0.2", "text/markdown;q=0.5,text/html;q=0,*/*;q=1"]) {
    assert.equal(prefersMarkdown(accept), true, accept);
  }
});

const env = {
  ASSETS: {
    async fetch(request) {
      const path = new URL(request.url).pathname;
      if (path.includes("missing")) return new Response("Not found", { status: 404 });
      const body = path.startsWith("/markdown/") ? "# Skill\n\nOriginal body" : "<html>Catalog</html>";
      return new Response(request.method === "HEAD" ? null : body, { headers: { "Content-Type": "text/html", ETag: path } });
    },
  },
};

test("localized pages negotiate Markdown and separate cache variants", async () => {
  for (const path of ["/", "/zh", "/ja/", "/skills/example", "/zh/skills/example", "/ja/skills/example"]) {
    const response = await worker.fetch(new Request(`https://example.com${path}?q=test`, { headers: { Accept: "text/markdown" } }), env);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /^text\/markdown/);
    assert.equal(response.headers.get("Vary"), "Accept");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.match(response.headers.get("Link"), /rel="api-catalog"/);
    assert.match(await response.text(), /^# Skill/);
  }
  const html = await worker.fetch(new Request("https://example.com/"), env);
  assert.equal(html.headers.get("Content-Type"), "text/html");
  assert.equal(html.headers.get("Vary"), "Accept");
});

test("HEAD, missing skills, catalog MIME, and unrelated assets retain their semantics", async () => {
  const head = await worker.fetch(new Request("https://example.com/", { method: "HEAD", headers: { Accept: "text/markdown" } }), env);
  assert.equal(await head.text(), "");
  assert.match(head.headers.get("Content-Type"), /^text\/markdown/);
  const missing = await worker.fetch(new Request("https://example.com/skills/missing", { headers: { Accept: "text/markdown" } }), env);
  assert.equal(missing.status, 404);
  const catalog = await worker.fetch(new Request("https://example.com/.well-known/api-catalog", { method: "HEAD" }), env);
  assert.match(catalog.headers.get("Content-Type"), /^application\/linkset\+json/);
  assert.match(catalog.headers.get("Link"), /rel="api-catalog"/);
  const asset = await worker.fetch(new Request("https://example.com/favicon.svg", { headers: { Accept: "text/markdown" } }), env);
  assert.equal(asset.headers.get("Vary"), null);
});
