import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { trustPillars } from "@/data/site";

export function TrustSection() {
  return (
    <section className="py-16 sm:py-20" id="trust">
      <Container className="space-y-10">
        <SectionHeading
          description="The platform is designed to feel credible for serious clients and serious coaches. Trust is created through verification, transparent relationship rules, and accountable operations."
          eyebrow="Trust and safety"
          title="A stronger marketplace starts with clear guardrails."
        />

        <div className="grid gap-5 md:grid-cols-2">
          {trustPillars.map((pillar) => (
            <Panel className="p-6" key={pillar.title} tone="default">
              <div className="space-y-3">
                <h3 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
                  {pillar.title}
                </h3>
                <p className="text-sm leading-7 text-muted sm:text-base">
                  {pillar.description}
                </p>
              </div>
            </Panel>
          ))}
        </div>

        <Panel className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[0.9fr_1.1fr]" tone="tinted">
          <div className="space-y-3">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              Launch communication support
            </p>
            <h3 className="font-display text-3xl font-semibold tracking-[-0.06em] text-foreground">
              Coaching context can move in more than just text.
            </h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-accent/20 bg-white/85 p-4">
              <p className="font-semibold text-foreground">Text and images</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Progress updates, check-ins, and visual feedback in one thread.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-accent/20 bg-white/85 p-4">
              <p className="font-semibold text-foreground">Video updates</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Form review and async coaching context with 200 MB launch limits.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-accent/20 bg-white/85 p-4">
              <p className="font-semibold text-foreground">Documents and files</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Share assessments, references, or supporting files up to 25 MB.
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-accent/20 bg-white/85 p-4">
              <p className="font-semibold text-foreground">Reporting and review</p>
              <p className="mt-2 text-sm leading-6 text-muted">
                Admin tooling supports approvals, reports, and platform
                operations as the marketplace grows.
              </p>
            </div>
          </div>
        </Panel>
      </Container>
    </section>
  );
}
