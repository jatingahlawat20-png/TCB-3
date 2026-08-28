"use client";

import { useState } from "react";
import Link from "next/link";
import { AddFoodModal } from "./add-food-modal";

export type NutritionPlanData = {
  id: string;
  name: string;
  goal: "FAT_LOSS" | "MUSCLE_GAIN" | "MAINTENANCE" | "PERFORMANCE";
  status: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  dailyCalories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterLiters: number;
  targetWeight: number | null;
  mealStructure: string | null;
  trainerNotes: string | null;
  isActive: boolean;
  trainer: {
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  targetHistory?: any[];
};

export type FoodLogItem = {
  id: string;
  mealType: string;
  foodName: string;
  servingAmount: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  notes: string | null;
  loggedDate: string | Date;
  createdAt: string | Date;
};

export type WaterLogItem = {
  id: string;
  amountLiters: number;
  loggedDate: string | Date;
  createdAt: string | Date;
};

type Props = {
  initialPlan: NutritionPlanData | null;
  initialDailyData: {
    date: string;
    consumed: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      water: number;
    };
    remaining: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      water: number;
      overCalories?: number;
      overProtein?: number;
      overCarbs?: number;
      overFat?: number;
      overWater?: number;
    } | null;
    percentages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      water: number;
    } | null;
    dailyAdherenceScore: number;
    mealsByType: Record<string, { foods: FoodLogItem[]; calories: number; protein: number; carbs: number; fat: number }>;
    foodLogs: FoodLogItem[];
    waterLogs: WaterLogItem[];
    workoutSummary: any | null;
  };
  initialAnalytics?: any;
};

