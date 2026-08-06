import Image from "next/image";

type Trainer = {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  clients: number;
  experience: string;
  price: number;
  image: string;
  tags: string[];
};

export function TrainerCard({ trainer }: { trainer: Trainer }) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#11161d] transition-all duration-300 hover:-translate-y-2 hover:border-lime-400">
      <Image
        src={trainer.image}
        alt={trainer.name}
        width={500}
        height={400}
        className="h-72 w-full object-cover"
      />

      <div className="space-y-5 p-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {trainer.name}
          </h2>

          <p className="text-gray-400">
            {trainer.specialty}
          </p>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-yellow-400">
            ⭐ {trainer.rating}
          </span>

          <span className="text-gray-400">
            {trainer.clients} Clients
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {trainer.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-lime-500/10 px-3 py-1 text-xs text-lime-400"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">
              Monthly
            </p>

            <h3 className="text-3xl font-bold text-white">
              ₹{trainer.price}
            </h3>
          </div>

          <button className="rounded-xl bg-lime-400 px-6 py-3 font-bold text-black transition hover:scale-105">
            View
          </button>
        </div>
      </div>
    </div>
  );
}