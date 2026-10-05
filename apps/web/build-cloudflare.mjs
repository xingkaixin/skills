import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const output = new URL("./.cloudflare/output/v0/", import.meta.url);
const worker = new URL("workers/default/", output);
await rm(output, { recursive: true, force: true });
await mkdir(new URL("bundle/", worker), { recursive: true });
await cp(new URL("./dist/", import.meta.url), new URL("assets/", worker), { recursive: true });
await cp(new URL("./worker.js", import.meta.url), new URL("bundle/worker.js", worker));
await writeFile(new URL("config.json", output), JSON.stringify({
  buildContext: { isPreview: false },
}, null, 2));
await writeFile(new URL("worker.config.json", worker), JSON.stringify({
  name: "skills",
  compatibilityDate: "2026-07-29",
  workersDev: true,
  domains: ["skills.xingkaixin.me"],
  assets: {
    htmlHandling: "drop-trailing-slash",
    notFoundHandling: "404-page",
    runWorkerFirst: ["/", "/skills/*", "/zh", "/zh/*", "/ja", "/ja/*", "/.well-known/api-catalog"],
  },
  env: { ASSETS: { type: "assets" } },
  manifest: {
    type: "complete",
    mainModule: "worker.js",
    modules: { "worker.js": { type: "esm" } },
  },
}, null, 2));
