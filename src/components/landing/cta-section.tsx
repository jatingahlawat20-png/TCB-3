import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";

export function CtaSection() {
  return (
    <section className="py-16 sm:py-20">
      <Container>
        <Panel className="overflow-hidden p-6 sm:p-8 lg:p-10" tone="strong">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                Start with the right relationship
              </p>

              <h2 className="max-w-2xl font-display text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl">
                TCB-3 is built to connect people with real coaches, not replace
                them.
              </h2>

              <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
                Browse trainer options, evaluate fit through the free chat
                window, and move into coaching through trainer-owned packages
                when the relationship is right.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link
                href="/trainers/apply"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-6 py-3 font-semibold text-white transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                For trainers
              </Link>

              <Link
                href="/trainers"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Browse trainers
              </Link>
            </div>
          </div>
        </Panel>
      </Container>
    </section>
  );
}