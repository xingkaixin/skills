import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import agentAssets from "./agent-assets";
import tailwindcss from "@tailwindcss/vite";
import { SITE_URL } from "./src/data/catalog";
import { DEFAULT_LOCALE, LOCALES } from "./src/i18n/config";

export default defineConfig({
  site: SITE_URL,
  integrations: [agentAssets()],
  output: "static",
  trailingSlash: "never",
  build: { format: "file" },
  i18n: {
    defaultLocale: DEFAULT_LOCALE,
    locales: [...LOCALES],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  },
});
