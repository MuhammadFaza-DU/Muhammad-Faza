import HeroSection from "@/components/HeroSection";
import StatsSection from "@/components/StatsSection";
import HiringSection from "@/components/HiringSection";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10">
      <HeroSection />
      <StatsSection />
      <HiringSection />
    </div>
  );
}

