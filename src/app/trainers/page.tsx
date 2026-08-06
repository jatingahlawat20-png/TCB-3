import { SearchBar } from "@/components/marketplace/search/search-bar";
import { TrainerGrid } from "@/components/marketplace/listing/trainer-grid";

export default function TrainersPage() {
  return (
    <main className="min-h-screen bg-[#09090B]">
      <div className="mx-auto max-w-7xl px-6 pt-20">
        <h1 className="text-6xl font-black text-white">
          Find Your Trainer
        </h1>

        <p className="mt-5 max-w-2xl text-xl text-gray-400">
          Discover verified fitness professionals and start your transformation.
        </p>
      </div>

      <SearchBar />

      <TrainerGrid />
    </main>
  );
}