import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { audienceCards } from "@/data/site";

export function AudienceSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container className="space-y-10">
        <SectionHeading
          align="center"
          description="The platform serves both sides of the coaching relationship while keeping the trainer's professional authority intact."
          eyebrow="Built for both sides"
          title="Clients get clarity. Trainers keep control."
        />

        <div className="grid gap-6 xl:grid-cols-2">
          {audienceCards.map((card) => (
            <Panel
              key={card.id}
              id={card.id}
              tone="strong"
              className="p-6 sm:p-8"
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                    {card.label}
                  </p>

                  <div className="space-y-3">
                    <h3 className="font-display text-3xl font-semibold tracking-[-0.06em] text-foreground">
                      {card.title}
                    </h3>

                    <p className="text-base leading-7 text-muted">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {card.features.map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-[1.4rem] border border-border/65 bg-white/72 p-4"
                    >
                      <h4 className="font-semibold text-foreground">
                        {feature.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-muted">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href={card.cta.href}
                  className={
                    card.cta.variant === "primary"
                      ? "inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
                      : "inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)]"
                  }
                >
                  {card.cta.label}
                </Link>
              </div>
            </Panel>
          ))}
        </div>
      </Container>
    </section>
  );
}