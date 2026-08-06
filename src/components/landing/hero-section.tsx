import Link from "next/link";
import { HeroVisual } from "@/components/landing/hero-visual";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  heroActions,
  heroSignals,
  platformStats,
  siteConfig,
} from "@/data/site";

export function HeroSection() {
  return (
    <section className="pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-5">
              <Badge>
                Premium platform for real coaching relationships
              </Badge>

              <div className="space-y-4">
                <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-[-0.07em] text-foreground sm:text-6xl lg:text-7xl">
                  {siteConfig.tagline}
                </h1>

                <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl">
                  TCB-3 connects clients with professional trainers who own the
                  coaching. Clients can browse profiles, start with a 3-day free
                  chat, and continue through each trainer&apos;s own coaching
                  package.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.variant === "primary"
                      ? "rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      : "rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }
                >
                  {action.label}
                </Link>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {heroSignals.map((signal) => (
                <div
                  key={signal.title}
                  className="rounded-[1.5rem] border border-border/65 bg-white/65 p-4 backdrop-blur-sm"
                >
                  <p className="font-display text-lg font-semibold tracking-[-0.04em] text-foreground">
                    {signal.title}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 border-t border-border/60 pt-6 sm:grid-cols-3">
              {platformStats.map((stat) => (
                <div key={stat.value}>
                  <p className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-muted">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <HeroVisual />
        </div>
      </Container>
    </section>
  );
}