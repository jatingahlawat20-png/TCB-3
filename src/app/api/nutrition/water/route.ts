import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseDateRange(dateParam?: string | null) {
  let targetDate: Date;
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    const [year, month, day] = dateParam.split("-").map((n) => parseInt(n, 10));
    targetDate = new Date(year, month - 1, day);
  } else {
    targetDate = new Date();
  }

  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  return { startOfDay, endOfDay, targetDate };
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const { startOfDay, endOfDay } = parseDateRange(dateParam);

    const waterLogs = await prisma.waterLog.findMany({
      where: {
        clientId: user.id,
        loggedDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalLiters = Math.round(
      waterLogs.reduce((acc, curr) => acc + (curr.amountLiters || 0), 0) * 10
    ) / 10;

    return NextResponse.json({
      success: true,
      waterLogs,
      totalLiters,
    });
  } catch (error: any) {
    console.error("Error fetching water logs:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch water logs." },
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

    const body = await req.json();
    const { amountLiters, loggedDate } = body;

    const parsedAmount = parseFloat(amountLiters);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Water amount in liters must be greater than 0." },
        { status: 400 }
      );
    }

    let targetDate = new Date();
    if (loggedDate && /^\d{4}-\d{2}-\d{2}$/.test(loggedDate)) {
      const [y, m, d] = loggedDate.split("-").map((n: string) => parseInt(n, 10));
      targetDate = new Date(y, m - 1, d, 12, 0, 0);
    } else if (loggedDate) {
      targetDate = new Date(loggedDate);
    }

    const newWaterLog = await prisma.waterLog.create({
      data: {
        clientId: user.id,
        amountLiters: Math.round(parsedAmount * 100) / 100,
        loggedDate: targetDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Hydration logged.",
      waterLog: newWaterLog,
    });
  } catch (error: any) {
    console.error("Error logging water:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to log water." },
      { status: 500 }
    );
  }
}
