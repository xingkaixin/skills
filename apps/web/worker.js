const discoveryLinks = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</api-docs.md>; rel="service-doc"; type="text/markdown"',
].join(", ");

const PAGE_PATTERN = /^(\/|\/(zh|ja)|(?:\/(zh|ja))?\/skills\/[^/]+)$/;
// `private` keeps Cloudflare's default URL-only CDN cache from mixing Accept
// variants, while max-age + SWR enables BFCache and instant repeat navigations.
const PAGE_CACHE_CONTROL = "private, max-age=60, stale-while-revalidate=600";
const EDGE_CACHE_CONTROL = "public, max-age=300";

export function prefersMarkdown(accept = "") {
  if (!accept || !accept.toLowerCase().includes("text/markdown")) return false;
  const ranges = accept.toLowerCase().split(",").map((part) => {
    const [type, ...parameters] = part.trim().split(";");
    const q = parameters.map((value) => value.trim()).find((value) => value.startsWith("q="));
    const quality = q ? Number(q.slice(2)) : 1;
    return { type: type.trim(), quality: Number.isFinite(quality) && quality >= 0 && quality <= 1 ? quality : 0 };
  });
  const markdown = ranges.find((range) => range.type === "text/markdown")?.quality ?? 0;
  const html = ["text/html", "text/*", "*/*"].map((type) => ranges.find((range) => range.type === type)).find(Boolean)?.quality ?? 0;
  return markdown > 0 && markdown >= html;
}

function withVariantHeaders(source, method, isPage, isMarkdown) {
  const response = new Response(method === "HEAD" ? null : source.body, source);
  response.headers.set("Link", discoveryLinks);
  if (isPage) {
    response.headers.set("Vary", "Accept");
    response.headers.set("Cache-Control", PAGE_CACHE_CONTROL);
    if (isMarkdown && response.status === 200) {
      response.headers.set("Content-Type", "text/markdown; charset=utf-8");
    }
  } else if (response.status === 200) {
    response.headers.set("Content-Type", 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
  }
  return response;
}

function conditionalMatch(request, response) {
  const ifNoneMatch = request.headers.get("If-None-Match");
  const etag = response.headers.get("ETag");
  if (!ifNoneMatch || !etag) return false;
  return ifNoneMatch.split(",").some((tag) => {
    const trimmed = tag.trim();
    return trimmed === "*" || trimmed === etag || trimmed === `W/${etag}` || `W/${trimmed}` === etag;
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const isPage = PAGE_PATTERN.test(path);
    const readable = request.method === "GET" || request.method === "HEAD";
    if (!readable || (!isPage && path !== "/.well-known/api-catalog")) {
      return env.ASSETS.fetch(request);
    }

    const wantMarkdown = isPage && prefersMarkdown(request.headers.get("Accept") ?? "");
    const edgeCache = typeof caches !== "undefined" && caches?.default ? caches.default : null;
    // Key the Workers edge cache explicitly by raw pathname + variant and ignore
    // client-side search params so HTML, Markdown, and trailing-slash redirects never collide.
    const cacheKey = edgeCache
      ? new Request(`${url.origin}${url.pathname}?__v=${isPage ? (wantMarkdown ? "md" : "html") : "cat"}`, { method: "GET" })
      : null;

    if (cacheKey) {
      const cached = await edgeCache.match(cacheKey);
      if (cached) {
        const clientResponse = withVariantHeaders(cached, request.method, isPage, wantMarkdown);
        if (conditionalMatch(request, clientResponse)) {
          return new Response(null, { status: 304, headers: clientResponse.headers });
        }
        return clientResponse;
      }
    }

    let response;
    let servedMarkdown = false;
    if (wantMarkdown) {
      const mdUrl = new URL(url);
      mdUrl.pathname = `/markdown${path === "/" ? "/index" : path}.md`;
      mdUrl.search = "";
      response = await env.ASSETS.fetch(new Request(mdUrl, { method: request.method }));
      if (response.status === 200) {
        servedMarkdown = true;
      } else {
        response = await env.ASSETS.fetch(request);
      }
    } else {
      response = await env.ASSETS.fetch(request);
    }

    const clientResponse = withVariantHeaders(response, request.method, isPage, servedMarkdown);

    if (cacheKey && request.method === "GET" && clientResponse.status === 200) {
      const toCache = new Response(clientResponse.clone().body, clientResponse);
      toCache.headers.set("Cache-Control", EDGE_CACHE_CONTROL);
      const put = edgeCache.put(cacheKey, toCache);
      if (ctx?.waitUntil) ctx.waitUntil(put);
      else await put;
    }

    return clientResponse;
  },
};
