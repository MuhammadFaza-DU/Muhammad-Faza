import Link from "next/link";
const SOCIAL = [
  {
    href: "https://www.instagram.com/mfaz.aa?igsh=MWVlMDdrbDVjZzhjYg==",
    label: "Instagram",
    handle: "@mfaz.aa",
    icon: "/assets/icon/icon/instagram.svg",
  },
  {
    href: "mailto:lexfaza@gmail.com",
    label: "Email",
    handle: "lexfaza@gmail.com",
    icon: "/assets/icon/icon/email.svg",
  },
  {
    href: "https://github.com/MuhammadFaza-DU",
    label: "GitHub",
    handle: "/MuhammadFaza-DU",
    icon: "/assets/icon/icon/github.svg",
  },
  {
    href: "https://www.linkedin.com/in/m-faza-443479372",
    label: "LinkedIn",
    handle: "/m-faza",
    icon: "/assets/icon/icon/linkedin.svg",
  },
  {
    href: "https://www.youtube.com/@MuhammadFaza-justone",
    label: "YouTube",
    handle: "@MuhammadFaza",
    icon: "/assets/icon/icon/youtube.svg",
  },
  {
    href: "https://www.tiktok.com/@mfaz.aa?is_from_webapp=1&sender_device=pc",
    label: "TikTok",
    handle: "@mfaz.aa",
    icon: "/assets/icon/icon/tiktok.svg",
  },
] as const;

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <section className="panel rounded-3xl p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-4xl">Let’s Talk</h1>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-3xl p-7">
          <h2 className="mt-3 text-2xl font-semibold text-zinc-50">Social Profiles</h2>
          <p className="mt-3 text-sm leading-relaxed text-zinc-300/90">Click the icon to open my social media profiles.</p>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SOCIAL.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="btn focus-ring cursor-target group rounded-3xl px-5 py-6 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/35">
                    <img src={s.icon} alt="" className="h-5 w-5" />
                  </span>
                  <img
                    src="/assets/icon/icon/external.svg"
                    alt=""
                    className="h-5 w-5 opacity-80 group-hover:opacity-100"
                  />
                </div>
                <p className="mt-4 text-sm font-semibold text-zinc-100">{s.label}</p>
                <p className="mt-1 font-mono text-[11px] text-zinc-400">{s.handle}</p>
              </a>
            ))}
          </div>
        </div>

        <div className="panel rounded-3xl p-7">
          <h2 className="mt-3 text-2xl font-semibold text-zinc-50">Prefer channel?</h2>
          <p className="mt-8 text-sm leading-relaxed text-zinc-300/90">
            Contact me via Instagram or Email for work purposes. However, if you'd like to see my footprint in the tech world, you can visit all of my social media channels.
          </p>

          <div className="mt-11 grid gap-9">
            <div className="panel-soft rounded-2xl p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">AVAILABILITY</p>
              <p className="mt-2 text-sm text-zinc-200/90">Open for: Full-time / Freelance / Collaboration</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge-accent rounded-full px-3 py-1 text-xs font-medium">Looking for Hire</span>
                <span className="badge rounded-full px-3 py-1 text-xs font-medium">Remote</span>
                <span className="badge rounded-full px-3 py-1 text-xs font-medium">Hybrid</span>
              </div>
            </div>

            <a
              href="/assets/documents/Resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary focus-ring inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-emerald-100"
            >
              <span className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                  ↓
                </span>
                Download Resume
              </span>
              <span className="font-mono text-xs text-emerald-200/80">→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

