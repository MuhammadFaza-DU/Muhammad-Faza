import { useEffect, useState } from "react";
import GooeyNav, { type GooeyNavItem } from "../reference/GooeyNav";

interface Props {
  items: GooeyNavItem[];
  active: "home" | "project" | "contact";
  label: string;
}

export default function GooeyNavigation({ items, active, label }: Props) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const update = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);
  return <GooeyNav items={items} activeIndex={active === "project" ? 1 : active === "contact" ? 2 : 0}
    ariaLabel={label} theme={theme} color={theme === "dark" ? "#F5F5F5" : "#101010"}
    activeTextColor={theme === "dark" ? "#0A0A0A" : "#FFFFFF"} frame={false} />;
}
