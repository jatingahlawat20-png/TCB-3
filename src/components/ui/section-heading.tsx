import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SectionHeading({
  align = "left",
  description,
  eyebrow,
  title,
}: {
  align?: "center" | "left";
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl space-y-4",
        align === "center" && "mx-auto text-center",
      )}
    >
      <Badge>{eyebrow}</Badge>
      <div className="space-y-3">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
          {title}
        </h2>
        <p className="text-base leading-7 text-muted sm:text-lg">{description}</p>
      </div>
    </div>
  );
}
