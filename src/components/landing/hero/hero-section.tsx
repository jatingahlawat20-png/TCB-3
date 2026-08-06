import { Container } from "@/components/ui/container";

import { HeroBackground } from "./hero-background";
import { HeroButtons } from "./hero-buttons";
import { HeroContent } from "./hero-content";
import { HeroStats } from "./hero-stats";
import { HeroVisuals } from "./hero-visuals";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      <HeroBackground />

      <Container>
        <div className="grid items-center gap-20 lg:grid-cols-2">

          <div className="relative z-10">

            <HeroContent />

            <div className="mt-10">
              <HeroButtons />
            </div>

            <HeroStats />

          </div>

          <HeroVisuals />

        </div>
      </Container>
    </section>
  );
}