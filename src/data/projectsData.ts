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
    title: "Hire Ready Portfolio",
    type: "demo",
    href: "muhammadfaza.vercel.app",
    description: "This website is designed to document my projects, technical skills, and professional experience in Computer Engineering, Artificial Intelligence, Embedded Intelligence, and Web Development.",
    tech: ["Next.js", "Tailwind"],
    tag: "LIVE DEMO",
  },
];

