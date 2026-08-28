import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingLog = await prisma.waterLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return NextResponse.json({ error: "Water log not found." }, { status: 404 });
    }

    if (existingLog.clientId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.waterLog.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Water entry deleted.",
    });
  } catch (error: any) {
    console.error("Error deleting water log:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete water log." },
      { status: 500 }
    );
  }
}
