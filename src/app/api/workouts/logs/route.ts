import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedClientId = searchParams.get("clientId");

    let targetClientId = user.id;

    if (requestedClientId) {
      if (user.role !== "TRAINER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden. Only coaches can view client workout logs." },
          { status: 403 }
        );
      }

      if (user.role === "TRAINER") {
        if (!user.trainerProfile) {
          return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
        }

        // Verify active relationship
        const activeCoaching = await prisma.coachingRequest.findFirst({
          where: {
            trainerId: user.trainerProfile.id,
            clientId: requestedClientId,
            status: "ACCEPTED",
          },
        });

        if (!activeCoaching) {
          return NextResponse.json(
            { error: "Forbidden. You do not have an active coaching relationship with this client." },
            { status: 403 }
          );
        }
      }

      targetClientId = requestedClientId;
    }

    const logs = await prisma.workoutLog.findMany({
      where: { clientId: targetClientId },
      include: {
        program: {
          select: { id: true, name: true, goal: true },
        },
        workoutDay: {
          select: { id: true, name: true, dayOfWeek: true },
        },
        exerciseLogs: {
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error("Error fetching workout logs:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch workout logs." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    if (user.role !== "CLIENT" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only clients can record personal workout logs." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      workoutDayId,
      programId,
      workoutName,
      durationMinutes,
      rpe,
      difficultyRating,
      energyRating,
      feedbackNotes,
      notes,
      exerciseLogs,
    } = body;

    if (!workoutName || typeof workoutName !== "string" || workoutName.trim().length === 0) {
      return NextResponse.json({ error: "Workout name is required." }, { status: 400 });
    }

    if (!Array.isArray(exerciseLogs) || exerciseLogs.length === 0) {
      return NextResponse.json(
        { error: "A workout log must contain at least one exercise entry." },
        { status: 400 }
      );
    }

    // Helper: Parse numeric volume from string sets (e.g. weight "80kg, 80kg" & reps "8, 8")
    function computeExerciseVolume(weightStr?: string | null, repsStr?: string | null): number {
      if (!weightStr || !repsStr) return 0;
      const weights = weightStr.split(",").map((w) => parseFloat(w.replace(/[^\d.]/g, "")) || 0);
      const reps = repsStr.split(",").map((r) => parseFloat(r.replace(/[^\d.]/g, "")) || 0);
      let volume = 0;
      for (let i = 0; i < Math.max(weights.length, reps.length); i++) {
        const w = weights[i] !== undefined ? weights[i] : weights[weights.length - 1] || 0;
        const r = reps[i] !== undefined ? reps[i] : reps[reps.length - 1] || 0;
        volume += w * r;
      }
      return Math.round(volume * 10) / 10;
    }

    function extractMaxWeight(weightStr?: string | null): number {
      if (!weightStr) return 0;
      const weights = weightStr.split(",").map((w) => parseFloat(w.replace(/[^\d.]/g, "")) || 0);
      return weights.length > 0 ? Math.max(...weights) : 0;
    }

    // Calculate completion percentage and total volume
    let completedExercises = 0;
    let totalSessionVolume = 0;
    let isSessionPr = false;

    // Process exercises with PR checks
    const processedExerciseLogs = await Promise.all(
      exerciseLogs.map(async (el: any, idx: number) => {
        if (el.isCompleted) completedExercises++;
        const exVol = computeExerciseVolume(el.actualWeight, el.actualReps);
        totalSessionVolume += exVol;

        const maxWeight = extractMaxWeight(el.actualWeight);
        let isExPr = false;

        if (maxWeight > 0 && el.exerciseName) {
          const prevHighest = await prisma.exerciseLog.findFirst({
            where: {
              workoutLog: { clientId: user.id },
              exerciseName: { equals: el.exerciseName.trim(), mode: "insensitive" },
              isCompleted: true,
            },
            orderBy: { createdAt: "desc" },
            select: { actualWeight: true },
          });

          if (prevHighest) {
            const prevMax = extractMaxWeight(prevHighest.actualWeight);
            if (maxWeight > prevMax) {
              isExPr = true;
              isSessionPr = true;
            }
          }
        }

        return {
          workoutExerciseId: el.workoutExerciseId || null,
          exerciseName: String(el.exerciseName || `Exercise #${idx + 1}`).trim(),
          setsCompleted: parseInt(el.setsCompleted, 10) || 0,
          targetSets: parseInt(el.targetSets, 10) || 0,
          actualReps: el.actualReps ? String(el.actualReps).trim() : null,
          actualWeight: el.actualWeight ? String(el.actualWeight).trim() : null,
          rpe: el.rpe ? parseInt(el.rpe, 10) : null,
          totalVolume: exVol,
          isPersonalBest: isExPr,
          isCompleted: Boolean(el.isCompleted),
          notes: el.notes ? String(el.notes).trim() : null,
          orderIndex: idx,
        };
      })
    );

    const completionRate = Math.round((completedExercises / exerciseLogs.length) * 100);
    const parsedRpe = rpe ? Math.min(10, Math.max(1, parseInt(rpe, 10))) : null;
    const parsedDifficulty = difficultyRating ? Math.min(5, Math.max(1, parseInt(difficultyRating, 10))) : null;
    const parsedEnergy = energyRating ? Math.min(5, Math.max(1, parseInt(energyRating, 10))) : null;
    const parsedDuration = durationMinutes ? parseInt(durationMinutes, 10) : 45;

    // Strict Server-Side Identity: Always use authenticated user's ID
    const clientId = user.id;

    // Optional verification of program/workoutDay if provided
    let verifiedProgramId: string | null = null;
    let verifiedWorkoutDayId: string | null = null;
    let programCoachId: string | null = null;

    if (programId) {
      const prog = await prisma.workoutProgram.findFirst({
        where: { id: programId, clientId: user.id },
        include: { trainer: true },
      });
      if (prog) {
        verifiedProgramId = prog.id;
        programCoachId = prog.trainerId;
      }
    }

    if (workoutDayId) {
      const day = await prisma.workoutDay.findUnique({
        where: { id: workoutDayId },
      });
      if (day) verifiedWorkoutDayId = day.id;
    }

    const newLog = await prisma.workoutLog.create({
      data: {
        clientId,
        programId: verifiedProgramId,
        workoutDayId: verifiedWorkoutDayId,
        workoutName: workoutName.trim(),
        completedAt: new Date(),
        durationMinutes: parsedDuration,
        completionRate,
        totalVolume: Math.round(totalSessionVolume * 10) / 10,
        rpe: parsedRpe,
        difficultyRating: parsedDifficulty,
        energyRating: parsedEnergy,
        feedbackNotes: feedbackNotes ? feedbackNotes.trim() : null,
        notes: notes ? notes.trim() : null,
        isPersonalBest: isSessionPr,
        exerciseLogs: {
          create: processedExerciseLogs,
        },
      },
      include: {
        program: {
          select: { id: true, name: true, goal: true },
        },
        workoutDay: {
          select: { id: true, name: true, dayOfWeek: true },
        },
        exerciseLogs: {
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    // Notify coach in conversation if client left feedback or hit a PR
    if (programCoachId) {
      try {
        const conv = await prisma.conversation.findUnique({
          where: {
            clientId_trainerId: {
              clientId: user.id,
              trainerId: programCoachId,
            },
          },
        });

        if (conv) {
          const prBadge = isSessionPr ? " 🏆 New Personal Best recorded!" : "";
          const feedbackMsg = feedbackNotes ? `\n💬 Note: "${feedbackNotes}"` : "";
          await prisma.message.create({
            data: {
              conversationId: conv.id,
              senderId: user.id,
              content: `✅ Workout Completed: "${newLog.workoutName}" (${completionRate}% completed, ${parsedDuration} mins, ${Math.round(totalSessionVolume)} kg volume).${prBadge}${feedbackMsg}`,
            },
          });
          await prisma.conversation.update({
            where: { id: conv.id },
            data: { updatedAt: new Date() },
          });
        }
      } catch (chatErr) {
        console.warn("Could not post workout completion update to chat:", chatErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Workout completed and logged successfully! Great work!",
        workoutLog: newLog,
        totalVolume: totalSessionVolume,
        isPersonalBest: isSessionPr,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating workout log:", error);
    return NextResponse.json({ error: error?.message || "Failed to log workout." }, { status: 500 });
  }
}
