import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type PanelTone = "default" | "strong" | "tinted";

const toneClasses: Record<PanelTone, string> = {
  default: "border-border/70 bg-white/72 shadow-soft",
  strong: "border-border/80 bg-surface-strong shadow-card",
  tinted: "border-accent/25 bg-accent-soft/60 shadow-soft",
};

export function Panel({
  children,
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  tone?: PanelTone;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border backdrop-blur-sm",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
