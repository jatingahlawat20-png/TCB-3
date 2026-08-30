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
        { error: "Forbidden: Only administrators can approve trainer verification." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const normalizedId = String(id).trim();

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

    // Filter out any previous rejection reasons from tags
    const cleanTags = existingProfile.tags.filter(
      (t) => !t.startsWith("rejection_reason:")
    );

    // Atomically approve and activate trainer
    const updatedProfile = await prisma.trainerProfile.update({
      where: { id: existingProfile.id },
      data: {
        verified: true,
        status: "ACTIVE",
        isPublic: true,
        tags: cleanTags,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    console.log(`[Admin Approval] Coach ${updatedProfile.user.name} (${updatedProfile.id}) verified by admin ${user.email}.`);

    return NextResponse.json({
      success: true,
      message: `Coach ${updatedProfile.user.name} has been verified and activated on the public marketplace.`,
      profile: updatedProfile,
    });
  } catch (error: any) {
    console.error("Error approving trainer:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error approving trainer" },
      { status: 500 }
    );
  }
}
