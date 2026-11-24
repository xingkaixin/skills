import assert from "node:assert/strict";
import test from "node:test";
import worker, { prefersMarkdown } from "../apps/web/worker.js";

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
      return new Response(request.method === "HEAD" ? null : body, { headers: { "Content-Type": "text/html", ETag: `"${path}"` } });
    },
  },
};

test("localized pages negotiate Markdown and separate cache variants", async () => {
  for (const path of ["/", "/zh", "/ja/", "/skills/example", "/zh/skills/example", "/ja/skills/example"]) {
    const response = await worker.fetch(new Request(`https://example.com${path}?q=test`, { headers: { Accept: "text/markdown" } }), env);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("Content-Type"), /^text\/markdown/);
    assert.equal(response.headers.get("Vary"), "Accept");
    assert.match(response.headers.get("Cache-Control"), /^private,/);
    assert.doesNotMatch(response.headers.get("Cache-Control"), /no-store/);
    assert.match(response.headers.get("Link"), /rel="api-catalog"/);
    assert.match(await response.text(), /^# Skill/);
  }
  const html = await worker.fetch(new Request("https://example.com/"), env);
  assert.equal(html.headers.get("Content-Type"), "text/html");
  assert.equal(html.headers.get("Vary"), "Accept");
});

test("edge cache isolates HTML and Markdown variants and honors If-None-Match", async () => {
  const store = new Map();
  const originalCaches = globalThis.caches;
  let assetHits = 0;
  const countingEnv = {
    ASSETS: {
      async fetch(request) {
        assetHits += 1;
        return env.ASSETS.fetch(request);
      },
    },
  };
  globalThis.caches = {
    default: {
      async match(req) {
        const hit = store.get(typeof req === "string" ? req : req.url);
        return hit ? hit.clone() : undefined;
      },
      async put(req, res) {
        store.set(typeof req === "string" ? req : req.url, res.clone());
      },
    },
  };
  try {
    const html1 = await worker.fetch(new Request("https://example.com/zh?q=foo"), countingEnv);
    assert.equal(await html1.text(), "<html>Catalog</html>");
    const md1 = await worker.fetch(new Request("https://example.com/zh?q=bar", { headers: { Accept: "text/markdown" } }), countingEnv);
    assert.match(await md1.text(), /^# Skill/);
    assert.equal(assetHits, 2);

    const html2 = await worker.fetch(new Request("https://example.com/zh?q=baz"), countingEnv);
    assert.equal(await html2.text(), "<html>Catalog</html>");
    assert.equal(assetHits, 2);

    const notModified = await worker.fetch(
      new Request("https://example.com/zh", { headers: { "If-None-Match": html1.headers.get("ETag") } }),
      countingEnv,
    );
    assert.equal(notModified.status, 304);
    assert.equal(await notModified.text(), "");

    // Trailing-slash redirects must not collide with the cached canonical HTML entry.
    const redirectEnv = {
      ASSETS: {
        async fetch(request) {
          const pathname = new URL(request.url).pathname;
          if (pathname.endsWith("/") && pathname !== "/") {
            return new Response(null, { status: 307, headers: { Location: pathname.slice(0, -1) } });
          }
          return env.ASSETS.fetch(request);
        },
      },
    };
    const canonical = await worker.fetch(new Request("https://example.com/skills/example"), redirectEnv);
    assert.equal(canonical.status, 200);
    const trailing = await worker.fetch(new Request("https://example.com/skills/example/"), redirectEnv);
    assert.equal(trailing.status, 307);
    assert.equal(trailing.headers.get("Location"), "/skills/example");
  } finally {
    globalThis.caches = originalCaches;
  }
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
