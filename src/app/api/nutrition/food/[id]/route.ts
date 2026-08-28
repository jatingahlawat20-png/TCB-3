import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLog = await prisma.foodLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Food log not found." }, { status: 404 });
    }

    // Ownership check (only the owner or ADMIN can modify)
    if (existingLog.clientId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    } = body;

    const updated = await prisma.foodLog.update({
      where: { id },
      data: {
        mealType: mealType || existingLog.mealType,
        foodName: foodName?.trim() || existingLog.foodName,
        servingAmount: servingAmount !== undefined ? Number(servingAmount) : existingLog.servingAmount,
        servingUnit: servingUnit?.trim() || existingLog.servingUnit,
        calories: calories !== undefined ? Math.round(Number(calories)) : existingLog.calories,
        protein: protein !== undefined ? Math.round(Number(protein) * 10) / 10 : existingLog.protein,
        carbohydrates: carbohydrates !== undefined ? Math.round(Number(carbohydrates) * 10) / 10 : existingLog.carbohydrates,
        fat: fat !== undefined ? Math.round(Number(fat) * 10) / 10 : existingLog.fat,
        fiber: fiber !== undefined ? Math.round(Number(fiber) * 10) / 10 : existingLog.fiber,
        notes: notes !== undefined ? notes?.trim() : existingLog.notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Food log updated.",
      foodLog: updated,
    });
  } catch (error: any) {
    console.error("Error updating food log:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update food log." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLog = await prisma.foodLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Food log not found." }, { status: 404 });
    }

    // Ownership check
    if (existingLog.clientId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.foodLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Food entry deleted.",
    });
  } catch (error: any) {
    console.error("Error deleting food log:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete food entry." },
      { status: 500 }
    );
  }
}
