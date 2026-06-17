export type SkillCategory = {
  title: string;
  subtitle: string;
  badge?: string;
  roles: string[];
  skills: string[];
};

export const skillsData: SkillCategory[] = [
  {
    title: "Main Role & Core Skill",
    subtitle: "The most frequently used core competencies to deliver projects.",
    badge: "PRIORITY",
    roles: ["Computer Engineer", "AI Engineer", "Embedded Intelligence Builder"],
    skills: ["Python", "C++", "C", "Electronic Assembly"],
  },
  {
    title: "Side Role & Side Skill",
    subtitle: "Web skills to build clean, responsive, and deploy-ready interfaces.",
    roles: ["Web Developer"],
    skills: [
      "React.js",
      "Next.js",
      "Vite.js",
      "Node.js",
      "JavaScript",
      "TypeScript",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Database Management (MySQL)",
    ],
  },
];

