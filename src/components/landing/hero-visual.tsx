import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

const relationshipCards = [
  { label: "Primary coach", title: "Strength performance" },
  { label: "Support coach", title: "Mobility and recovery" },
];

const uploadLimits = [
  { label: "Images", value: "10 MB" },
  { label: "Video", value: "200 MB" },
  { label: "Documents", value: "25 MB" },
];

export function HeroVisual() {
  return (
    <Panel className="relative overflow-hidden p-5 sm:p-6" tone="strong">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(188,125,70,0.18),transparent_72%)]"
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Badge>Platform view</Badge>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.05em] text-foreground">
              One client, multiple real specialists.
            </h2>
          </div>
          <span className="rounded-full bg-[#e9f0eb] px-3 py-1 text-xs font-semibold text-success">
            Human-led
          </span>
        </div>

        <Panel className="p-4" tone="default">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                Client relationship
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                Complimentary chat starts the connection.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white px-3 py-2 text-right">
              <p className="text-xs font-medium text-muted">Chat access</p>
              <p className="text-sm font-semibold text-foreground">
                3 days free
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relationshipCards.map((card) => (
              <div
                className="rounded-2xl border border-border/70 bg-white/85 p-4"
                key={card.title}
              >
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
                  {card.label}
                </p>
                <p className="mt-3 text-base font-semibold text-foreground">
                  {card.title}
                </p>
              </div>
            ))}
          </div>
        </Panel>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <Panel className="p-4" tone="default">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              Relationship rules
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-foreground/82">
              <li>Trainer pricing and packages stay trainer-owned.</li>
              <li>
                Clients can purchase coaching before the free chat window ends.
              </li>
              <li>
                Active coaching keeps chat available without a separate trainer
                chat fee.
              </li>
            </ul>
          </Panel>

          <Panel className="p-4" tone="tinted">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.22em] text-muted">
              Shared media
            </p>
            <div className="mt-4 space-y-3">
              {uploadLimits.map((item) => (
                <div
                  className="flex items-center justify-between rounded-2xl border border-accent/20 bg-white/80 px-3 py-3 text-sm"
                  key={item.label}
                >
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="font-semibold text-accent-strong">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Panel>
  );
}
