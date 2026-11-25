export type Locale = "id" | "en";
export type PageKind = "home" | "project" | "detail" | "contact";
export interface PageContext {
  locale: Locale;
  page: PageKind;
  pathname: string;
  slug?: string;
}
export type Category = "web" | "app" | "hardware" | "hybrid" | "tools";
export type Localized<T> = Record<Locale, T>;

export interface ProjectContent {
  title: string;
  summary: string;
  status: string;
  purpose: string;
  contribution: string | null;
  workingEvidence: string[];
  development: string[];
}

export interface ProjectRecord {
  id: string;
  slug: string;
  category: Category;
  tags: string[];
  links: { kind: "landing" | "demo" | "source" | "download"; url: string; label?: Localized<string> }[];
  firstPublished: { date: string; sourceUrl: string } | null;
  evidence: {
    sourceUrl: string;
    checkedAt: string;
    kind: "source-inspected" | "runtime-checked" | "user-confirmed";
    scope: string;
  }[];
  thumbnailId: string;
  content: Localized<ProjectContent>;
}

export interface SkillRecord {
  id: string;
  name: string;
  group: "tool" | "technology";
  description: Localized<string>;
  assetId?: string;
}
