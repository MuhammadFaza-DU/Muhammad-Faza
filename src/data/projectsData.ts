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
    href: "https://muhammadfaza.vercel.app",
    description: "This website is designed to document my projects, technical skills, and professional experience in Computer Engineering, Artificial Intelligence, Embedded Intelligence, and Web Development.",
    tech: ["Next.js", "Tailwind"],
    tag: "LIVE DEMO",
  },
  {
    title: "Codecraft Optimizer IDE Skill",
    type: "github",
    href: "https://github.com/MuhammadFaza-DU/codecraft-optimizer-ide",
    description: "A simple CLI-based text editor application created to simulate the working of a text editor with undo/redo and multi-tab features.",
    tech: ["Markdown"],
    tag: "GITHUB",
  },
  {
    title: "Brawl Buddies: Chaos Kitchen",
    type: "demo",
    href: "https://game-chef-pixel.pages.dev/",
    description: "A chaotic, high-energy 2.5D side-scrolling beat 'em up built entirely for the web browser. Imagine Scott Pilgrim vs. The World crashing headfirst into Overcooked!",
    tech: ["React", "Tailwind", "Node.js", "Phaser 3", "Howler.js", "Socket.io", "MySQL", "Redis"],
    tag: "LIVE DEMO",
  },
    {
    title: "Capify",
    type: "demo",
    href: "https://capify-v1-demo.vercel.app/",
    description: "Capify v1 Demo is an AI-powered web app that automatically generates subtitles for short videos. Upload an MP4, edit and customize subtitles, then export the final result as an MP4, SRT, or VTT file.",
    tech: ["React", "Tailwind", "Vite", "Zustand", "Node.js", "Fastify", "Zod", "FFmpeg"],
    tag: "LIVE DEMO",
  },
];
