import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
      include: {
        client: {
          select: { id: true, name: true, email: true },
        },
        trainer: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        workoutDays: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
        workoutLogs: {
          orderBy: { createdAt: "desc" },
          include: {
            exerciseLogs: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    if (!program) {
      return NextResponse.json({ error: "Workout program not found." }, { status: 404 });
    }

    // Strict Authorization Guard
    if (user.role === "CLIENT" && program.clientId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden. You are not authorized to view another client's workout program." },
        { status: 403 }
      );
    }

    if (user.role === "TRAINER") {
      if (!user.trainerProfile || program.trainerId !== user.trainerProfile.id) {
        return NextResponse.json(
          { error: "Forbidden. You are not the assigned coach for this workout program." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      program,
    });
  } catch (error: any) {
    console.error("Error fetching program by ID:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch program." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
    });

    if (!program) {
      return NextResponse.json({ error: "Workout program not found." }, { status: 404 });
    }

    // Strict Authorization Guard
    if (user.role !== "ADMIN") {
      if (user.role !== "TRAINER" || !user.trainerProfile || program.trainerId !== user.trainerProfile.id) {
        return NextResponse.json(
          { error: "Forbidden. Only the assigned coach can modify this workout program." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      name,
      description,
      goal,
      durationWeeks,
      trainingFrequency,
      status,
      notes,
      startDate,
      endDate,
      isActive,
      weeklyStructure,
      workoutDays,
    } = body;

    const updateData: any = {};
    if (name && typeof name === "string") updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (goal && typeof goal === "string") updateData.goal = goal.trim();
    if (durationWeeks !== undefined) updateData.durationWeeks = parseInt(durationWeeks, 10) || 4;
    if (trainingFrequency !== undefined) updateData.trainingFrequency = trainingFrequency ? trainingFrequency.trim() : null;
    if (status && (status === "DRAFT" || status === "ACTIVE" || status === "COMPLETED" || status === "ARCHIVED")) {
      updateData.status = status;
      if (status === "ACTIVE") updateData.isActive = true;
      if (status === "ARCHIVED" || status === "COMPLETED") updateData.isActive = false;
    }
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
    if (weeklyStructure !== undefined) updateData.weeklyStructure = weeklyStructure ? weeklyStructure.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (startDate) {
      const parsedStart = new Date(startDate);
      if (!isNaN(parsedStart.getTime())) updateData.startDate = parsedStart;
    }
    if (endDate !== undefined) {
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (!isNaN(parsedEnd.getTime())) updateData.endDate = parsedEnd;
      } else {
        updateData.endDate = null;
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If updating workoutDays structure
      if (Array.isArray(workoutDays) && workoutDays.length > 0) {
        // Delete existing workout days & exercises
        await tx.workoutDay.deleteMany({
          where: { programId: id },
        });

        // Recreate with updated data
        for (let i = 0; i < workoutDays.length; i++) {
          const day = workoutDays[i];
          await tx.workoutDay.create({
            data: {
              programId: id,
              name: day.name.trim(),
              weekNumber: parseInt(day.weekNumber, 10) || 1,
              dayOfWeek: typeof day.dayOfWeek === "number" ? day.dayOfWeek : null,
              orderIndex: i,
              description: day.description ? day.description.trim() : null,
              exercises: {
                create: (day.exercises || []).map((ex: any, exIdx: number) => ({
                  name: ex.name.trim(),
                  muscleGroup: ex.muscleGroup ? ex.muscleGroup.trim() : "Full Body",
                  sets: parseInt(ex.sets, 10) || 3,
                  reps: String(ex.reps || "10").trim(),
                  targetWeight: ex.targetWeight ? String(ex.targetWeight).trim() : null,
                  rpeTarget: ex.rpeTarget ? String(ex.rpeTarget).trim() : null,
                  restSeconds: ex.restSeconds ? parseInt(ex.restSeconds, 10) : 60,
                  tempo: ex.tempo ? String(ex.tempo).trim() : null,
                  notes: ex.notes ? String(ex.notes).trim() : null,
                  videoUrl: ex.videoUrl ? String(ex.videoUrl).trim() : null,
                  isWarmup: Boolean(ex.isWarmup),
                  orderIndex: exIdx,
                })),
              },
            },
          });
        }
      }

      return tx.workoutProgram.update({
        where: { id },
        data: updateData,
        include: {
          workoutDays: {
            orderBy: [{ weekNumber: "asc" }, { orderIndex: "asc" }],
            include: {
              exercises: {
                orderBy: { orderIndex: "asc" },
              },
            },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Workout program updated successfully.",
      program: updated,
    });
  } catch (error: any) {
    console.error("Error updating workout program:", error);
    return NextResponse.json({ error: error?.message || "Failed to update program." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    const program = await prisma.workoutProgram.findUnique({
      where: { id },
    });

    if (!program) {
      return NextResponse.json({ error: "Workout program not found." }, { status: 404 });
    }

    // Strict Authorization Guard
    if (user.role !== "ADMIN") {
      if (user.role !== "TRAINER" || !user.trainerProfile || program.trainerId !== user.trainerProfile.id) {
        return NextResponse.json(
          { error: "Forbidden. Only the assigned coach can delete this workout program." },
          { status: 403 }
        );
      }
    }

    await prisma.workoutProgram.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Workout program deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting workout program:", error);
    return NextResponse.json({ error: error?.message || "Failed to delete program." }, { status: 500 });
  }
}
