import { projects } from "../data/projects.ts";
import { contactChannels } from "../data/contact.ts";

export function indexablePaths(): string[] {
  return ["id", "en"].flatMap(locale => [
    `/${locale}/`, `/${locale}/project/`, `/${locale}/contact/`,
    ...projects.map(project => `/${locale}/project/${project.slug}/`),
  ]);
}

const contentPaths = new Set(indexablePaths());

export function seoForPath(pathname: string): {
  canonicalPath: string;
  indexable: boolean;
  alternates: Record<string, string>;
} {
  const safe = pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/404/";
  const path = safe.endsWith("/") ? safe : `${safe}/`;
  const canonicalPath = path === "/" ? "/en/" : path;
  const indexable = contentPaths.has(canonicalPath);
  if (!indexable) return { canonicalPath, indexable, alternates: {} };
  const suffix = canonicalPath.slice(4);
  return {
    canonicalPath,
    indexable,
    alternates: {
      id: `/id/${suffix}`,
      en: `/en/${suffix}`,
      "x-default": suffix ? `/en/${suffix}` : "/",
    },
  };
}

export function identityGraph(origin: string) {
  const url = new URL("/", origin).href;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": `${url}#person`,
        name: "Muhammad Faza",
        alternateName: ["Faza", "mfazaa"],
        url,
        sameAs: contactChannels.filter(channel => channel.id !== "email").map(channel => channel.url),
      },
      {
        "@type": "WebSite",
        "@id": `${url}#website`,
        url,
        name: "Muhammad Faza Portfolio",
        alternateName: "mfazaa",
        inLanguage: ["id", "en"],
        publisher: { "@id": `${url}#person` },
      },
    ],
  };
}

export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