export function ClientNutritionView({
  initialPlan,
  initialDailyData,
  initialAnalytics,
}: Props) {
  const [plan] = useState<NutritionPlanData | null>(initialPlan);
  const [currentDate, setCurrentDate] = useState<string>(initialDailyData.date);
  const [dailyData, setDailyData] = useState(initialDailyData);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [activeTab, setActiveTab] = useState<"diary" | "analytics" | "plan">("diary");
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>("BREAKFAST");
  const [editingFood, setEditingFood] = useState<FoodLogItem | null>(null);
  const [waterLoading, setWaterLoading] = useState(false);
  const [dateLoading, setDateLoading] = useState(false);

  const goalLabels: Record<string, { label: string; color: string }> = {
    FAT_LOSS: { label: "🔥 Fat Loss", color: "text-amber-400 bg-amber-400/10 border-amber-400/30" },
    MUSCLE_GAIN: { label: "💪 Muscle Gain", color: "text-[#7CFF3B] bg-[#7CFF3B]/10 border-[#7CFF3B]/30" },
    MAINTENANCE: { label: "⚖️ Maintenance", color: "text-blue-400 bg-blue-400/10 border-blue-400/30" },
    PERFORMANCE: { label: "⚡ Performance", color: "text-purple-400 bg-purple-400/10 border-purple-400/30" },
  };

  const mealTypeConfig: { key: string; label: string; icon: string }[] = [
    { key: "BREAKFAST", label: "Breakfast", icon: "🍳" },
    { key: "LUNCH", label: "Lunch", icon: "🥗" },
    { key: "DINNER", label: "Dinner", icon: "🥩" },
    { key: "SNACK", label: "Snacks", icon: "🍎" },
    { key: "PRE_WORKOUT", label: "Pre-Workout", icon: "⚡" },
    { key: "POST_WORKOUT", label: "Post-Workout", icon: "💪" },
  ];

  const fetchDailyDataForDate = async (targetDateStr: string) => {
    try {
      setDateLoading(true);
      setCurrentDate(targetDateStr);
      const res = await fetch(`/api/nutrition/daily?date=${targetDateStr}`);
      if (res.ok) {
        const data = await res.json();
        setDailyData(data);
      }
      const aRes = await fetch(`/api/nutrition/analytics`);
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnalytics(aData);
      }
    } catch (err) {
      console.error("Failed to load nutrition for date:", err);
    } finally {
      setDateLoading(false);
    }
  };

  const handlePrevDay = () => {
    const [y, m, d] = currentDate.split("-").map((n) => parseInt(n, 10));
    const prevDate = new Date(y, m - 1, d);
    prevDate.setDate(prevDate.getDate() - 1);
    const yyyy = prevDate.getFullYear();
    const mm = String(prevDate.getMonth() + 1).padStart(2, "0");
    const dd = String(prevDate.getDate()).padStart(2, "0");
    fetchDailyDataForDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = currentDate.split("-").map((n) => parseInt(n, 10));
    const nextDate = new Date(y, m - 1, d);
    nextDate.setDate(nextDate.getDate() + 1);
    const yyyy = nextDate.getFullYear();
    const mm = String(nextDate.getMonth() + 1).padStart(2, "0");
    const dd = String(nextDate.getDate()).padStart(2, "0");
    fetchDailyDataForDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    fetchDailyDataForDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleFoodSaved = () => {
    fetchDailyDataForDate(currentDate);
  };

  const handleDeleteFood = async (id: string) => {
    if (!confirm("Are you sure you want to delete this food item?")) return;
    try {
      const res = await fetch(`/api/nutrition/food/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchDailyDataForDate(currentDate);
      }
    } catch (err) {
      console.error("Failed to delete food:", err);
    }
  };

  const handleAddWater = async (amount: number) => {
    try {
      setWaterLoading(true);
      const res = await fetch(`/api/nutrition/water`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountLiters: amount, loggedDate: currentDate }),
      });
      if (res.ok) {
        fetchDailyDataForDate(currentDate);
      }
    } catch (err) {
      console.error("Failed to log water:", err);
    } finally {
      setWaterLoading(false);
    }
  };

  const openAddFoodForMeal = (mt: string) => {
    setSelectedMealType(mt);
    setEditingFood(null);
    setIsAddFoodOpen(true);
  };

  const openEditFood = (food: FoodLogItem) => {
    setSelectedMealType(food.mealType);
    setEditingFood(food);
    setIsAddFoodOpen(true);
  };

  // Date formatting helpers
  const todayStr = new Date().toISOString().split("T")[0];
  const isToday = currentDate === todayStr;
  const displayDateObj = new Date(currentDate + "T12:00:00");
  const formattedDisplayDate = displayDateObj.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const totalCaloriesConsumed = dailyData.consumed.calories;
  const targetCalories = plan?.dailyCalories || 0;
  const calPercent = targetCalories > 0 ? Math.round((totalCaloriesConsumed / targetCalories) * 100) : 0;
  const calExceeded = totalCaloriesConsumed > targetCalories && targetCalories > 0;

  const proteinConsumed = dailyData.consumed.protein;
  const targetProtein = plan?.proteinGrams || 0;
  const proteinPercent = targetProtein > 0 ? Math.round((proteinConsumed / targetProtein) * 100) : 0;
  const proteinExceeded = proteinConsumed > targetProtein && targetProtein > 0;

  const carbsConsumed = dailyData.consumed.carbohydrates;
  const targetCarbs = plan?.carbsGrams || 0;
  const carbsPercent = targetCarbs > 0 ? Math.round((carbsConsumed / targetCarbs) * 100) : 0;

  const fatConsumed = dailyData.consumed.fat;
  const targetFat = plan?.fatGrams || 0;
  const fatPercent = targetFat > 0 ? Math.round((fatConsumed / targetFat) * 100) : 0;

  const waterConsumed = dailyData.consumed.water;
  const targetWater = plan?.waterLiters || 0;
  const waterPercent = targetWater > 0 ? Math.round((waterConsumed / targetWater) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* 1. Date Navigator Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#11161D] p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            disabled={dateLoading}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition disabled:opacity-50"
            title="Previous Day"
          >
            ← Prev Day
          </button>

          <div className="flex items-center gap-2 px-2">
            <span className="text-base">📅</span>
            <span className="text-xs font-bold text-white">
              {isToday ? `Today (${formattedDisplayDate})` : formattedDisplayDate}
            </span>
          </div>

          <button
            onClick={handleNextDay}
            disabled={dateLoading}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white transition disabled:opacity-50"
            title="Next Day"
          >
            Next Day →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={currentDate}
            onChange={(e) => fetchDailyDataForDate(e.target.value)}
            disabled={dateLoading}
            className="rounded-xl border border-white/10 bg-[#0B0F15] px-3 py-1.5 text-xs text-white focus:border-[#7CFF3B] focus:outline-none"
          />

          {!isToday && (
            <button
              onClick={handleToday}
              disabled={dateLoading}
              className="rounded-xl bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3 py-1.5 text-xs font-bold text-[#7CFF3B] hover:bg-[#7CFF3B]/20 transition"
            >
              Jump to Today
            </button>
          )}
        </div>
      </div>

      {/* 2. Active Nutrition Plan Hero Banner (Target Goals ≠ Consumed) */}
      {plan ? (
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#11161D] via-[#0E131A] to-[#080B0F] p-6 md:p-8 shadow-xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-3.5 py-1 text-xs font-bold text-[#7CFF3B] uppercase tracking-wider">
                  Active Nutrition Plan
                </span>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    goalLabels[plan.goal]?.color || "text-white bg-white/5 border-white/10"
                  }`}
                >
                  {goalLabels[plan.goal]?.label || plan.goal}
                </span>
                {plan.targetWeight && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-gray-300">
                    Target Bodyweight: <strong className="text-white">{plan.targetWeight} kg</strong>
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-black text-white md:text-4xl">{plan.name}</h2>

              {/* Targets List */}
              <div className="rounded-2xl border border-white/5 bg-[#0B0F15] p-3 text-xs text-gray-300 max-w-2xl">
                <p className="font-semibold text-gray-400 uppercase text-[10px] tracking-wider mb-1">
                  Prescribed Daily Target Goals:
                </p>
                <p>
                  <strong className="text-[#7CFF3B] font-bold">{plan.dailyCalories.toLocaleString()} kcal</strong> •{" "}
                  <span className="text-blue-400 font-bold">{plan.proteinGrams}g Protein</span> •{" "}
                  <span className="text-amber-400 font-bold">{plan.carbsGrams}g Carbs</span> •{" "}
                  <span className="text-red-400 font-bold">{plan.fatGrams}g Fat</span> •{" "}
                  <span className="text-emerald-400 font-bold">{plan.fiberGrams}g Fiber</span> •{" "}
                  <span className="text-cyan-400 font-bold">{plan.waterLiters}L Water</span>
                </p>
              </div>

              {plan.trainerNotes && (
                <p className="text-xs text-yellow-300/90 max-w-2xl">
                  📋 Coach Guidelines: {plan.trainerNotes}
                </p>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                <span>Assigned by Coach</span>
                <span className="font-semibold text-white">{plan.trainer?.user?.name || "Your Coach"}</span>
                <span>•</span>
                <Link href="/messages" className="text-[#7CFF3B] hover:underline font-bold">
                  Direct Message Coach →
                </Link>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[110px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Consumed</p>
                <p className="mt-1 text-2xl font-black text-white">{totalCaloriesConsumed.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">kcal</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[110px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Remaining</p>
                <p className={`mt-1 text-2xl font-black ${calExceeded ? "text-amber-400" : "text-[#7CFF3B]"}`}>
                  {dailyData.remaining?.calories !== undefined ? dailyData.remaining.calories.toLocaleString() : "-"}
                </p>
                <p className="text-[10px] text-gray-500">
                  {calExceeded ? `+${totalCaloriesConsumed - targetCalories} kcal over` : "kcal"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#080B0F] p-4 text-center min-w-[110px]">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Adherence</p>
                <p className="mt-1 text-2xl font-black text-[#7CFF3B]">{dailyData.dailyAdherenceScore}%</p>
                <p className="text-[10px] text-gray-500">
                  {dailyData.foodLogs.length === 0 ? "No logs yet" : "Calculated"}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: No Active Plan */
        <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 text-3xl">
            🥗
          </div>
          <h3 className="mt-4 text-2xl font-black text-white">No Nutrition Plan Assigned Yet</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-md mx-auto">
            Your coach has not published your customized nutrition targets yet. Message your coach in chat to request your calorie and macronutrient plan.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/messages"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7CFF3B] px-8 py-3.5 text-xs font-black text-black shadow-[0_0_20px_rgba(124,255,59,0.35)] transition hover:scale-105 hover:bg-[#68e326]"
            >
              💬 Message Coach →
            </Link>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("diary")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "diary"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          🥗 Meals & Macros ({dailyData.foodLogs.length} items logged)
        </button>

        <button
          onClick={() => setActiveTab("analytics")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "analytics"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          📊 Weekly Nutrition Analytics ({analytics?.weeklyAdherence || 0}% Adherence)
        </button>

        <button
          onClick={() => setActiveTab("plan")}
          className={`rounded-2xl px-5 py-2.5 text-xs font-bold transition ${
            activeTab === "plan"
              ? "bg-[#7CFF3B] text-black shadow-[0_0_15px_rgba(124,255,59,0.25)] font-black"
              : "border border-white/10 bg-[#11161D] text-gray-300 hover:text-white"
          }`}
        >
          📋 Target History & Instructions
        </button>
      </div>

      {/* TAB 1: MEALS & MACROS */}
      {activeTab === "diary" && (
        <div className="space-y-8">
          {/* Workout + Nutrition Combo Connection Card */}
          {dailyData.workoutSummary && (
            <div className="rounded-[28px] border border-[#7CFF3B]/30 bg-[#7CFF3B]/5 p-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3.5">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7CFF3B]/20 text-2xl">
                  🏋️
                </span>
                <div>
                  <span className="rounded-full bg-[#7CFF3B] px-2.5 py-0.5 text-[10px] font-black text-black uppercase tracking-wider">
                    Workout Completed on {formattedDisplayDate}
                  </span>
                  <h4 className="mt-1 font-bold text-white text-base">
                    {dailyData.workoutSummary.workoutName}
                  </h4>
                  <p className="text-xs text-gray-400">
                    ⏱ {dailyData.workoutSummary.durationMinutes || 45} mins • {Math.round(dailyData.workoutSummary.totalVolume || 0)} kg volume logged
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Fueling Status:</p>
                <p className="text-xs font-bold text-[#7CFF3B]">
                  {dailyData.consumed.protein}g / {plan?.proteinGrams || 150}g Protein Consumed
                </p>
              </div>
            </div>
          )}

          {/* Daily Macros Counter Grid (0 when empty, unclipped when exceeded) */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Calories Card */}
            <div className={`rounded-[28px] border bg-[#11161D] p-5 ${calExceeded ? "border-amber-500/50" : "border-white/10"}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Calories</span>
                <span className={`font-mono text-xs font-black ${calExceeded ? "text-amber-400" : "text-[#7CFF3B]"}`}>
                  {calPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {totalCaloriesConsumed.toLocaleString()}{" "}
                <span className="text-xs font-normal text-gray-400">/ {plan?.dailyCalories.toLocaleString() || 2000}</span>
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={`h-full transition-all duration-300 ${calExceeded ? "bg-amber-400" : "bg-[#7CFF3B]"}`}
                  style={{ width: `${Math.min(100, calPercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {calExceeded
                  ? `+${totalCaloriesConsumed - targetCalories} kcal over target`
                  : `${dailyData.remaining?.calories || 0} kcal remaining`}
              </p>
            </div>

            {/* Protein Card */}
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Protein</span>
                <span className="font-mono text-xs font-black text-blue-400">
                  {proteinPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {proteinConsumed}g{" "}
                <span className="text-xs font-normal text-gray-400">/ {plan?.proteinGrams || 150}g</span>
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, proteinPercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {proteinExceeded
                  ? `+${Math.round((proteinConsumed - targetProtein) * 10) / 10}g over target`
                  : `${dailyData.remaining?.protein || 0}g remaining`}
              </p>
            </div>

            {/* Carbs Card */}
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Carbs</span>
                <span className="font-mono text-xs font-black text-amber-400">
                  {carbsPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {carbsConsumed}g{" "}
                <span className="text-xs font-normal text-gray-400">/ {plan?.carbsGrams || 250}g</span>
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, carbsPercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {carbsConsumed > targetCarbs
                  ? `+${Math.round((carbsConsumed - targetCarbs) * 10) / 10}g over target`
                  : `${dailyData.remaining?.carbs || 0}g remaining`}
              </p>
            </div>

            {/* Fat Card */}
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Fat</span>
                <span className="font-mono text-xs font-black text-red-400">
                  {fatPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {fatConsumed}g{" "}
                <span className="text-xs font-normal text-gray-400">/ {plan?.fatGrams || 70}g</span>
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-red-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, fatPercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {fatConsumed > targetFat
                  ? `+${Math.round((fatConsumed - targetFat) * 10) / 10}g over target`
                  : `${dailyData.remaining?.fat || 0}g remaining`}
              </p>
            </div>

            {/* Hydration Card */}
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Hydration</span>
                <span className="font-mono text-xs font-black text-cyan-400">
                  {waterPercent}%
                </span>
              </div>
              <p className="mt-2 text-2xl font-black text-white">
                {waterConsumed}L{" "}
                <span className="text-xs font-normal text-gray-400">/ {plan?.waterLiters || 3.0}L</span>
              </p>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, waterPercent)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-400">
                {waterConsumed >= targetWater
                  ? "✓ Hydration goal hit"
                  : `${dailyData.remaining?.water || 0}L remaining`}
              </p>
            </div>
          </div>

          {/* Quick Water Logging Bar */}
          <div className="rounded-3xl border border-white/10 bg-[#11161D] p-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💧</span>
              <div>
                <h4 className="font-bold text-sm text-white">Water Intake for {formattedDisplayDate}</h4>
                <p className="text-xs text-gray-400">
                  Current: <strong className="text-cyan-400">{dailyData.consumed.water} Liters</strong> ({dailyData.waterLogs.length} logs)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: "+250 ml", amount: 0.25 },
                { label: "+500 ml", amount: 0.5 },
                { label: "+750 ml", amount: 0.75 },
                { label: "+1.0 L", amount: 1.0 },
              ].map((w) => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => handleAddWater(w.amount)}
                  disabled={waterLoading}
                  className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 hover:scale-105 transition disabled:opacity-50"
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Breakdown Sections */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-white">Meal Breakdown</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Entries recorded for <strong className="text-white">{formattedDisplayDate}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddFoodForMeal("BREAKFAST")}
                className="rounded-2xl bg-[#7CFF3B] px-5 py-2.5 text-xs font-black text-black shadow-[0_0_15px_rgba(124,255,59,0.3)] hover:bg-[#68e326] transition"
              >
                + Log Food
              </button>
            </div>

            {dailyData.foodLogs.length === 0 ? (
              <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-12 text-center">
                <p className="text-base font-bold text-white">No meals logged for this date</p>
                <p className="mt-1 text-xs text-gray-400 max-w-sm mx-auto">
                  Start tracking your breakfast, lunch, or snack to see your macro progress and fuel your training!
                </p>
                <button
                  onClick={() => openAddFoodForMeal("BREAKFAST")}
                  className="mt-5 rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-black text-black hover:bg-[#68e326]"
                >
                  + Log First Meal
                </button>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {mealTypeConfig.map((mt) => {
                  const group = dailyData.mealsByType[mt.key] || {
                    foods: [],
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                  };

                  return (
                    <div
                      key={mt.key}
                      className="rounded-[28px] border border-white/10 bg-[#11161D] p-5 space-y-4 shadow-sm"
                    >
                      {/* Group Header */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{mt.icon}</span>
                          <div>
                            <h4 className="font-bold text-white text-sm">{mt.label}</h4>
                            <p className="text-[10px] text-gray-400 font-mono">
                              {group.calories} kcal • {group.protein}g P • {group.carbs}g C • {group.fat}g F
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => openAddFoodForMeal(mt.key)}
                          className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-gray-300 hover:text-white hover:border-[#7CFF3B]/40"
                        >
                          + Add
                        </button>
                      </div>

                      {/* Foods list in this group */}
                      {group.foods.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">No foods logged for {mt.label.toLowerCase()} yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {group.foods.map((food) => (
                            <div
                              key={food.id}
                              className="rounded-2xl border border-white/5 bg-[#0B0F15] p-3 text-xs flex items-center justify-between gap-2"
                            >
                              <div>
                                <p className="font-bold text-white">{food.foodName}</p>
                                <p className="text-[11px] text-gray-400">
                                  {food.servingAmount} {food.servingUnit} •{" "}
                                  <span className="text-[#7CFF3B] font-semibold">{food.calories} kcal</span> (P: {food.protein}g • C: {food.carbohydrates}g • F: {food.fat}g)
                                </p>
                                {food.notes && (
                                  <p className="text-[10px] text-gray-500 mt-0.5 italic">"{food.notes}"</p>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={() => openEditFood(food)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:text-white text-xs"
                                  title="Edit Entry"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteFood(food.id)}
                                  className="rounded-lg p-1.5 text-gray-400 hover:text-red-400 text-xs"
                                  title="Delete Entry"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEEKLY NUTRITION ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-8">
          {/* Weekly Averages KPI Row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Daily Calories</p>
              <p className="mt-2 text-3xl font-black text-white">
                {analytics?.averages?.dailyCalories?.toLocaleString() || 0}{" "}
                <span className="text-xs text-gray-400 font-normal">kcal/day</span>
              </p>
              <p className="mt-1 text-xs text-[#7CFF3B]">Target: {plan?.dailyCalories || 2000} kcal</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Daily Protein</p>
              <p className="mt-2 text-3xl font-black text-blue-400">
                {analytics?.averages?.dailyProtein || 0}{" "}
                <span className="text-xs text-gray-400 font-normal">g/day</span>
              </p>
              <p className="mt-1 text-xs text-gray-400">Target: {plan?.proteinGrams || 150}g</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Weekly Adherence</p>
              <p className="mt-2 text-3xl font-black text-[#7CFF3B]">
                {analytics?.weeklyAdherence || 0}%
              </p>
              <p className="mt-1 text-xs text-gray-400">7-Day Compliance Score</p>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#11161D] p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Target Consistency</p>
              <p className="mt-2 text-2xl font-black text-white">
                {analytics?.daysMeetingCalorieTarget || "0 / 7 days"}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Protein target hit: {analytics?.daysMeetingProteinTarget || "0 / 7 days"}
              </p>
            </div>
          </div>

          {/* 7-Day Chronological Trend Cards */}
          <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
            <h3 className="text-xl font-black text-white">Past 7 Days Nutrition Log</h3>
            <p className="text-xs text-gray-400 mt-1">
              Daily calorie totals, macronutrient balance, and adherence scores.
            </p>

            {(analytics?.daysLoggedCount || 0) === 0 ? (
              <div className="py-12 text-center text-xs text-gray-500">
                Not enough historical data yet. Log your daily meals and hydration to populate your 7-day analytics!
              </div>
            ) : (
              <div className="mt-6 divide-y divide-white/5">
                {(analytics?.dailyAnalytics || []).map((day: any) => (
                  <div key={day.date} className="py-4 flex flex-col justify-between gap-3 md:flex-row md:items-center text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{day.dayLabel}</span>
                        <span className="text-gray-400">({day.date})</span>
                        {day.metCalorieTarget && (
                          <span className="rounded-full bg-[#7CFF3B]/10 border border-[#7CFF3B]/30 px-2 py-0.2 text-[10px] font-bold text-[#7CFF3B]">
                            ✓ Calorie Target Hit
                          </span>
                        )}
                        {day.metProteinTarget && (
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-2 py-0.2 text-[10px] font-bold text-blue-300">
                            ✓ Protein Hit
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-gray-400 font-mono">
                        {day.calories} kcal • {day.protein}g Protein • {day.carbs}g Carbs • {day.fat}g Fat • {day.water}L Water
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">Adherence:</span>
                      <span className="font-mono text-sm font-bold text-[#7CFF3B]">{day.adherenceScore}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TARGET HISTORY & PLAN GUIDELINES */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
            <h3 className="text-xl font-black text-white">Coach Guidelines & Meal Structure</h3>
            {plan?.mealStructure ? (
              <div className="mt-4 rounded-2xl bg-[#0B0F15] p-4 text-xs">
                <p className="font-bold text-[#7CFF3B]">Recommended Meal Structure:</p>
                <p className="mt-1 text-gray-300 leading-relaxed">{plan.mealStructure}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-400">No specific meal structure designated.</p>
            )}

            {plan?.trainerNotes && (
              <div className="mt-4 rounded-2xl bg-[#0B0F15] p-4 text-xs">
                <p className="font-bold text-yellow-300">Coach Notes & Rules:</p>
                <p className="mt-1 text-gray-300 leading-relaxed">{plan.trainerNotes}</p>
              </div>
            )}
          </div>

          {/* Target History */}
          <div className="rounded-[32px] border border-white/10 bg-[#11161D] p-6 md:p-8">
            <h3 className="text-xl font-black text-white">Target Modification History</h3>
            <p className="text-xs text-gray-400 mt-1">Audit log of nutrition adjustments made by your coach.</p>

            <div className="mt-6 space-y-3">
              {(plan?.targetHistory || []).length === 0 ? (
                <p className="text-xs text-gray-500">No previous target revisions.</p>
              ) : (
                plan?.targetHistory?.map((th: any) => (
                  <div key={th.id} className="rounded-2xl border border-white/5 bg-[#0B0F15] p-4 text-xs">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-bold text-[#7CFF3B]">
                        {th.dailyCalories.toLocaleString()} kcal • {th.proteinGrams}g P • {th.carbsGrams}g C • {th.fatGrams}g F
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(th.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    {th.changeReason && (
                      <p className="mt-2 text-[11px] text-gray-300">Reason: {th.changeReason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Food Modal */}
      {isAddFoodOpen && (
        <AddFoodModal
          isOpen={isAddFoodOpen}
          onClose={() => setIsAddFoodOpen(false)}
          defaultMealType={selectedMealType}
          initialFood={editingFood}
          onFoodSaved={handleFoodSaved}
          loggedDate={currentDate}
        />
      )}
    </div>
  );
}
