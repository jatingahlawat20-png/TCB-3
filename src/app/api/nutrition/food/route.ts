import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      mealType,
      foodName,
      servingAmount,
      servingUnit,
      calories,
      protein,
      carbohydrates,
      fat,
      fiber,
      notes,
      loggedDate,
    } = body;

    if (!foodName || !foodName.trim()) {
      return NextResponse.json({ error: "Food name is required." }, { status: 400 });
    }

    if (calories === undefined || Number(calories) < 0) {
      return NextResponse.json({ error: "Calories must be a valid number >= 0." }, { status: 400 });
    }

    const validMealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "PRE_WORKOUT", "POST_WORKOUT"];
    const resolvedMealType = validMealTypes.includes(mealType) ? mealType : "BREAKFAST";

    let targetDate = new Date();
    if (loggedDate && /^\d{4}-\d{2}-\d{2}$/.test(loggedDate)) {
      const [y, m, d] = loggedDate.split("-").map((n: string) => parseInt(n, 10));
      targetDate = new Date(y, m - 1, d, 12, 0, 0);
    } else if (loggedDate) {
      targetDate = new Date(loggedDate);
    }

    const newFoodLog = await prisma.foodLog.create({
      data: {
        clientId: user.id,
        mealType: resolvedMealType as any,
        foodName: foodName.trim(),
        servingAmount: servingAmount ? Number(servingAmount) : 1,
        servingUnit: servingUnit?.trim() || "serving",
        calories: Math.round(Number(calories)),
        protein: Math.round(Number(protein || 0) * 10) / 10,
        carbohydrates: Math.round(Number(carbohydrates || 0) * 10) / 10,
        fat: Math.round(Number(fat || 0) * 10) / 10,
        fiber: fiber ? Math.round(Number(fiber) * 10) / 10 : 0,
        notes: notes?.trim() || null,
        loggedDate: targetDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Food logged successfully.",
      foodLog: newFoodLog,
    });
  } catch (error: any) {
    console.error("Error logging food:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log food." },
      { status: 500 }
    );
  }
}
