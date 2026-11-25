import type { APIRoute } from "astro";
import { indexablePaths } from "../lib/seo.ts";

export const GET: APIRoute = ({ site }) => {
  const urls = indexablePaths().map(path => {
    const url = new URL(path, site).href.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
    return `  <url><loc>${url}</loc></url>`;
  });
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
