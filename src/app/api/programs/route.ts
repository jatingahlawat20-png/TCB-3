import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req?: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    if (user.role === "CLIENT") {
      const programs = await prisma.workoutProgram.findMany({
        where: { clientId: user.id },
        include: {
          trainer: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
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
            take: 10,
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({
        success: true,
        programs,
        activeProgram: programs.find((p) => p.isActive) || null,
      });
    }

    if (user.role === "TRAINER") {
      if (!user.trainerProfile) {
        return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
      }

      const programs = await prisma.workoutProgram.findMany({
        where: { trainerId: user.trainerProfile.id },
        include: {
          client: {
            select: { id: true, name: true, email: true },
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
            take: 5,
          },
        },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      });

      return NextResponse.json({
        success: true,
        programs,
      });
    }

    if (user.role === "ADMIN") {
      const programs = await prisma.workoutProgram.findMany({
        include: {
          client: { select: { id: true, name: true, email: true } },
          trainer: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
          workoutDays: {
            include: {
              exercises: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json({
        success: true,
        programs,
      });
    }

    return NextResponse.json({ error: "Invalid user role." }, { status: 403 });
  } catch (error: any) {
    console.error("Error fetching workout programs:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch programs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    if (user.role !== "TRAINER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only coaches and administrators can create workout programs." },
        { status: 403 }
      );
    }

    const trainerProfile = user.trainerProfile;
    if (!trainerProfile && user.role === "TRAINER") {
      return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
    }

    const body = await req.json();
    const {
      clientId,
      name,
      description,
      goal,
      durationWeeks,
      trainingFrequency,
      status,
      notes,
      startDate,
      endDate,
      weeklyStructure,
      workoutDays,
    } = body;

    // Validation: Client ID
    if (!clientId || typeof clientId !== "string") {
      return NextResponse.json({ error: "Missing or invalid required field: clientId." }, { status: 400 });
    }

    // Validation: Program metadata
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Program name must be at least 2 characters long." }, { status: 400 });
    }

    if (!goal || typeof goal !== "string" || goal.trim().length < 2) {
      return NextResponse.json({ error: "Training goal is required." }, { status: 400 });
    }

    const parsedDurationWeeks = parseInt(durationWeeks, 10) || 4;
    const programStatus = status === "DRAFT" || status === "ARCHIVED" || status === "COMPLETED" ? status : "ACTIVE";

    const parsedStart = startDate ? new Date(startDate) : new Date();
    if (isNaN(parsedStart.getTime())) {
      return NextResponse.json({ error: "Invalid start date provided." }, { status: 400 });
    }

    let parsedEnd: Date | null = null;
    if (endDate) {
      parsedEnd = new Date(endDate);
      if (isNaN(parsedEnd.getTime())) {
        return NextResponse.json({ error: "Invalid end date provided." }, { status: 400 });
      }
    } else {
      // Default end date to start + durationWeeks
      parsedEnd = new Date(parsedStart.getTime() + parsedDurationWeeks * 7 * 24 * 60 * 60 * 1000);
    }

    // Strict Security Authorization: Verify active coaching relationship
    if (user.role === "TRAINER" && trainerProfile) {
      const activeCoaching = await prisma.coachingRequest.findFirst({
        where: {
          trainerId: trainerProfile.id,
          clientId: clientId,
          status: "ACCEPTED",
        },
      });

      if (!activeCoaching) {
        return NextResponse.json(
          {
            error:
              "Forbidden. You do not have an active coaching relationship with this client. The client must be actively enrolled.",
          },
          { status: 403 }
        );
      }
    }

    // Validate Workout Days & Exercises structure
    if (!Array.isArray(workoutDays) || workoutDays.length === 0) {
      return NextResponse.json(
        { error: "A program must contain at least one workout day." },
        { status: 400 }
      );
    }

    for (let i = 0; i < workoutDays.length; i++) {
      const day = workoutDays[i];
      if (!day.name || typeof day.name !== "string" || day.name.trim().length === 0) {
        return NextResponse.json(
          { error: `Workout Day #${i + 1} is missing a valid name.` },
          { status: 400 }
        );
      }

      if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
        return NextResponse.json(
          { error: `Workout Day "${day.name}" must contain at least one exercise.` },
          { status: 400 }
        );
      }

      for (let j = 0; j < day.exercises.length; j++) {
        const ex = day.exercises[j];
        if (!ex.name || typeof ex.name !== "string" || ex.name.trim().length === 0) {
          return NextResponse.json(
            { error: `Exercise #${j + 1} on Day "${day.name}" is missing a name.` },
            { status: 400 }
          );
        }

        const sets = parseInt(ex.sets, 10);
        if (isNaN(sets) || sets < 1 || sets > 50) {
          return NextResponse.json(
            { error: `Exercise "${ex.name}" must have between 1 and 50 sets.` },
            { status: 400 }
          );
        }

        if (!ex.reps || typeof ex.reps !== "string") {
          return NextResponse.json(
            { error: `Exercise "${ex.name}" is missing target reps.` },
            { status: 400 }
          );
        }
      }
    }

    const trainerIdToUse = trainerProfile ? trainerProfile.id : body.trainerId;
    if (!trainerIdToUse) {
      return NextResponse.json({ error: "Missing trainer identity." }, { status: 400 });
    }

    // Transaction: Deactivate previous active programs if this one is active, then create
    const newProgram = await prisma.$transaction(async (tx) => {
      if (programStatus === "ACTIVE") {
        await tx.workoutProgram.updateMany({
          where: {
            clientId: clientId,
            isActive: true,
          },
          data: {
            isActive: false,
            status: "ARCHIVED",
          },
        });
      }

      return tx.workoutProgram.create({
        data: {
          trainerId: trainerIdToUse,
          clientId: clientId,
          name: name.trim(),
          description: description ? description.trim() : null,
          goal: goal.trim(),
          durationWeeks: parsedDurationWeeks,
          trainingFrequency: trainingFrequency ? trainingFrequency.trim() : `${workoutDays.length} days / week`,
          status: programStatus as any,
          notes: notes ? notes.trim() : null,
          startDate: parsedStart,
          endDate: parsedEnd,
          isActive: programStatus === "ACTIVE",
          weeklyStructure: weeklyStructure ? weeklyStructure.trim() : `${workoutDays.length} Days / Week`,
          workoutDays: {
            create: workoutDays.map((day: any, dayIdx: number) => ({
              name: day.name.trim(),
              weekNumber: parseInt(day.weekNumber, 10) || 1,
              dayOfWeek: typeof day.dayOfWeek === "number" ? day.dayOfWeek : null,
              orderIndex: dayIdx,
              description: day.description ? day.description.trim() : null,
              exercises: {
                create: day.exercises.map((ex: any, exIdx: number) => ({
                  name: ex.name.trim(),
                  muscleGroup: ex.muscleGroup ? ex.muscleGroup.trim() : "Full Body",
                  sets: parseInt(ex.sets, 10),
                  reps: String(ex.reps).trim(),
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
            })),
          },
        },
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

    // Notify client via conversation chat
    try {
      const conv = await prisma.conversation.findUnique({
        where: {
          clientId_trainerId: {
            clientId: clientId,
            trainerId: trainerIdToUse,
          },
        },
      });

      if (conv) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: user.id,
            content: `📋 New Workout Program Assigned: "${newProgram.name}" (${workoutDays.length} workout days). Open your Workouts tab to begin your training routine!`,
          },
        });
        await prisma.conversation.update({
          where: { id: conv.id },
          data: { updatedAt: new Date() },
        });
      }
    } catch (msgErr) {
      console.warn("Could not post workout program message to chat:", msgErr);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout program created and deployed successfully.",
        program: newProgram,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating workout program:", error);
    return NextResponse.json({ error: error?.message || "Failed to create workout program." }, { status: 500 });
  }
}
