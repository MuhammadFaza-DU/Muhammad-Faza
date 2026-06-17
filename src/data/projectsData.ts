export type ProjectLinkType = "demo" | "github";

export type Project = {
  title: string;
  type: ProjectLinkType;
  href: string;
  description: string;
  tech: string[];
  tag: string;
};

export const projectsData: Project[] = [
  {
    title: "Mini Notepad C++",
    type: "github",
    href: "https://github.com/MuhammadFaza-DU/mini-notepad-cpp",
    description: "A simple CLI-based text editor application created to simulate the working of a text editor with undo/redo and multi-tab features.",
    tech: ["C++"],
    tag: "GITHUB",
  },
  {
    title: "Hire-Ready Portfolio",
    type: "demo",
    href: "https://example.com",
    description: "Template portofolio multi-page dengan pola desain dark tech, siap diisi konten dan deploy.",
    tech: ["HTML", "Tailwind", "Motion"],
    tag: "LIVE DEMO",
  },
];

