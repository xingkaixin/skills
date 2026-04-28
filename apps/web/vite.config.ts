import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { skillsData } from "./src/data/skills.generated";

function sitemapPlugin(): Plugin {
  return {
    name: "sitemap",
    generateBundle() {
      const siteUrl = "https://skills.xingkaixin.me";
      const now = new Date().toISOString().split("T")[0];

      const urls = [
        `  <url>\n    <loc>${siteUrl}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>`,
        ...skillsData.map(
          (skill) =>
            `  <url>\n    <loc>${siteUrl}/skills/${skill.slug}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
        ),
      ];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;

      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: xml });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemapPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
