import type { Metadata } from "next";
import HomePage from "./home";

export const metadata: Metadata = {
  title: {
    absolute: "Muhammad Faza — Computer Engineer, AI Engineer, Embedded AI & Web Developer",
  },
  description:
    "Hybrid engineer bridging hardware and software. Open for full-time, freelance, and collaboration.",
  alternates: { canonical: "/" },
};

export default function Page() {
  return <HomePage />;
}
