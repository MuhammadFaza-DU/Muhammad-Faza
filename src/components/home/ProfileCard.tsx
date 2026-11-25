import { useEffect, useState } from "react";
import ReferenceProfileCard from "../reference/ProfileCard";

export default function ProfileCard({ contactText, contactHref }: { contactText: string; contactHref: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return <ReferenceProfileCard name="Muhammad Faza" title="Hybrid Engineer"
    handle="MuhammadFaza-DU" status="" avatarUrl="/media/portrait/normal-768.webp"
    contactText={contactText} contactHref={contactHref} theme={theme}
    radius={16} holo={.8} glare={.5} tiltStrength={12} parallax={8}
    enableMobileTilt={false} className="faza-profile" />;
}
