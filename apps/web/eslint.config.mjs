import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import { plugin as shadcn } from "@shadcn/lint";
import * as astroParser from "astro-eslint-parser";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist/**", "node_modules/**", ".astro/**", ".wrangler/**"]),
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx,mts,cts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
  { plugins: { shadcn } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  {
    files: ["src/**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: [".astro"] },
    },
    rules: {
      // Scan literals to cover Astro's class:list and frontmatter class strings.
      "shadcn/no-raw-colors": ["error", { scanAllStrings: true }],
      "shadcn/no-arbitrary-values": [
        "error",
        { deny: ["color"], scanAllStrings: true },
      ],
    },
  },
]);
