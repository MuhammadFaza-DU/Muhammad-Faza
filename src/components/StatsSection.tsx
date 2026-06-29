import { projectsData } from "@/data/projectsData";
import { skillsData } from "@/data/skillsData";

const START_YEAR = 2025;

export default function StatsSection() {
  const projectCount = projectsData.length;
  const techCount = skillsData.reduce((sum, g) => sum + g.skills.length, 0);
  const yearsActive = new Date().getFullYear() - START_YEAR;

  const stats = [
    {
      value: `${projectCount}+`,
      label: "Projects Built",
      note: "synced with gallery",
    },
    {
      value: yearsActive < 1 ? "< 1" : `${yearsActive}+`,
      label: "Years Active",
      note: `since ${START_YEAR}`,
    },
    {
      value: `${techCount}+`,
      label: "Technologies",
      note: "core & side stack",
    },
  ];

  return (
    <section className="my-20">
      <div className="h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent" />

      <div className="flex items-center py-10">
        {stats.map((s, i) => (
          <>
            {i > 0 && (
              <span key={`sep-${i}`} className="h-10 w-px shrink-0 bg-white/8" aria-hidden="true" />
            )}
            <div key={s.label} className="flex flex-1 flex-col items-center gap-2 text-center">
              <p
                className="text-2xl text-emerald-300 sm:text-4xl md:text-5xl"
                style={{ fontFamily: "var(--font-blackops)", letterSpacing: "0.02em" }}
              >
                {s.value}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                {s.label}
              </p>
            </div>
          </>
        ))}
      </div>

      <div className="h-px w-full bg-linear-to-r from-transparent via-white/8 to-transparent" />
    </section>
  );
}
