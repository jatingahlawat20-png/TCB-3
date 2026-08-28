"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Trainer } from "@/data/trainers";
import { TrainerCard } from "../trainer-card/trainer-card";

const filters = [
  "All",
  "Weight Loss",
  "Muscle Gain",
  "Bodybuilding",
  "Powerlifting",
  "Yoga",
  "CrossFit",
  "Calisthenics",
  "Nutrition",
];

export function TrainerListing({
  initialTrainers = [],
}: {
  initialTrainers?: Trainer[];
}) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || searchParams.get("filter") || "All";

  const [trainersList, setTrainersList] = useState<Trainer[]>(initialTrainers);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  // If initialTrainers was empty on mount, fetch from API
  useEffect(() => {
    if (initialTrainers.length === 0) {
      fetch("/api/trainers")
        .then((res) => res.json())
        .then((data) => {
          if (data.trainers && data.trainers.length > 0) {
            setTrainersList(data.trainers);
          }
        })
        .catch(console.error);
    } else {
      setTrainersList(initialTrainers);
    }
  }, [initialTrainers]);

  useEffect(() => {
    if (initialCategory) {
      const matched = filters.find(
        (f) => f.toLowerCase() === initialCategory.toLowerCase()
      );
      if (matched) {
        setActiveFilter(matched);
      }
    }
  }, [initialCategory]);

  const filteredTrainers = useMemo(() => {
    return trainersList.filter((trainer) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        trainer.name.toLowerCase().includes(q) ||
        trainer.specialty.toLowerCase().includes(q) ||
        trainer.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        (trainer.bio && trainer.bio.toLowerCase().includes(q));

      const matchesFilter =
        activeFilter === "All" ||
        trainer.tags.some(
          (tag) => tag.toLowerCase() === activeFilter.toLowerCase()
        ) ||
        (activeFilter.toLowerCase() === "muscle gain" && trainer.specialty.toLowerCase().includes("strength")) ||
        (activeFilter.toLowerCase() === "weight loss" && trainer.specialty.toLowerCase().includes("fat loss"));

      return matchesSearch && matchesFilter;
    });
  }, [search, activeFilter, trainersList]);

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      {/* Search Input */}
      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search trainers by name, specialty, goal, or keywords..."
          className="w-full rounded-2xl border border-white/10 bg-[#11161d] px-6 py-4 text-white placeholder:text-gray-500 outline-none transition focus:border-[#7CFF3B] focus:shadow-[0_0_20px_rgba(124,255,59,0.15)]"
        />
      </div>

      {/* Filter Chips */}
      <div className="mb-10 flex flex-wrap gap-2.5">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              activeFilter.toLowerCase() === filter.toLowerCase()
                ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.3)]"
                : "border border-white/10 bg-[#11161d] text-gray-300 hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="mb-8 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing <span className="font-bold text-white">{filteredTrainers.length}</span> {filteredTrainers.length === 1 ? "coach" : "coaches"}
          {activeFilter !== "All" && (
            <span> in <span className="text-[#7CFF3B]">{activeFilter}</span></span>
          )}
        </p>
        {activeFilter !== "All" && (
          <button
            onClick={() => setActiveFilter("All")}
            className="text-xs text-gray-400 hover:text-white underline underline-offset-4"
          >
            Reset filter
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredTrainers.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredTrainers.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-[#11161d] py-20 text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white">
            No trainers found
          </h2>
          <p className="mt-2 text-gray-400 max-w-md mx-auto">
            We couldn't find any coaches matching "{search || activeFilter}". Try adjusting your filters or search keywords.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setActiveFilter("All");
            }}
            className="mt-6 rounded-xl bg-[#7CFF3B] px-6 py-2.5 text-sm font-bold text-black transition hover:scale-105"
          >
            Clear all filters
          </button>
        </div>
      )}
    </section>
  );
}