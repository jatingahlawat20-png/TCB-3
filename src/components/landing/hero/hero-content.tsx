import { Badge } from "@/components/ui/badge";

export function HeroContent() {
  return (
    <div className="relative z-10 max-w-3xl space-y-8">
      <Badge>
        Premium platform for real coaching relationships
      </Badge>

      <div className="space-y-6">
        <h1 className="text-6xl font-black leading-[0.9] tracking-[-0.06em] text-white md:text-7xl xl:text-8xl">
          Find the
          <br />
          <span className="text-[#7CFF3B]">
            Right Trainer.
          </span>
        </h1>

        <p className="max-w-2xl text-lg leading-8 text-gray-300 md:text-xl">
          TCB-3 connects clients with certified fitness trainers,
          nutrition experts and transformation coaches through one
          premium platform designed for real coaching.
        </p>
      </div>
    </div>
  );
}