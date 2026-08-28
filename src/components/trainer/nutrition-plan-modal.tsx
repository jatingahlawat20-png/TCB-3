"use client";

import { useState, useEffect } from "react";

type ActiveClient = {
  id: string;
  name: string;
  email: string;
  packageName?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  activeClients?: ActiveClient[];
  preselectedClientId?: string;
  initialPlan?: any | null;
  onPlanSaved?: (plan: any) => void;
};

export function NutritionPlanModal({
  isOpen,
  onClose,
  activeClients = [],
  preselectedClientId = "",
  initialPlan = null,
  onPlanSaved,
}: Props) {
  const [clientId, setClientId] = useState(preselectedClientId || activeClients[0]?.id || "");
  const [name, setName] = useState("");
  const [goal, setGoal] = useState<"FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "PERFORMANCE">("MUSCLE_GAIN");
  const [status, setStatus] = useState<"ACTIVE" | "DRAFT">("ACTIVE");
  const [dailyCalories, setDailyCalories] = useState<number>(2600);
  const [proteinGrams, setProteinGrams] = useState<number>(160);
  const [carbsGrams, setCarbsGrams] = useState<number>(310);
  const [fatGrams, setFatGrams] = useState<number>(75);
  const [fiberGrams, setFiberGrams] = useState<number>(30);
  const [waterLiters, setWaterLiters] = useState<number>(3.0);
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [mealStructure, setMealStructure] = useState("");
  const [trainerNotes, setTrainerNotes] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialPlan) {
        setClientId(initialPlan.clientId || preselectedClientId);
        setName(initialPlan.name || "");
        setGoal(initialPlan.goal || "MUSCLE_GAIN");
        setStatus(initialPlan.status || "ACTIVE");
        setDailyCalories(initialPlan.dailyCalories || 2600);
        setProteinGrams(initialPlan.proteinGrams || 160);
        setCarbsGrams(initialPlan.carbsGrams || 310);
        setFatGrams(initialPlan.fatGrams || 75);
        setFiberGrams(initialPlan.fiberGrams || 30);
        setWaterLiters(initialPlan.waterLiters || 3.0);
        setTargetWeight(initialPlan.targetWeight ? String(initialPlan.targetWeight) : "");
        setMealStructure(initialPlan.mealStructure || "");
        setTrainerNotes(initialPlan.trainerNotes || "");
        setChangeReason("");
      } else {
        setClientId(preselectedClientId || activeClients[0]?.id || "");
        setName("12-Week Hypertrophy & Fueling Plan");
        setGoal("MUSCLE_GAIN");
        setStatus("ACTIVE");
        setDailyCalories(2600);
        setProteinGrams(160);
        setCarbsGrams(310);
        setFatGrams(75);
        setFiberGrams(30);
        setWaterLiters(3.0);
        setTargetWeight("");
        setMealStructure("4 Meals: Breakfast, Lunch, Post-Workout Shake, Dinner");
        setTrainerNotes("Maintain 1.8g to 2.2g protein per kg. Hydrate consistently before and after training.");
        setChangeReason("");
      }
      setErrorMessage("");
    }
  }, [isOpen, initialPlan, preselectedClientId, activeClients]);

  if (!isOpen) return null;

  // Macro calorie calculation
  const calculatedCalories = proteinGrams * 4 + carbsGrams * 4 + fatGrams * 9;
  const calorieDiff = dailyCalories - calculatedCalories;
  const proteinPercent = calculatedCalories > 0 ? Math.round(((proteinGrams * 4) / calculatedCalories) * 100) : 0;
  const carbsPercent = calculatedCalories > 0 ? Math.round(((carbsGrams * 4) / calculatedCalories) * 100) : 0;
  const fatPercent = calculatedCalories > 0 ? Math.round(((fatGrams * 9) / calculatedCalories) * 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMessage("");

      const targetClientId = clientId || preselectedClientId;
      if (!targetClientId) {
        throw new Error("Please select an active client.");
      }

      if (!dailyCalories || dailyCalories < 500) {
        throw new Error("Please set a valid calorie target.");
      }

      const payload = {
        clientId: targetClientId,
        name: name.trim() || `${goal} Nutrition Plan`,
        goal,
        status,
        dailyCalories: Number(dailyCalories),
        proteinGrams: Number(proteinGrams),
        carbsGrams: Number(carbsGrams),
        fatGrams: Number(fatGrams),
        fiberGrams: Number(fiberGrams),
        waterLiters: Number(waterLiters),
        targetWeight: targetWeight ? Number(targetWeight) : null,
        mealStructure: mealStructure.trim() || null,
        trainerNotes: trainerNotes.trim() || null,
        changeReason: changeReason.trim() || undefined,
      };

      let res: Response;
      if (initialPlan) {
        res = await fetch(`/api/trainer/clients/${targetClientId}/nutrition`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/nutrition/plan`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save nutrition plan.");
      }

      if (onPlanSaved) {
        onPlanSaved(data.plan);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save nutrition plan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#0B0F15] p-6 text-white shadow-2xl md:p-8 my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div>
            <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-0.5 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
              Coach Nutrition Builder
            </span>
            <h2 className="mt-1 text-2xl font-black text-white">
              {initialPlan ? "Adjust Client Nutrition Targets" : "Prescribe Client Nutrition Plan"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="nutritionPlanForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto mt-6 space-y-6 pr-2">
          {/* Section 1: Client & Goal */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-5 space-y-4">
            <h3 className="font-bold text-sm text-white">1. Plan Essentials & Target Goal</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {/* Client Selector (if not preselected) */}
              {!preselectedClientId && (
                <div>
                  <label className="text-xs font-bold text-gray-300">Select Client *</label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                  >
                    <option value="">-- Choose Client --</option>
                    {activeClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) {c.packageName ? `• ${c.packageName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Plan Title */}
              <div className={preselectedClientId ? "sm:col-span-2" : ""}>
                <label className="text-xs font-bold text-gray-300">Plan Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Muscle Gain & Performance Fuel"
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none font-bold"
                />
              </div>

              {/* Nutrition Goal */}
              <div>
                <label className="text-xs font-bold text-gray-300">Nutritional Goal *</label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none font-semibold"
                >
                  <option value="MUSCLE_GAIN">💪 Muscle Gain (Lean Bulking)</option>
                  <option value="FAT_LOSS">🔥 Fat Loss (Caloric Deficit)</option>
                  <option value="MAINTENANCE">⚖️ Maintenance (Body Recomposition)</option>
                  <option value="PERFORMANCE">⚡ Athletic Performance</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="text-xs font-bold text-gray-300">Publish Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Published to Client)</option>
                  <option value="DRAFT">DRAFT (Saved for review)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Macro & Calorie Periodization */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">2. Daily Calories & Macronutrient Targets</h3>
              <span className="text-[11px] font-mono text-gray-400">
                Macro Sum: <strong className="text-white">{calculatedCalories}</strong> / {dailyCalories} kcal
              </span>
            </div>

            {/* Macro Summary Preview Bar */}
            <div className="rounded-2xl bg-[#0B0F15] p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-400 font-bold">Protein: {proteinPercent}%</span>
                <span className="text-amber-400 font-bold">Carbs: {carbsPercent}%</span>
                <span className="text-red-400 font-bold">Fat: {fatPercent}%</span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="bg-blue-400 h-full" style={{ width: `${proteinPercent}%` }} />
                <div className="bg-amber-400 h-full" style={{ width: `${carbsPercent}%` }} />
                <div className="bg-red-400 h-full" style={{ width: `${fatPercent}%` }} />
              </div>
              {Math.abs(calorieDiff) > 100 && (
                <p className="text-[10px] text-yellow-400">
                  ⚠️ Note: Target calories ({dailyCalories}) differ by {Math.abs(calorieDiff)} kcal from calculated macro calories ({calculatedCalories}).
                </p>
              )}
            </div>

            {/* Target Inputs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-[#7CFF3B]">Daily Calories (kcal) *</label>
                <input
                  type="number"
                  min="500"
                  max="15000"
                  value={dailyCalories}
                  onChange={(e) => setDailyCalories(parseInt(e.target.value, 10) || 0)}
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-[#7CFF3B] focus:border-[#7CFF3B] focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-400">Protein Target (g) *</label>
                <input
                  type="number"
                  min="0"
                  value={proteinGrams}
                  onChange={(e) => setProteinGrams(parseFloat(e.target.value) || 0)}
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-blue-400 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-amber-400">Carbs Target (g) *</label>
                <input
                  type="number"
                  min="0"
                  value={carbsGrams}
                  onChange={(e) => setCarbsGrams(parseFloat(e.target.value) || 0)}
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-amber-400 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-red-400">Fat Target (g) *</label>
                <input
                  type="number"
                  min="0"
                  value={fatGrams}
                  onChange={(e) => setFatGrams(parseFloat(e.target.value) || 0)}
                  required
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-red-400 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400">Fiber Target (g)</label>
                <input
                  type="number"
                  min="0"
                  value={fiberGrams}
                  onChange={(e) => setFiberGrams(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-emerald-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-cyan-400">Water Target (Liters)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  value={waterLiters}
                  onChange={(e) => setWaterLiters(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-cyan-400 focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            {/* Target Bodyweight */}
            <div>
              <label className="text-xs font-bold text-gray-300">Target Bodyweight in kg (Optional)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                placeholder="e.g. 78.5"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Meal Structure & Instructions */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-5 space-y-4">
            <h3 className="font-bold text-sm text-white">3. Meal Structure & Coach Guidelines</h3>

            <div>
              <label className="text-xs font-bold text-gray-300">Meal Timing / Structure Suggestion</label>
              <input
                type="text"
                value={mealStructure}
                onChange={(e) => setMealStructure(e.target.value)}
                placeholder="e.g. 4 Meals: High-protein breakfast, lunch, pre-workout snack, dinner"
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300">Coach Nutrition Guidelines & Rules</label>
              <textarea
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                placeholder="Instructions on meal timing, hydration, peri-workout carbs, whole food sourcing..."
                rows={2}
                className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
              />
            </div>

            {initialPlan && (
              <div>
                <label className="text-xs font-bold text-yellow-300">Reason for Target Adjustment *</label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Weight plateaued, increasing calories by 200 kcal for lean bulking"
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-[#0B0F15] p-3 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
                />
              </div>
            )}
          </div>
        </form>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 shrink-0">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Footer Actions */}
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
            form="nutritionPlanForm"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-50"
          >
            {submitting ? "Deploying Plan..." : initialPlan ? "💾 Save Target Adjustment" : "🚀 Publish Nutrition Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}
