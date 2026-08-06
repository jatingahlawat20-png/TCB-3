import { trainers } from "@/data/trainers";
import { TrainerCard } from "../trainer-card/trainer-card";

export function TrainerGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {trainers.map((trainer) => (
          <TrainerCard
            key={trainer.id}
            trainer={trainer}
          />
        ))}
      </div>
    </section>
  );
}