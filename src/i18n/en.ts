import type { SiteCopy } from "./types.ts";

const contactSentences = [
  "I'm open to full-time work, freelance projects, and collaboration.",
  "Let's discuss what you need.",
] as const;

export const en: SiteCopy = {
  stats:{label:"Portfolio in numbers",projects:"Projects",years:"Years active",technologies:"Technologies",since:"Since"},
  hiring:{
    title:"Let's build your next project.",
    introduction:"I can help you develop Web Apps, Mobile Apps, Machine Learning systems, and Embedded Systems. I also integrate software and hardware to meet the needs of the system you want to build.",
    opportunities:"I'm available for full-time work, freelance projects, and remote or hybrid collaboration. Browse my projects to see my work, or read my resume to learn about my background.",
    rolesLabel:"Roles I'm open to",projectsAction:"View projects",
    roles:["Computer Engineer","AI Engineer","Embedded AI","Web Developer","App Developer","End-to-End Builder"],
  },
  lanyard: { flip:"Flip card", instruction:"Drag and release the card. Click or use the button to flip it." },
  nav: { home: "Home", project: "Projects", contact: "Contact", label: "Main navigation" },
  intro: {
    greeting: "Hi, I'm", name: "Muhammad Faza", role: "AI, Software, & Embedded Systems",
    paragraphs: [
      "I develop Web Apps, Mobile Apps, Machine Learning systems, and Embedded Systems. I integrate software and hardware to address specific problems, working as a Systems Engineer or a Specialist Engineer according to what your product needs.",
      "I take responsibility for the work I start and commit to seeing it through. I learn from failures, welcome feedback, and keep improving my skills and the quality of my work.",
    ],
    motto: "1.0001 is better than 1",
  },
  actions: { work: "View my work", contact: "Contact me", resume: "View resume", detail: "View project", allProjects: "All projects", back: "Back to projects" },
  preferences: { language: "Language", theme: "Theme", light: "Light", dark: "Dark", menu:"Language and theme" },
  skills: {
    title: "From ideas to systems.",
    lead: "These are the tools and technologies I use. Select one to read what it does.",
    technologies: "Languages & technologies", tools: "Tools",
    armor: "View armor", portrait: "View portrait", pause: "Pause animation", resume: "Resume animation",
    all: "View all tools & technologies", closeAll: "Close list", close: "Close explanation", open: "Open explanation",
    select: "Select a tool or technology to read its explanation.",
    pausedPanel: "Paused while the explanation is open.", pausedList: "Paused while the list is open.",
    pausedManual: "Animation paused.", pausedInteraction: "Paused while interacting with an item.",
    unavailable: "The armor could not load. The normal portrait is still available.",
  },
  work: { title: "Featured projects.", mediaUnavailable: "Preview unavailable." },
  contact: {
    title: "Have something in mind?",
    lead: contactSentences.join(" "), leadSentences: contactSentences,
    send: "Send an email", copy: "Copy email", copied: "Email copied.",
    copyFailed: "The email address could not be copied. Select the address above to copy it manually.",
    profiles: "Find me here.",
    profilesLead: "You can contact me by email or Instagram. I also share my projects and how I work on the profiles below.",
    availability: "Open to working together.",
    availabilityText: "Full-time, freelance, and collaboration. Remote or hybrid.",
    preferred: "Have an idea or a team opening? Email is the most direct place to start.",
  },
  catalog: {
    category: "Project category", emptyTitle: "No matching projects yet.",
    emptyCategory: "There are no projects in this category yet. Choose another category or show all projects.",
    mediaError: "The image could not load. Open the project to read its summary.",
    title: "Projects", lead: "Applications, experiments, and tools I work on.",
    search: "Search projects", placeholder: "Name, technology, or summary", reset: "Reset search",
    empty: "No projects match. Try another term or reset the search.", count: "projects",
    noJs: "All projects are shown. Enable JavaScript to use search and filters.",
  },
  categories: { all: "All", web: "Web", app: "App", hardware: "Hardware", hybrid: "Hybrid", tools: "Tools" },
  detail: { purpose: "About the project", stack: "Technologies", evidence: "Evidence & materials", development: "Process & development", source: "View source", landing: "Visit landing", demo: "Open demo", download: "Download", contribution: "Contribution" },
  common: { skip: "Skip to content", copyright: "Muhammad Faza", navScroll: "Scroll within the menu to see every link.", notFound: "Page not found.", notFoundBody: "This address is unavailable. Return Home or browse the projects." },
};
