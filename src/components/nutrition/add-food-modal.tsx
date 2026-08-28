"use client";

import { useState, useEffect } from "react";

export type FoodPreset = {
  name: string;
  category: string;
  servingAmount: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

export const COMMON_FOOD_PRESETS: FoodPreset[] = [
  { name: "Grilled Chicken Breast", category: "Poultry", servingAmount: 100, servingUnit: "g", calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0 },
  { name: "Large Whole Egg", category: "Dairy & Eggs", servingAmount: 1, servingUnit: "egg", calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0 },
  { name: "Liquid Egg Whites", category: "Dairy & Eggs", servingAmount: 100, servingUnit: "g", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, fiber: 0 },
  { name: "Whey Protein Powder", category: "Supplements", servingAmount: 1, servingUnit: "scoop (30g)", calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0 },
  { name: "Rolled Oats (Dry)", category: "Grains", servingAmount: 50, servingUnit: "g", calories: 187, protein: 6.5, carbs: 34, fat: 3.2, fiber: 5 },
  { name: "Jasmine White Rice (Cooked)", category: "Grains", servingAmount: 150, servingUnit: "g", calories: 195, protein: 4.1, carbs: 43, fat: 0.4, fiber: 0.6 },
  { name: "Brown Rice (Cooked)", category: "Grains", servingAmount: 150, servingUnit: "g", calories: 168, protein: 3.8, carbs: 35, fat: 1.4, fiber: 2.7 },
  { name: "Atlantic Salmon Fillet", category: "Fish", servingAmount: 150, servingUnit: "g", calories: 312, protein: 30, carbs: 0, fat: 20, fiber: 0 },
  { name: "Greek Yogurt 0% Fat", category: "Dairy & Eggs", servingAmount: 150, servingUnit: "g", calories: 88, protein: 15, carbs: 6, fat: 0, fiber: 0 },
  { name: "Natural Peanut Butter", category: "Nuts & Fats", servingAmount: 30, servingUnit: "g (2 tbsp)", calories: 188, protein: 8, carbs: 6, fat: 16, fiber: 2 },
  { name: "Sweet Potato (Baked)", category: "Tubers", servingAmount: 150, servingUnit: "g", calories: 135, protein: 3, carbs: 31, fat: 0.2, fiber: 4.5 },
  { name: "Fresh Banana", category: "Fruit", servingAmount: 1, servingUnit: "medium", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3.1 },
  { name: "Avocado", category: "Nuts & Fats", servingAmount: 50, servingUnit: "g (1/4 avo)", calories: 80, protein: 1, carbs: 4.3, fat: 7.3, fiber: 3.4 },
  { name: "Lean Ground Beef 90/10", category: "Meat", servingAmount: 150, servingUnit: "g", calories: 260, protein: 30, carbs: 0, fat: 15, fiber: 0 },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  defaultMealType?: string;
  initialFood?: any | null;
  onFoodSaved: (food: any) => void;
  loggedDate?: string;
};

export function AddFoodModal({
  isOpen,
  onClose,
  defaultMealType = "BREAKFAST",
  initialFood = null,
  onFoodSaved,
  loggedDate,
}: Props) {
  const [mealType, setMealType] = useState(defaultMealType);
  const [foodName, setFoodName] = useState("");
  const [servingAmount, setServingAmount] = useState<number>(1);
  const [servingUnit, setServingUnit] = useState("serving");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [fiber, setFiber] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [searchPreset, setSearchPreset] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Base preset state for clean multiplier scaling
  const [baseUnitMacros, setBaseUnitMacros] = useState<{
    baseServing: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialFood) {
        setMealType(initialFood.mealType || defaultMealType);
        setFoodName(initialFood.foodName || "");
        setServingAmount(initialFood.servingAmount || 1);
        setServingUnit(initialFood.servingUnit || "serving");
        setCalories(String(initialFood.calories || ""));
        setProtein(String(initialFood.protein || ""));
        setCarbs(String(initialFood.carbohydrates || ""));
        setFat(String(initialFood.fat || ""));
        setFiber(String(initialFood.fiber || ""));
        setNotes(initialFood.notes || "");
        setBaseUnitMacros(null);
      } else {
        setMealType(defaultMealType);
        setFoodName("");
        setServingAmount(1);
        setServingUnit("serving");
        setCalories("");
        setProtein("");
        setCarbs("");
        setFat("");
        setFiber("");
        setNotes("");
        setBaseUnitMacros(null);
      }
      setSearchPreset("");
      setErrorMessage("");
    }
  }, [isOpen, defaultMealType, initialFood]);

  if (!isOpen) return null;

  const handleSelectPreset = (p: FoodPreset) => {
    setFoodName(p.name);
    setServingAmount(p.servingAmount);
    setServingUnit(p.servingUnit);
    setCalories(String(p.calories));
    setProtein(String(p.protein));
    setCarbs(String(p.carbs));
    setFat(String(p.fat));
    setFiber(String(p.fiber));

    setBaseUnitMacros({
      baseServing: p.servingAmount,
      calories: p.calories,
      protein: p.protein,
      carbs: p.carbs,
      fat: p.fat,
      fiber: p.fiber,
    });
  };

  const handleServingAmountChange = (newAmount: number) => {
    setServingAmount(newAmount);

    if (newAmount <= 0) return;

    if (baseUnitMacros && baseUnitMacros.baseServing > 0) {
      const ratio = newAmount / baseUnitMacros.baseServing;
      setCalories(String(Math.round(baseUnitMacros.calories * ratio)));
      setProtein(String(Math.round(baseUnitMacros.protein * ratio * 10) / 10));
      setCarbs(String(Math.round(baseUnitMacros.carbs * ratio * 10) / 10));
      setFat(String(Math.round(baseUnitMacros.fat * ratio * 10) / 10));
      setFiber(String(Math.round(baseUnitMacros.fiber * ratio * 10) / 10));
    }
  };

  const handleQuickMultiplier = (multiplier: number) => {
    if (!baseUnitMacros) return;
    const newAmount = Math.round(baseUnitMacros.baseServing * multiplier * 10) / 10;
    setServingAmount(newAmount);
    setCalories(String(Math.round(baseUnitMacros.calories * multiplier)));
    setProtein(String(Math.round(baseUnitMacros.protein * multiplier * 10) / 10));
    setCarbs(String(Math.round(baseUnitMacros.carbs * multiplier * 10) / 10));
    setFat(String(Math.round(baseUnitMacros.fat * multiplier * 10) / 10));
    setFiber(String(Math.round(baseUnitMacros.fiber * multiplier * 10) / 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage("");

      if (!foodName.trim()) {
        throw new Error("Please enter a food name.");
      }

      if (calories === "" || isNaN(parseFloat(calories)) || parseFloat(calories) < 0) {
        throw new Error("Please enter valid calories (>= 0).");
      }

      const payload = {
        mealType,
        foodName: foodName.trim(),
        servingAmount: Number(servingAmount) || 1,
        servingUnit: servingUnit.trim() || "serving",
        calories: parseFloat(calories),
        protein: parseFloat(protein) || 0,
        carbohydrates: parseFloat(carbs) || 0,
        fat: parseFloat(fat) || 0,
        fiber: parseFloat(fiber) || 0,
        notes: notes.trim() || null,
        loggedDate,
      };

      const url = initialFood ? `/api/nutrition/food/${initialFood.id}` : `/api/nutrition/food`;
      const method = initialFood ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save food log.");
      }

      onFoodSaved(data.foodLog);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log food.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPresets = COMMON_FOOD_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(searchPreset.toLowerCase()) ||
    p.category.toLowerCase().includes(searchPreset.toLowerCase())
  );

  const mealTypeLabels: Record<string, string> = {
    BREAKFAST: "🍳 Breakfast",
    LUNCH: "🥗 Lunch",
    DINNER: "🥩 Dinner",
    SNACK: "🍎 Snack",
    PRE_WORKOUT: "⚡ Pre-Workout",
    POST_WORKOUT: "💪 Post-Workout",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#0B0F15] p-6 text-white shadow-2xl md:p-8 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div>
            <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-0.5 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
              {initialFood ? "Edit Logged Food" : "Meal & Food Logger"}
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">
              {initialFood ? "Update Food Entry" : "Log Food / Meal"}
            </h2>
            {loggedDate && (
              <p className="text-xs text-gray-400 mt-0.5">
                Logging for: <strong className="text-white">{loggedDate}</strong>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-2">
          {/* Meal Type Selector */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Select Meal Category
            </label>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {Object.entries(mealTypeLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMealType(key)}
                  className={`rounded-2xl py-2 px-1 text-center text-xs font-bold transition ${
                    mealType === key
                      ? "bg-[#7CFF3B] text-black shadow-[0_0_12px_rgba(124,255,59,0.3)] font-black"
                      : "bg-[#11161D] border border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Presets Library (Only in Add Mode) */}
          {!initialFood && (
            <div className="rounded-3xl border border-white/10 bg-[#11161D] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>⚡ Quick Fitness Food Presets</span>
                </p>
                <input
                  type="text"
                  value={searchPreset}
                  onChange={(e) => setSearchPreset(e.target.value)}
                  placeholder="Filter presets (e.g. Chicken, Rice)..."
                  className="rounded-xl border border-white/10 bg-[#0B0F15] px-2.5 py-1 text-xs text-white placeholder:text-gray-500 focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-300 hover:border-[#7CFF3B]/50 hover:bg-[#7CFF3B]/10 hover:text-white transition text-left"
                  >
                    <span className="font-semibold text-white">{preset.name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ({preset.calories} kcal • {preset.protein}g P)
                    </span>
                  </button>
                ))}
              </div>

              {/* Quick Multiplier Buttons if a preset is loaded */}
              {baseUnitMacros && (
                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 font-semibold">
                    Quick Multiplier ({baseUnitMacros.baseServing} {servingUnit}):
                  </span>
                  <div className="flex gap-1.5">
                    {[0.5, 1, 1.5, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleQuickMultiplier(m)}
                        className="rounded-lg bg-white/10 px-2 py-0.5 text-[10px] font-bold text-gray-200 hover:bg-[#7CFF3B] hover:text-black transition"
                      >
                        {m}x
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <form id="foodForm" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-gray-400">Food Name *</label>
                <input
                  type="text"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  placeholder="e.g. Grilled Chicken Breast"
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2.5 text-xs text-white placeholder:text-gray-500 focus:border-[#7CFF3B] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400">Calories (kcal) *</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g. 250"
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2.5 text-xs text-[#7CFF3B] placeholder:text-gray-500 focus:border-[#7CFF3B] focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            {/* Serving Size & Unit */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-gray-400">Serving Amount</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={servingAmount}
                  onChange={(e) => handleServingAmountChange(parseFloat(e.target.value) || 1)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2.5 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400">Serving Unit</label>
                <input
                  type="text"
                  value={servingUnit}
                  onChange={(e) => setServingUnit(e.target.value)}
                  placeholder="e.g. g, scoop, bowl, oz"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2.5 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>
            </div>

            {/* Macronutrients: Protein, Carbs, Fat, Fiber */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-bold text-blue-400">Protein (g)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3 py-2 text-xs text-white focus:border-blue-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-400">Carbs (g)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-red-400">Fat (g)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3 py-2 text-xs text-white focus:border-red-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400">Fiber (g)</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fiber}
                  onChange={(e) => setFiber(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3 py-2 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-bold text-gray-400">Optional Meal Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cooked in 1 tsp olive oil, post-squat meal"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#11161D] px-3.5 py-2 text-xs text-white placeholder:text-gray-600 focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </form>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 shrink-0">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-2xl border border-white/10 bg-[#11161D] px-6 py-3 text-xs font-bold text-gray-300 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="foodForm"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
          >
            {submitting ? "Saving Food..." : initialFood ? "💾 Update Food Entry" : "✓ Log Food to Diary"}
          </button>
        </div>
      </div>
    </div>
  );
}
