import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border/70 bg-white/70 px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
