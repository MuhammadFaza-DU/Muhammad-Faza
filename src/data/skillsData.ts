export type SkillCategory = {
  title: string;
  subtitle: string;
  badge?: string;
  roles: string[];
  skills: string[];
};

export const skillsData: SkillCategory[] = [
  {
    title: "Hardware Skills",
    subtitle: "Hardware skills to design electronic systems, program microcontrollers, and deploy intelligent AI models on edge devices.",
    roles: ["Computer Engineer", "AI Engineer", "Embedded AI"],
    skills: ["Python", "C++", "C", "Electronic Assembly"],
  },
  {
    title: "Shoftware Skills",
    subtitle: "Software skills to design modern web interfaces, develop robust backend systems, and deploy scalable applications.",
    roles: ["Web Developer", "App Developer", "End-to-End Builder"],
    skills: [
      "Flutter",
      "JavaScript",
      "TypeScript",
      "React",
      "Next",
      "Vite",
      "Node",
      "Hono",
      "Express",
      "HTML5",
      "CSS3",
      "Tailwind CSS",
      "Database Management (SQL)",
    ],
  },
];

