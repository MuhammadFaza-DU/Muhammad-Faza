const SOCIALS = [
  {
    href: "https://www.instagram.com/mfaz.aa?igsh=MWVlMDdrbDVjZzhjYg==",
    label: "Instagram",
    icon: "/assets/icon/icon/instagram.svg",
  },
  { href: "mailto:lexfaza@gmail.com", label: "Email", icon: "/assets/icon/icon/email.svg" },
  { href: "https://github.com/MuhammadFaza-DU", label: "GitHub", icon: "/assets/icon/icon/github.svg" },
  {
    href: "https://www.linkedin.com/in/m-faza-443479372",
    label: "LinkedIn",
    icon: "/assets/icon/icon/linkedin.svg",
  },
  { href: "https://www.youtube.com/@MuhammadFaza-justone", label: "YouTube", icon: "/assets/icon/icon/youtube.svg" },
  {
    href: "https://www.tiktok.com/@mfaz.aa?is_from_webapp=1&sender_device=pc",
    label: "TikTok",
    icon: "/assets/icon/icon/tiktok.svg",
  },
] as const;

export default function Footer() {
  return (
    <footer className="relative z-10 border-t hairline bg-black/25">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-center gap-4">
          {SOCIALS.map((s) => (
            <a
              key={s.href}
              className="focus-ring cursor-target inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/30 hover:opacity-90"
              href={s.href}
              target="_blank"
              rel="noreferrer"
              aria-label={s.label}
            >
              <img src={s.icon} alt="" className="h-5 w-5" />
            </a>
          ))}
        </div>
        <p className="mt-6 text-center font-mono text-xs text-zinc-400 md:text-center! md:[text-justify:auto]">
          © 2026 Muhammad Faza. Crafted with passion.
        </p>
      </div>
    </footer>
  );
}
