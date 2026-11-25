import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://mfazaa.my.id",
  srcDir: "./src",
  publicDir: "./public",
  output: "static",
  trailingSlash: "always",
  integrations: [react()],
  server: { host: "127.0.0.1" },
  vite: { css: { postcss: { plugins: [] } } },
});
