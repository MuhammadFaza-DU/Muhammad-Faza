import Link from "next/link";
import { skillsData } from "@/data/skillsData";

export default function SkillPage() {
  const [core, side] = skillsData;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <section className="panel rounded-3xl p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="mt-3 text-3xl font-semibold text-zinc-50 md:text-4xl">Skill Matrix</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300/90">
              On this page, you will find out who I am, from the main role to the supporting role.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge-accent rounded-full px-3 py-1 text-xs font-medium">Hardware Engineer</span>
            <span className="badge rounded-full px-3 py-1 text-xs font-medium">Shoftware Engineer</span>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="panel rounded-3xl p-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{core.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300/90">{core.subtitle}</p>
            </div>
            {core.badge ? (
              <span className="badge-accent rounded-full px-3 py-1 text-xs font-semibold">{core.badge}</span>
            ) : null}
          </div>

          <div className="mt-7 grid gap-4">
            <div className="panel-soft rounded-2xl p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">ROLES</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {core.roles.map((r) => (
                  <span key={r} className="badge-accent rounded-full px-3 py-1 text-xs font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel-soft rounded-2xl p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">SKILLS</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {core.skills.map((s) => (
                  <span key={s} className="badge-accent rounded-full px-3 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel rounded-3xl p-7">
          <div>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-50">{side.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300/90">{side.subtitle}</p>
          </div>

          <div className="mt-7 grid gap-4">
            <div className="panel-soft rounded-2xl p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">ROLE</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {side.roles.map((r) => (
                  <span key={r} className="badge rounded-full px-3 py-1 text-xs font-medium">
                    {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="panel-soft rounded-2xl p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-zinc-400">SKILLS</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {side.skills.map((s) => (
                  <span key={s} className="badge rounded-full px-3 py-1 text-xs font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}

