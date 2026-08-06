import { HeroContent } from "./hero-content";
import { HeroVisual } from "./hero-visual";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow" />

      <div className="mx-auto flex min-h-[90vh] max-w-7xl items-center justify-between gap-20 px-6">

        <HeroContent />

        <HeroVisual />

      </div>
    </section>
  );
}