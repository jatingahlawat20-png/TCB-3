"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PackageItem = {
  id: string;
  name: string;
  description: string;
  duration: string;
  price: number;
  benefits: string[];
  active: boolean;
  createdAt: Date | string;
};

type PackageManagerProps = {
  initialPackages: PackageItem[];
};

export function PackageManager({ initialPackages }: PackageManagerProps) {
  const router = useRouter();
  const [packages, setPackages] = useState<PackageItem[]>(initialPackages);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageItem | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("1 Month");
  const [price, setPrice] = useState("999");
  const [benefitsText, setBenefitsText] = useState(
    "Custom workout split\nNutrition macro targets\nWeekly form check reviews\nDirect in-app messaging"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setDuration("1 Month");
    setPrice("999");
    setBenefitsText(
      "Custom workout split\nNutrition macro targets\nWeekly form check reviews\nDirect in-app messaging"
    );
    setIsCreating(false);
    setEditingPkg(null);
    setError("");
  };

  const handleOpenEdit = (pkg: PackageItem) => {
    setEditingPkg(pkg);
    setName(pkg.name);
    setDescription(pkg.description);
    setDuration(pkg.duration);
    setPrice(String(pkg.price));
    setBenefitsText(pkg.benefits.join("\n"));
    setIsCreating(true);
    setError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const benefits = benefitsText
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    try {
      if (editingPkg) {
        // Edit existing package
        const res = await fetch(`/api/trainer/packages/${editingPkg.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            duration,
            price: Number(price),
            benefits,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update package");

        setPackages((prev) =>
          prev.map((p) => (p.id === editingPkg.id ? data.package : p))
        );
        setSuccessMsg("Package updated successfully!");
      } else {
        // Create new package
        const res = await fetch("/api/trainer/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            duration,
            price: Number(price),
            benefits,
            active: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create package");

        setPackages((prev) => [data.package, ...prev]);
        setSuccessMsg("New coaching package created!");
      }

      setTimeout(() => {
        resetForm();
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "Failed to save package");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (pkg: PackageItem) => {
    try {
      const res = await fetch(`/api/trainer/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !pkg.active }),
      });
      const data = await res.json();
      if (res.ok) {
        setPackages((prev) =>
          prev.map((p) => (p.id === pkg.id ? { ...p, active: !p.active } : p))
        );
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to toggle active status:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Coaching Packages</h2>
          <p className="text-sm text-gray-400">
            Create and manage the tiers and options clients can select when booking coaching.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => {
              resetForm();
              setIsCreating(true);
            }}
            className="rounded-2xl bg-[#7CFF3B] px-6 py-3 text-sm font-bold text-black transition hover:scale-105 hover:bg-[#68e326] hover:shadow-[0_0_20px_rgba(124,255,59,0.3)]"
          >
            + Create New Package
          </button>
        )}
      </div>

      {/* Create / Edit Form Modal/Card */}
      {isCreating && (
        <div className="rounded-[32px] border border-[#7CFF3B]/30 bg-[#11161D] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingPkg ? `Edit Package: ${editingPkg.name}` : "Create New Coaching Package"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-gray-400 hover:text-white"
            >
              ✕ Cancel
            </button>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="mb-6 rounded-2xl border border-[#7CFF3B]/30 bg-[#7CFF3B]/10 p-4 text-sm text-[#7CFF3B] font-semibold">
              ✓ {successMsg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Package Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 1-on-1 Monthly Coaching"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3 text-white outline-none focus:border-[#7CFF3B]"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="12 Months">12 Months</option>
                  <option value="Custom Duration">Custom Duration</option>
                </select>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Price (₹ INR)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="999"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                  Short Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Complete personalized strength programming"
                  className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3 text-white outline-none focus:border-[#7CFF3B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">
                Features & Benefits (one per line)
              </label>
              <textarea
                rows={4}
                required
                value={benefitsText}
                onChange={(e) => setBenefitsText(e.target.value)}
                placeholder="Personalized training program&#10;Weekly video form checks&#10;Nutrition macro targets"
                className="w-full rounded-2xl border border-white/10 bg-[#0B0F14] px-5 py-3 text-white outline-none focus:border-[#7CFF3B]"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-sm font-bold text-black transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
              >
                {loading ? "Saving..." : editingPkg ? "Update Package" : "Publish Package"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white hover:border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Packages Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`flex flex-col justify-between rounded-[32px] border p-7 transition ${
              pkg.active
                ? "border-white/10 bg-[#11161D] hover:border-[#7CFF3B]/40"
                : "border-white/5 bg-[#11161D]/50 opacity-60"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    pkg.active
                      ? "bg-[#7CFF3B]/10 text-[#7CFF3B] border border-[#7CFF3B]/30"
                      : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                  }`}
                >
                  {pkg.active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs font-semibold text-gray-400">
                  {pkg.duration}
                </span>
              </div>

              <h3 className="mt-3 text-xl font-bold text-white">{pkg.name}</h3>
              <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                {pkg.description}
              </p>

              <div className="mt-4 border-y border-white/10 py-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-white">₹{pkg.price}</span>
                  <span className="text-xs text-gray-400">/{pkg.duration}</span>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {pkg.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <span className="text-[#7CFF3B]">✓</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => handleOpenEdit(pkg)}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-white transition hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
              >
                Edit Details
              </button>
              <button
                onClick={() => handleToggleActive(pkg)}
                className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
                  pkg.active
                    ? "border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                    : "border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
                }`}
              >
                {pkg.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
