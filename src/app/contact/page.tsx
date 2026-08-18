import type { Metadata } from "next";
import ContactPage from "./contact";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Muhammad Faza via Instagram or email. Open for full-time, freelance, and collaboration.",
  alternates: { canonical: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
