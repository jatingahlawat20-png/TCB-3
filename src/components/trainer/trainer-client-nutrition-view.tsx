"use client";

import { useState } from "react";
import Link from "next/link";
import { NutritionPlanModal } from "./nutrition-plan-modal";

type Props = {
  client: {
    id: string;
    name: string;
    email: string;
  };
  initialPlan: any | null;
  initialTodayIntake: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };
  initialWeeklyAdherence: number;
  initialRecentFoods: any[];
  initialTargetHistory: any[];
};

export function TrainerClientNutritionView({
  client,
  initialPlan,
  initialTodayIntake,
  initialWeeklyAdherence,
  initialRecentFoods,
  initialTargetHistory,
}: Props) {
  const [plan, setPlan] = useState<any | null>(initialPlan);
  const [todayIntake, setTodayIntake] = useState(initialTodayIntake);
  const [weeklyAdherence, setWeeklyAdherence] = useState(initialWeeklyAdherence);
  const [recentFoods, setRecentFoods] = useState(initialRecentFoods);
  const [targetHistory, setTargetHistory] = useState(initialTargetHistory);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  const handlePlanSaved = (updatedPlan: any) => {
    setPlan(updatedPlan);
    if (updatedPlan.targetHistory) {
      setTargetHistory(updatedPlan.targetHistory);
    }
  };

  const goalLabels: Record<string, string> = {
    FAT_LOSS: "🔥 Fat Loss",
    MUSCLE_GAIN: "💪 Muscle Gain",
    MAINTENANCE: "⚖️ Maintenance",
    PERFORMANCE: "⚡ Performance",
  };

  return (
    <div className="space-y-8">
      {/* Active Nutrition Plan Overview */}
      <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8 shadow-xl">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                Prescribed Nutrition Targets
              </span>
              {plan && (
                <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-bold text-gray-300">
                  {goalLabels[plan.goal] || plan.goal}
                </span>
              )}
            </div>

            <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
              {plan ? plan.name : "No Nutrition Plan Assigned"}
            </h2>

            {plan ? (
              <p className="mt-1 text-xs text-gray-300">
                Daily Targets: <strong className="text-[#7CFF3B]">{plan.dailyCalories.toLocaleString()} kcal</strong> •{" "}
                <span className="text-blue-400 font-bold">{plan.proteinGrams}g Protein</span> •{" "}
                <span className="text-amber-400 font-bold">{plan.carbsGrams}g Carbs</span> •{" "}
                <span className="text-red-400 font-bold">{plan.fatGrams}g Fat</span> •{" "}
                <span className="text-cyan-400 font-bold">{plan.waterLiters}L Water</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-400">
                This client does not have an active nutrition plan published yet.
              </p>
            )}
          </div>

          <button
            onClick={() => setIsPlanModalOpen(true)}
            className="rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.3)] hover:bg-[#68e326] transition shrink-0"
          >
            {plan ? "⚙️ Adjust Targets" : "+ Prescribe Nutrition Plan"}
          </button>
        </div>

        {/* Targets & Today's Intake Comparison */}
        {plan && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            <div className="rounded-2xl bg-[#0B0F15] p-4 border border-white/5">
              <p className="text-[10px] text-gray-400 uppercase font-bold">Calories Today</p>
              <p className="mt-1 text-2xl font-black text-white">{todayIntake.calories.toLocaleString()}</p>
              <p className="text-[10px] text-gray-500">Target: {plan.dailyCalories.toLocaleString()} kcal</p>
            </div>

            <div className="rounded-2xl bg-[#0B0F15] p-4 border border-white/5">
              <p className="text-[10px] text-blue-400 uppercase font-bold">Protein Today</p>
              <p className="mt-1 text-2xl font-black text-blue-400">{todayIntake.protein}g</p>
              <p className="text-[10px] text-gray-500">Target: {plan.proteinGrams}g</p>
            </div>

            <div className="rounded-2xl bg-[#0B0F15] p-4 border border-white/5">
              <p className="text-[10px] text-amber-400 uppercase font-bold">Carbs Today</p>
              <p className="mt-1 text-2xl font-black text-amber-400">{todayIntake.carbs}g</p>
              <p className="text-[10px] text-gray-500">Target: {plan.carbsGrams}g</p>
            </div>

            <div className="rounded-2xl bg-[#0B0F15] p-4 border border-white/5">
              <p className="text-[10px] text-red-400 uppercase font-bold">Fat Today</p>
              <p className="mt-1 text-2xl font-black text-red-400">{todayIntake.fat}g</p>
              <p className="text-[10px] text-gray-500">Target: {plan.fatGrams}g</p>
            </div>

            <div className="rounded-2xl bg-[#0B0F15] p-4 border border-white/5">
              <p className="text-[10px] text-cyan-400 uppercase font-bold">7-Day Adherence</p>
              <p className="mt-1 text-2xl font-black text-[#7CFF3B]">{weeklyAdherence}%</p>
              <p className="text-[10px] text-gray-500">Weekly Target Score</p>
            </div>
          </div>
        )}
      </div>

      {/* Recent Meal Logs Stream */}
      <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl font-black text-white">Client Meal & Food Diary</h3>
            <p className="text-xs text-gray-400">Chronological foods logged by {client.name}</p>
          </div>
          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300 font-bold">
            {recentFoods.length} Entries
          </span>
        </div>

        {recentFoods.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            No meal logs recorded yet by this client.
          </div>
        ) : (
          <div className="mt-6 divide-y divide-white/5">
            {recentFoods.map((food) => (
              <div key={food.id} className="py-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{food.foodName}</span>
                    <span className="rounded-lg bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-gray-300">
                      {food.mealType}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {food.servingAmount} {food.servingUnit} • {new Date(food.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                    {food.notes && `• "${food.notes}"`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#7CFF3B]">
                    {food.calories} kcal
                  </span>
                  <p className="text-[10px] text-gray-400">
                    P: {food.protein}g • C: {food.carbohydrates}g • F: {food.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Target History Audit Trail */}
      {targetHistory.length > 0 && (
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
          <h3 className="text-xl font-black text-white">Target Modification History</h3>
          <p className="text-xs text-gray-400 mt-1">Audit log of all target adjustments made for this client.</p>

          <div className="mt-6 space-y-3">
            {targetHistory.map((th: any) => (
              <div key={th.id} className="rounded-2xl border border-white/5 bg-[#0B0F15] p-4 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-bold text-[#7CFF3B]">
                    {th.dailyCalories.toLocaleString()} kcal ({th.proteinGrams}g Protein • {th.carbsGrams}g Carbs • {th.fatGrams}g Fat)
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(th.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                {th.changeReason && (
                  <p className="mt-2 text-[11px] text-gray-300">Reason: {th.changeReason}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plan Builder / Target Adjustment Modal */}
      {isPlanModalOpen && (
        <NutritionPlanModal
          isOpen={isPlanModalOpen}
          onClose={() => setIsPlanModalOpen(false)}
          preselectedClientId={client.id}
          initialPlan={plan}
          onPlanSaved={handlePlanSaved}
        />
      )}
    </div>
  );
}
