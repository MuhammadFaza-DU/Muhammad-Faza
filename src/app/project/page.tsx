import type { Metadata } from "next";
import ProjectPage from "./project";

export const metadata: Metadata = {
  title: "Projects",
  description: "Project gallery of Muhammad Faza — proof of the journey toward becoming a hybrid engineer.",
  alternates: { canonical: "/project" },
};

export default function Page() {
  return <ProjectPage />;
}
