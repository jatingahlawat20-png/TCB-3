import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <Link
      aria-label="TCB-3 home"
      className={cn("inline-flex items-center gap-3", className)}
      href="/"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-foreground/12 bg-foreground text-background shadow-soft">
        <span className="grid h-5 w-5 grid-cols-3 items-end gap-1">
          <span className="h-3 rounded-full bg-accent" />
          <span className="h-5 rounded-full bg-background" />
          <span className="h-4 rounded-full bg-background/70" />
        </span>
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-lg font-semibold tracking-[-0.05em] text-foreground">
          TCB-3
        </span>
        {!compact ? (
          <span className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
            Human-led coaching
          </span>
        ) : null}
      </span>
    </Link>
  );
}
