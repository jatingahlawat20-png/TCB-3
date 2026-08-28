import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetClientId = searchParams.get("clientId");

    let clientIdToFetch = user.id;

    if (targetClientId && targetClientId !== user.id) {
      // Must be a trainer or admin
      if (user.role !== "TRAINER" && user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (user.role === "TRAINER") {
        if (!user.trainerProfile) {
          return NextResponse.json({ error: "Trainer profile not found." }, { status: 403 });
        }

        // Verify active coaching relationship
        const activeRelationship = await prisma.coachingRequest.findFirst({
          where: {
            trainerId: user.trainerProfile.id,
            clientId: targetClientId,
            status: "ACCEPTED",
          },
        });

        if (!activeRelationship) {
          return NextResponse.json(
            { error: "Forbidden: You are not authorized to coach this client." },
            { status: 403 }
          );
        }
      }

      clientIdToFetch = targetClientId;
    }

    const activePlan = await prisma.nutritionPlan.findFirst({
      where: {
        clientId: clientIdToFetch,
        isActive: true,
      },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
        targetHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    const allPlans = await prisma.nutritionPlan.findMany({
      where: { clientId: clientIdToFetch },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      activePlan,
      plans: allPlans,
    });
  } catch (error: any) {
    console.error("Error fetching nutrition plan:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch nutrition plan." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "TRAINER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only trainers and admins can create nutrition plans." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      clientId,
      name,
      goal,
      dailyCalories,
      proteinGrams,
      carbsGrams,
      fatGrams,
      fiberGrams,
      waterLiters,
      targetWeight,
      mealStructure,
      trainerNotes,
      status,
    } = body;

    if (!clientId) {
      return NextResponse.json({ error: "Client ID is required." }, { status: 400 });
    }

    if (!dailyCalories || dailyCalories < 500 || dailyCalories > 15000) {
      return NextResponse.json(
        { error: "A valid daily calorie target between 500 and 15,000 kcal is required." },
        { status: 400 }
      );
    }

    if (proteinGrams === undefined || proteinGrams < 0) {
      return NextResponse.json({ error: "Valid protein target is required." }, { status: 400 });
    }

    if (carbsGrams === undefined || carbsGrams < 0) {
      return NextResponse.json({ error: "Valid carbohydrate target is required." }, { status: 400 });
    }

    if (fatGrams === undefined || fatGrams < 0) {
      return NextResponse.json({ error: "Valid fat target is required." }, { status: 400 });
    }

    // Resolve trainer profile
    let trainerProfileId = user.trainerProfile?.id;
    if (!trainerProfileId && user.role === "ADMIN") {
      const defaultTrainer = await prisma.trainerProfile.findFirst();
      trainerProfileId = defaultTrainer?.id;
    }

    if (!trainerProfileId) {
      return NextResponse.json({ error: "Trainer profile not found." }, { status: 403 });
    }

    // Verify active coaching relationship if TRAINER
    if (user.role === "TRAINER") {
      const activeRelationship = await prisma.coachingRequest.findFirst({
        where: {
          trainerId: trainerProfileId,
          clientId: clientId,
          status: "ACCEPTED",
        },
      });

      if (!activeRelationship) {
        return NextResponse.json(
          { error: "Forbidden: You are not authorized to coach this client." },
          { status: 403 }
        );
      }
    }

    const planStatus = status === "DRAFT" ? "DRAFT" : "ACTIVE";
    const isActivePlan = planStatus === "ACTIVE";

    // If publishing an active plan, deactivate previous active plans for this client
    if (isActivePlan) {
      await prisma.nutritionPlan.updateMany({
        where: {
          clientId,
          isActive: true,
        },
        data: {
          isActive: false,
          status: "ARCHIVED",
        },
      });
    }

    // Create new plan
    const newPlan = await prisma.nutritionPlan.create({
      data: {
        trainerId: trainerProfileId,
        clientId,
        name: name?.trim() || `${goal || "Custom"} Nutrition Plan`,
        goal: goal || "MUSCLE_GAIN",
        status: planStatus,
        dailyCalories: Math.round(Number(dailyCalories)),
        proteinGrams: Math.round(Number(proteinGrams) * 10) / 10,
        carbsGrams: Math.round(Number(carbsGrams) * 10) / 10,
        fatGrams: Math.round(Number(fatGrams) * 10) / 10,
        fiberGrams: fiberGrams ? Math.round(Number(fiberGrams) * 10) / 10 : 30.0,
        waterLiters: waterLiters ? Math.round(Number(waterLiters) * 10) / 10 : 3.0,
        targetWeight: targetWeight ? Number(targetWeight) : null,
        mealStructure: mealStructure?.trim() || null,
        trainerNotes: trainerNotes?.trim() || null,
        isActive: isActivePlan,
        targetHistory: {
          create: {
            changedById: user.id,
            dailyCalories: Math.round(Number(dailyCalories)),
            proteinGrams: Math.round(Number(proteinGrams) * 10) / 10,
            carbsGrams: Math.round(Number(carbsGrams) * 10) / 10,
            fatGrams: Math.round(Number(fatGrams) * 10) / 10,
            fiberGrams: fiberGrams ? Math.round(Number(fiberGrams) * 10) / 10 : 30.0,
            waterLiters: waterLiters ? Math.round(Number(waterLiters) * 10) / 10 : 3.0,
            targetWeight: targetWeight ? Number(targetWeight) : null,
            changeReason: "Initial plan publication",
          },
        },
      },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        client: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Notify client via conversation message if active
    if (isActivePlan) {
      const conv = await prisma.conversation.findFirst({
        where: {
          clientId,
          trainerId: trainerProfileId,
        },
      });

      if (conv) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: user.id,
            content: `🥗 I have published your updated Nutrition Plan: "${newPlan.name}" (${newPlan.dailyCalories} kcal • ${newPlan.proteinGrams}g Protein • ${newPlan.carbsGrams}g Carbs • ${newPlan.fatGrams}g Fat). Check your Nutrition tab to start logging meals!`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Nutrition plan successfully created.",
      plan: newPlan,
    });
  } catch (error: any) {
    console.error("Error creating nutrition plan:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create nutrition plan." },
      { status: 500 }
    );
  }
}
