import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { clientId } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Authentication required." }, { status: 401 });
    }

    if (user.role !== "TRAINER" && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. Only coaches can access client progress metrics." },
        { status: 403 }
      );
    }

    if (user.role === "TRAINER") {
      if (!user.trainerProfile) {
        return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
      }

      // Strict security check: Active coaching relationship required
      const activeCoaching = await prisma.coachingRequest.findFirst({
        where: {
          trainerId: user.trainerProfile.id,
          clientId: clientId,
          status: "ACCEPTED",
        },
      });

      if (!activeCoaching) {
        return NextResponse.json(
          {
            error:
              "Forbidden. You do not have an active coaching relationship with this client.",
          },
          { status: 403 }
        );
      }
    }

    // 1. Fetch Client Profile
    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    // 2. Fetch Active Workout Program
    const activeProgram = await prisma.workoutProgram.findFirst({
      where: {
        clientId: clientId,
        isActive: true,
      },
      include: {
        workoutDays: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    });

    // 3. Fetch Workout Logs
    const workoutLogs = await prisma.workoutLog.findMany({
      where: { clientId: clientId },
      include: {
        exerciseLogs: {
          orderBy: { orderIndex: "asc" },
        },
        workoutDay: {
          select: { id: true, name: true, dayOfWeek: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 4. Calculate Analytics & Adherence Metrics
    const totalWorkoutsLogged = workoutLogs.length;
    const avgCompletionRate =
      totalWorkoutsLogged > 0
        ? Math.round(workoutLogs.reduce((acc, curr) => acc + curr.completionRate, 0) / totalWorkoutsLogged)
        : 0;

    const totalVolumeLifted = Math.round(
      workoutLogs.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0)
    );

    const logsWithRpe = workoutLogs.filter((l) => l.rpe !== null);
    const avgRpe =
      logsWithRpe.length > 0
        ? (logsWithRpe.reduce((acc, curr) => acc + (curr.rpe || 0), 0) / logsWithRpe.length).toFixed(1)
        : null;

    // Workouts completed in last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const workoutsThisWeek = workoutLogs.filter((l) => l.createdAt >= oneWeekAgo).length;

    // Expected weekly target
    const expectedWeeklyWorkouts = activeProgram?.workoutDays?.length || 3;
    const weeklyAdherence = Math.min(
      100,
      Math.round((workoutsThisWeek / Math.max(1, expectedWeeklyWorkouts)) * 100)
    );

    // Current week calculation
    let currentWeek = 1;
    let missedWorkoutsCount = 0;
    if (activeProgram) {
      const diffMs = Date.now() - new Date(activeProgram.startDate).getTime();
      const weeksElapsed = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
      currentWeek = Math.min(activeProgram.durationWeeks, weeksElapsed);
      const totalExpectedSoFar = weeksElapsed * expectedWeeklyWorkouts;
      missedWorkoutsCount = Math.max(0, totalExpectedSoFar - totalWorkoutsLogged);
    }

    // Weekly Volume & Activity Trend (past 4 weeks)
    const weeklyVolumeTrend: { label: string; volume: number; count: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const logsInPeriod = workoutLogs.filter(
        (l) => l.createdAt >= weekStart && l.createdAt < weekEnd
      );
      const vol = logsInPeriod.reduce((acc, curr) => acc + (curr.totalVolume || 0), 0);
      weeklyVolumeTrend.push({
        label: w === 0 ? "This Week" : `${w}w ago`,
        volume: Math.round(vol),
        count: logsInPeriod.length,
      });
    }

    // Recent exercise weight/rep progressions & Personal Bests
    const exerciseHistoryMap: Record<string, any[]> = {};
    const personalBests: { exerciseName: string; maxWeight: number; date: Date }[] = [];
    const maxWeightTracker: Record<string, { maxWeight: number; date: Date }> = {};

    workoutLogs.forEach((log) => {
      log.exerciseLogs.forEach((el) => {
        if (!exerciseHistoryMap[el.exerciseName]) {
          exerciseHistoryMap[el.exerciseName] = [];
        }
        if (exerciseHistoryMap[el.exerciseName].length < 6) {
          exerciseHistoryMap[el.exerciseName].push({
            date: log.createdAt,
            workoutName: log.workoutName,
            setsCompleted: el.setsCompleted,
            targetSets: el.targetSets,
            weight: el.actualWeight,
            reps: el.actualReps,
            volume: el.totalVolume,
            rpe: el.rpe,
            completed: el.isCompleted,
            notes: el.notes,
          });
        }

        // Track max weight
        if (el.actualWeight) {
          const weights = el.actualWeight.split(",").map((w: string) => parseFloat(w.replace(/[^\d.]/g, "")) || 0);
          const top = weights.length > 0 ? Math.max(...weights) : 0;
          if (top > 0) {
            if (!maxWeightTracker[el.exerciseName] || top > maxWeightTracker[el.exerciseName].maxWeight) {
              maxWeightTracker[el.exerciseName] = { maxWeight: top, date: log.createdAt };
            }
          }
        }
      });
    });

    Object.entries(maxWeightTracker).forEach(([name, data]) => {
      personalBests.push({
        exerciseName: name,
        maxWeight: data.maxWeight,
        date: data.date,
      });
    });

    // Client Feedback Stream (logs with ratings or notes)
    const feedbackStream = workoutLogs
      .filter((l) => l.difficultyRating || l.energyRating || l.feedbackNotes)
      .slice(0, 10)
      .map((l) => ({
        id: l.id,
        workoutName: l.workoutName,
        date: l.createdAt,
        difficultyRating: l.difficultyRating,
        energyRating: l.energyRating,
        feedbackNotes: l.feedbackNotes,
        completionRate: l.completionRate,
      }));

    return NextResponse.json({
      success: true,
      client,
      activeProgram,
      metrics: {
        totalWorkoutsLogged,
        avgCompletionRate,
        totalVolumeLifted,
        avgRpe,
        workoutsThisWeek,
        expectedWeeklyWorkouts,
        weeklyAdherence,
        currentWeek,
        totalWeeks: activeProgram?.durationWeeks || 4,
        missedWorkoutsCount,
      },
      weeklyVolumeTrend,
      personalBests,
      feedbackStream,
      recentLogs: workoutLogs.slice(0, 15),
      exerciseHistory: exerciseHistoryMap,
    });
  } catch (error: any) {
    console.error("Error fetching client progress:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch client progress." }, { status: 500 });
  }
}
