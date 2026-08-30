import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only administrators can reject trainer verification." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const normalizedId = String(id).trim();

    const body = await req.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
      return NextResponse.json(
        { error: "A clear rejection reason or requested change is required." },
        { status: 400 }
      );
    }

    // Locate trainer profile by ID or userId
    const existingProfile = await prisma.trainerProfile.findFirst({
      where: {
        OR: [
          { id: normalizedId },
          { id: `profile_${normalizedId}` },
          { userId: normalizedId },
          { userId: `trainer_${normalizedId}` },
        ],
      },
      include: { user: true },
    });

    if (!existingProfile) {
      return NextResponse.json({ error: "Trainer profile not found." }, { status: 404 });
    }

    // Remove any older rejection tags and add the new rejection reason tag
    const baseTags = existingProfile.tags.filter(
      (t) => !t.startsWith("rejection_reason:")
    );
    const updatedTags = [...baseTags, `rejection_reason:${reason.trim()}`];

    // Atomically set status to INACTIVE and unverified
    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: existingProfile.id },
      data: {
        verified: false,
        status: "INACTIVE",
        tags: updatedTags,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(`[Admin Rejection] Coach ${updatedProfile.user.name} (${updatedProfile.id}) set to needs changes with reason: "${reason}".`);

    return NextResponse.json({
      success: true,
      message: `Coach ${updatedProfile.user.name} verification set to 'Needs Changes'. Reason recorded.`,
      profile: updatedProfile,
      reason: reason.trim(),
    });
  } catch (error: any) {
    console.error("Error rejecting trainer:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error rejecting trainer" },
      { status: 500 }
    );
  }
}
