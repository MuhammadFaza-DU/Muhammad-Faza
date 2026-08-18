import type { Metadata } from "next";
import SkillPage from "./skill";

export const metadata: Metadata = {
  title: "Skills",
  description: "Skill matrix of Muhammad Faza — core roles and supporting skills across hardware, AI, and web development.",
  alternates: { canonical: "/skill" },
};

export default function Page() {
  return <SkillPage />;
}
