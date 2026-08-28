import { Suspense } from "react";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { TrainerListing } from "@/components/marketplace/listing/trainer-listing";
import { getAllTrainers } from "@/lib/trainers";

export const dynamic = "force-dynamic";

export default async function TrainersPage() {
  const trainers = await getAllTrainers();

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      {/* Hero Header */}
      <div className="mx-auto max-w-7xl px-6 pt-16 md:px-8">
        <span className="rounded-full bg-[#7CFF3B]/10 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
          TCB-3 Marketplace
        </span>

        <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">
          Find Your Certified Coach.
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-400">
          Discover verified strength, fat loss, mobility, and hypertrophy specialists. Every coach offers a 3-day complimentary chat window.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-6 py-20 text-center text-gray-500">
            Loading coaches...
          </div>
        }
      >
        <TrainerListing initialTrainers={trainers} />
      </Suspense>

      <Footer />
    </main>
  );
}