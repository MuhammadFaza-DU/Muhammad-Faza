import Link from "next/link";

export default function HiringSection() {
  return (
    <section className="mt-16 grid gap-8 lg:items-stretch lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
      <div className="panel rounded-3xl p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="mt-3 text-4xl font-semibold text-zinc-50 md:text-5xl">Ready to Collaborate</h2>
            <p className="mt-10 max-w-xl text-sm leading-relaxed text-zinc-300/90">
              Looking for a hybrid engineer who bridges the gap between circuits and code? I build reliable hardware and power it with smart software, maintaining a clean and highly communicative approach. Let’s turn your vision into a finished product.
            </p>
          </div>
          <span className="badge-accent hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium sm:inline-flex">
            <span className="blink inline-block h-2 w-2 rounded-full bg-emerald-300" />
            Looking for Hire
          </span>
        </div>

        <div className="mt-18 flex flex-wrap gap-2">
          <span className="badge-accent rounded-full px-3 py-1 text-sm font-medium">Computer Engineer</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm font-medium">AI Engineer</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm font-medium">Embedded AI</span>
          <span className="badge rounded-full px-3 py-1 text-sm font-medium">Web Developer</span>
          <span className="badge rounded-full px-3 py-1 text-sm font-medium">End-to-End Builder</span>
        </div>
        
        <div className="mt-19 grid gap-3 sm:grid-cols-2">
          <Link
            href="/contact"
            //className="btn focus-ring inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-emerald-100"
            className="btn btn-primary focus-ring inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-emerald-100"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
                <img src="/assets/icon/icon/contact.svg" alt="" className="h-5 w-5" />
              </span>
              My Contact
            </span>
          </Link>
          <Link
            href="/skill"
            className="btn focus-ring inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-zinc-100"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-zinc-200">
                →
              </span>
              My Skill
            </span>
          </Link>
        </div>
      </div>

      <div className="panel rounded-3xl p-7">
        <div className="grid place-items-center">
          <div className="relative w-full max-w-sm aspect-9/16">
            <div className="absolute inset-0 overflow-hidden rounded-3xl border border-emerald-400/20 pulse-soft shadow-2xl shadow-emerald-500/30">
              <img
                src="/assets/images/FOTO%20TERKEREN.webp"
                alt="Foto profil Muhammad Faza"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-500/12 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-sky-500/10 blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
