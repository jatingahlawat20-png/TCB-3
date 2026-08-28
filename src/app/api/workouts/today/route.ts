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

    // If a trainer requests today's workout for a specific client
    if (requestedClientId) {
      if (user.role !== "TRAINER" && user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden. Only coaches can inspect other clients' workouts." },
          { status: 403 }
        );
      }

      if (user.role === "TRAINER") {
        if (!user.trainerProfile) {
          return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
        }

        // Verify active coaching relationship
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

    // 1. Fetch active program for target client
    const activeProgram = await prisma.workoutProgram.findFirst({
      where: {
        clientId: targetClientId,
        isActive: true,
      },
      include: {
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

    if (!activeProgram || activeProgram.workoutDays.length === 0) {
      return NextResponse.json({
        success: true,
        hasProgram: false,
        activeProgram: null,
        todayWorkout: null,
        isCompletedToday: false,
        currentWeek: 1,
        totalWeeks: 4,
        weeklyCompletionPercent: 0,
        upcomingWorkouts: [],
      });
    }

    // 2. Compute current week in program
    const now = new Date();
    const startMs = new Date(activeProgram.startDate).getTime();
    const diffMs = now.getTime() - startMs;
    const computedWeek = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1;
    const currentWeek = Math.max(1, Math.min(activeProgram.durationWeeks, computedWeek));

    // Filter days for current week or general split
    const currentWeekDays = activeProgram.workoutDays.filter(
      (d) => d.weekNumber === currentWeek || d.weekNumber === 1
    );
    const candidateDays = currentWeekDays.length > 0 ? currentWeekDays : activeProgram.workoutDays;

    // 3. Identify today's workout day
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

    // Match by exact day of week first
    let todayWorkout = candidateDays.find((d) => d.dayOfWeek === currentDayOfWeek);

    // If not assigned to specific day of week, pick by rotation based on completed logs
    if (!todayWorkout) {
      const logsCount = await prisma.workoutLog.count({
        where: {
          clientId: targetClientId,
          programId: activeProgram.id,
        },
      });

      const dayIndex = logsCount % candidateDays.length;
      todayWorkout = candidateDays[dayIndex] || candidateDays[0];
    }

    // 4. Check if today's workout is already completed today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayLog = await prisma.workoutLog.findFirst({
      where: {
        clientId: targetClientId,
        workoutDayId: todayWorkout.id,
        createdAt: { gte: startOfToday },
      },
      include: {
        exerciseLogs: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // 5. Progressive Overload: Fetch Previous Performance for each exercise
    const exercisesWithPrevious = await Promise.all(
      todayWorkout.exercises.map(async (ex) => {
        const lastLog = await prisma.exerciseLog.findFirst({
          where: {
            workoutLog: { clientId: targetClientId },
            exerciseName: { equals: ex.name, mode: "insensitive" },
            isCompleted: true,
          },
          orderBy: { createdAt: "desc" },
          select: {
            actualWeight: true,
            actualReps: true,
            setsCompleted: true,
            rpe: true,
            createdAt: true,
          },
        });

        return {
          ...ex,
          previousPerformance: lastLog
            ? {
                actualWeight: lastLog.actualWeight,
                actualReps: lastLog.actualReps,
                setsCompleted: lastLog.setsCompleted,
                rpe: lastLog.rpe,
                date: lastLog.createdAt,
              }
            : null,
        };
      })
    );

    // 6. Weekly completion metrics
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diffToMonday = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const thisWeekLogsCount = await prisma.workoutLog.count({
      where: {
        clientId: targetClientId,
        createdAt: { gte: startOfWeek },
      },
    });

    const plannedDaysPerWeek = candidateDays.length || 3;
    const weeklyCompletionPercent = Math.min(100, Math.round((thisWeekLogsCount / plannedDaysPerWeek) * 100));

    // Upcoming workouts (other days in the current routine)
    const upcomingWorkouts = candidateDays.filter((d) => d.id !== todayWorkout?.id);

    return NextResponse.json({
      success: true,
      hasProgram: true,
      activeProgram: {
        id: activeProgram.id,
        name: activeProgram.name,
        goal: activeProgram.goal,
        durationWeeks: activeProgram.durationWeeks,
        trainingFrequency: activeProgram.trainingFrequency,
        notes: activeProgram.notes,
        status: activeProgram.status,
        weeklyStructure: activeProgram.weeklyStructure,
        startDate: activeProgram.startDate,
        endDate: activeProgram.endDate,
        trainer: activeProgram.trainer,
        totalDays: activeProgram.workoutDays.length,
      },
      currentWeek,
      totalWeeks: activeProgram.durationWeeks,
      weeklyCompletionPercent,
      thisWeekLogsCount,
      plannedDaysPerWeek,
      todayWorkout: {
        ...todayWorkout,
        exercises: exercisesWithPrevious,
      },
      upcomingWorkouts,
      isCompletedToday: Boolean(todayLog),
      todayLog: todayLog || null,
    });
  } catch (error: any) {
    console.error("Error fetching today's workout:", error);
    return NextResponse.json({ error: error?.message || "Failed to fetch today's workout." }, { status: 500 });
  }
}
