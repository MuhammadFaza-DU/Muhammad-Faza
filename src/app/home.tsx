import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import HiringSection from "@/components/HiringSection";
import Reveal from "@/components/Reveal";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <HeroSection />
      <Reveal>
        <StatsSection />
      </Reveal>
      <Reveal>
        <HiringSection />
      </Reveal>
    </div>
  );
}
