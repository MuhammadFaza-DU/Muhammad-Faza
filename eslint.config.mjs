import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "archive/**", "assets/**", "dist/**", ".astro/**", "**/.wrangler/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,astro}"],
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        console: "readonly", process: "readonly", Buffer: "readonly",
        URL: "readonly", fetch: "readonly", AbortSignal: "readonly", window: "readonly",
        document: "readonly", navigator: "readonly", localStorage: "readonly",
        matchMedia: "readonly", requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly", ResizeObserver: "readonly",
        IntersectionObserver: "readonly", HTMLElement: "readonly",
        HTMLInputElement: "readonly", CustomEvent: "readonly",
        setTimeout: "readonly", clearTimeout: "readonly",
      },
    },
  },
];
