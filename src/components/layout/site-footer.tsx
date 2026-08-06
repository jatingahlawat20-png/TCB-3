import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { Container } from "@/components/ui/container";
import { footerGroups, siteConfig } from "@/data/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-[#ece7de]/75">
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-5">
            <BrandMark />
            <div className="max-w-xl space-y-3 text-sm leading-7 text-muted sm:text-base">
              <p>{siteConfig.description}</p>
              <p>
                Built for clients, professional trainers, and accountable
                platform operations from day one.
              </p>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            {footerGroups.map((group) => (
              <div className="space-y-4" key={group.title}>
                <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  {group.title}
                </h2>
                <ul className="space-y-3 text-sm text-foreground/85">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        className="transition-colors hover:text-foreground"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-sm text-muted">
          <p>
            {new Date().getFullYear()} TCB-3. Trainers coach. The platform
            supports discovery, trust, and communication.
          </p>
        </div>
      </Container>
    </footer>
  );
}
