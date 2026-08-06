import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Container } from "@/components/ui/container";
import { publicNavigation } from "@/data/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/88 backdrop-blur-lg">
      <Container className="py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <BrandMark />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6">
            <nav aria-label="Primary" className="flex flex-wrap gap-2">
              {publicNavigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium text-muted transition-all duration-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/trainers/apply"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-3 font-semibold text-white transition-all duration-300 hover:border-[var(--primary)] hover:text-[var(--primary)]"
              >
                For trainers
              </Link>

              <Link
                href="/trainers"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Browse trainers
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
}