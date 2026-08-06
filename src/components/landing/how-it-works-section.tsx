import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { howItWorksSteps } from "@/data/site";

export function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20" id="how-it-works">
      <Container className="space-y-10">
        <SectionHeading
          description="TCB-3 is designed around a simple relationship model: discover real trainers, validate fit through a short free chat period, and continue through trainer-owned coaching packages."
          eyebrow="How it works"
          title="A clear path from discovery to active coaching."
        />

        <div className="grid gap-5 lg:grid-cols-3">
          {howItWorksSteps.map((step, index) => (
            <Panel className="p-6" key={step.title} tone="default">
              <div className="space-y-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  0{index + 1}
                </span>
                <div className="space-y-3">
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-7 text-muted sm:text-base">
                    {step.description}
                  </p>
                </div>
              </div>
            </Panel>
          ))}
        </div>

        <p className="max-w-3xl text-sm leading-7 text-muted">
          Trainer-side messaging with active clients does not carry a separate
          chat fee. Chat availability follows the actual coaching relationship.
        </p>
      </Container>
    </section>
  );
}
