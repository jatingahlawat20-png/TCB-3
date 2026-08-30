import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to submit coaching request" },
        { status: 401 }
      );
    }

    if (user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Only client accounts can submit coaching requests." },
        { status: 403 }
      );
    }

    const { trainerId, packageId, message, goal, startDate } = await request.json();

    if (!trainerId || !message || !goal) {
      return NextResponse.json(
        { error: "Missing required fields (trainerId, message, goal)" },
        { status: 400 }
      );
    }

    // Find trainer profile
    const profile = await prisma.trainerProfile.findFirst({
      where: {
        OR: [
          { id: String(trainerId) },
          { id: `profile_${trainerId}` },
          { userId: `trainer_${trainerId}` },
          { userId: String(trainerId) },
        ],
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Trainer profile not found in database" },
        { status: 404 }
      );
    }

    if ((profile.status !== "ACTIVE" && profile.status !== "PENDING") || !profile.isPublic) {
      return NextResponse.json(
        { error: "This coach is currently not accepting new client applications." },
        { status: 400 }
      );
    }

    // Server-side active relationship & duplicate pending request prevention
    const existingActive = await prisma.coachingRequest.findFirst({
      where: {
        clientId: user.id,
        trainerId: profile.id,
        status: "ACCEPTED",
      },
    });

    if (existingActive) {
      return NextResponse.json(
        {
          error: "You already have an active coaching relationship with this coach. Manage your coaching in your client dashboard.",
        },
        { status: 409 }
      );
    }

    const existingPending = await prisma.coachingRequest.findFirst({
      where: {
        clientId: user.id,
        trainerId: profile.id,
        status: "PENDING",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        {
          error: "You already have an active pending coaching request with this coach. Please wait for their response.",
        },
        { status: 409 }
      );
    }

    // Verify package if provided
    let verifiedPackageId: string | null = null;
    if (packageId) {
      const pkg = await prisma.coachingPackage.findFirst({
        where: {
          id: String(packageId),
          trainerId: profile.id,
        },
      });
      if (pkg) {
        verifiedPackageId = pkg.id;
      }
    }

    // If no packageId provided, pick first active package for this trainer
    if (!verifiedPackageId) {
      const defaultPkg = await prisma.coachingPackage.findFirst({
        where: {
          trainerId: profile.id,
          active: true,
        },
      });
      if (defaultPkg) {
        verifiedPackageId = defaultPkg.id;
      }
    }

    const parsedDate = startDate ? new Date(startDate) : new Date();

    const newRequest = await prisma.coachingRequest.create({
      data: {
        clientId: user.id,
        trainerId: profile.id,
        packageId: verifiedPackageId,
        message: message.trim(),
        goal: goal.trim(),
        startDate: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        status: "PENDING",
      },
      include: {
        package: true,
        trainer: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Coaching request sent successfully",
        request: newRequest,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Coaching request creation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send coaching request" },
      { status: 500 }
    );
  }
}
