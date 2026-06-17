import { projectsData } from "@/data/projectsData";

export default function ProjectPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <section className="panel rounded-3xl p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-50 md:text-4xl">Project Gallery</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300/90">
              This is proof of my journey to become a hybrid engineer.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-accent rounded-full px-3 py-1 text-xs font-medium">AI</span>
            <span className="badge-accent rounded-full px-3 py-1 text-xs font-medium">Embedded</span>
            <span className="badge-accent rounded-full px-3 py-1 text-xs font-medium">IoT</span>
            <span className="badge rounded-full px-3 py-1 text-xs font-medium">Web</span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projectsData.map((p) => (
          <a
            key={p.title}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            className="panel group rounded-3xl p-6 transition hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">{p.tag}</p>
                <h2 className="mt-2 text-lg font-semibold text-zinc-50">{p.title}</h2>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/30">
                <img
                  src={p.type === "github" ? "/assets/icon/icon/github.svg" : "/assets/icon/icon/external.svg"}
                  alt=""
                  className="h-5 w-5 opacity-90 group-hover:opacity-100"
                />
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-zinc-300/90">{p.description}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {p.tech.map((t) => (
                <span key={t} className="badge rounded-full px-3 py-1 text-xs">
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}

