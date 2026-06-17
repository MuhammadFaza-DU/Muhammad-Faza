export default function HeroSection() {
  return (
    <section className="grid gap-10 md:grid-cols-2 md:items-center">
      <div className="relative">
        <div className="panel relative overflow-hidden rounded-3xl p-7">
          <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 via-transparent to-sky-400/10" />
          <div className="relative">
            <div />

            <div className="mt-10 grid place-items-center">
              <div className="relative grid h-56 w-56 place-items-center md:h-72 md:w-72">
                <div className="absolute inset-0 rounded-full border border-white/10 bg-black/30 blur-[0.5px]" />
                <div className="absolute -inset-3.5 rounded-full border border-emerald-400/20" />
                <div className="absolute -inset-7 rounded-full border border-white/6" />
                <div className="absolute inset-0 rounded-full bg-linear-to-b from-emerald-500/12 to-transparent" />
                <div className="spin-tilt absolute inset-0 rounded-full" />
                <div className="float relative grid h-60 w-60 place-items-center overflow-hidden rounded-full border border-white/10 bg-black/40 shadow-[0_16px_60px_rgba(0,0,0,.55)] md:h-60 md:w-60">
                  <img src="/assets/icon/icon/mf_fix2.svg" alt="Logo MF" className="h-full w-full object-contain p-3" />
                </div>
                <div className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]" />
              </div>
            </div>

            <div className="mt-9 grid grid-cols-3 gap-3">
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">ENV</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Hybrid</p>
              </div>
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">EXPERTISE</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Hardware & Software</p>
              </div>
              <div className="panel-soft rounded-2xl p-3">
                <p className="font-mono text-[11px] text-zinc-400">STATUS</p>
                <p className="mt-1 text-sm font-medium text-emerald-200">Available</p>
              </div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <div>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-zinc-50 md:text-5xl">
          Hi, I’m <span className="text-emerald-300">Muhammad Faza</span>
        </h1>
        <p className="mt-4 text-sm font-light leading-relaxed text-zinc-200/80 md:text-base">
          Computer Engineer | AI Engineer | Embedded AI | Web Developer
        </p>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-zinc-300/90">
          Hardware & Software Engineer dedicated to building end-to-end intelligent systems. I bridge physical devices with digital ecosystems through the integration of Embedded AI, firmware, IoT, and modern web architecture. Focusing on efficiency and scalability, I'm ready to bring ideas to life, from hardware circuit design to ready-to-use application deployment.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className="badge-accent rounded-full px-3 py-1 text-sm">Python</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm">C / C++</span>
          <span className="badge-accent rounded-full px-3 py-1 text-sm">MySQL</span>
          <span className="badge rounded-full px-3 py-1 text-sm">Next.js</span>
          <span className="badge rounded-full px-3 py-1 text-sm">Tailwind</span>
          <span className="badge rounded-full px-3 py-1 text-sm">Node.js</span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
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
          </a>

          <a
            href="/project"
            className="btn focus-ring inline-flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-medium text-zinc-100"
          >
            <span className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-zinc-200">
                →
              </span>
              Project
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
