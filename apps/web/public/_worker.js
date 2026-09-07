const discoveryLinks = [
  '</.well-known/api-catalog>; rel="api-catalog"',
  '</openapi.json>; rel="service-desc"; type="application/json"',
  '</api-docs.md>; rel="service-doc"; type="text/markdown"',
].join(", ");

export function prefersMarkdown(accept = "") {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const isPage = /^(\/|\/(zh|ja)|(?:\/(zh|ja))?\/skills\/[^/]+)$/.test(path);
    const readable = request.method === "GET" || request.method === "HEAD";
    if (!readable || (!isPage && path !== "/.well-known/api-catalog")) {
      return env.ASSETS.fetch(request);
    }

    let response;
    if (isPage && prefersMarkdown(request.headers.get("Accept") ?? "")) {
      url.pathname = `/markdown${path === "/" ? "/index" : path}.md`;
      url.search = "";
      response = await env.ASSETS.fetch(new Request(url, { method: request.method }));
      if (response.status === 200) {
        response = new Response(response.body, response);
        response.headers.set("Content-Type", "text/markdown; charset=utf-8");
      } else {
        response = await env.ASSETS.fetch(request);
      }
    } else {
      response = await env.ASSETS.fetch(request);
    }
    response = new Response(request.method === "HEAD" ? null : response.body, response);
    response.headers.set("Link", discoveryLinks);
    if (isPage) {
      response.headers.append("Vary", "Accept");
      // Cloudflare's default cache key does not distinguish Accept variants.
      response.headers.set("Cache-Control", "private, no-store");
    } else if (response.status === 200) {
      response.headers.set("Content-Type", 'application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"');
    }
    return response;
  },
};
