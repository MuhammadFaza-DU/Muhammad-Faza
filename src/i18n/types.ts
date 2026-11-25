export interface SiteCopy {
  nav: { home: string; project: string; contact: string; label: string };
  intro: { greeting: string; name: string; role: string; paragraphs: string[]; motto: string };
  lanyard: { flip: string; instruction: string };
  stats: { label:string; projects:string; years:string; technologies:string; since:string };
  hiring: { title:string; introduction:string; opportunities:string; rolesLabel:string; projectsAction:string; roles:string[] };
  actions: { work: string; contact: string; resume: string; detail: string; allProjects: string; back: string };
  preferences: { language: string; theme: string; light: string; dark: string; menu:string };
  skills: {
    title: string; lead: string; technologies: string; tools: string;
    armor: string; portrait: string; pause: string; resume: string;
    all: string; closeAll: string; close: string; open: string; select: string;
    pausedPanel: string; pausedList: string; pausedManual: string; pausedInteraction: string;
    unavailable: string;
  };
  work: { title: string; mediaUnavailable: string };
  contact: {
    title: string; lead: string; leadSentences: readonly [string,string]; send: string; copy: string; copied: string; copyFailed: string;
    profiles: string; profilesLead: string; availability: string; availabilityText: string; preferred: string;
  };
  catalog: { title: string; lead: string; search: string; placeholder: string; reset: string; empty: string; count: string; noJs: string; category: string; emptyTitle: string; emptyCategory: string; mediaError: string };
  categories: Record<"all" | "web" | "app" | "hardware" | "hybrid" | "tools", string>;
  detail: { purpose: string; stack: string; evidence: string; development: string; source: string; landing: string; demo: string; download: string; contribution: string };
  common: { skip: string; copyright: string; navScroll: string; notFound: string; notFoundBody: string };
}
