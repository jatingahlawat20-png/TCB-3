import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return NextResponse.json(
        { error: "Unauthorized. Trainer account required." },
        { status: 401 }
      );
    }

    const existingPackage = await prisma.coachingPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Coaching package not found" },
        { status: 404 }
      );
    }

    if (existingPackage.trainerId !== user.trainerProfile.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this coaching package." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, duration, price, benefits, active } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (description !== undefined) updateData.description = String(description).trim();
    if (duration !== undefined) updateData.duration = String(duration).trim();
    if (price !== undefined) {
      const num = Number(price);
      if (!isNaN(num) && num >= 0) updateData.price = num;
    }
    if (benefits !== undefined) {
      updateData.benefits = Array.isArray(benefits)
        ? benefits.map((b: string) => String(b).trim()).filter(Boolean)
        : typeof benefits === "string"
        ? benefits.split("\n").map((b) => b.trim()).filter(Boolean)
        : existingPackage.benefits;
    }
    if (active !== undefined) updateData.active = Boolean(active);

    const updatedPackage = await prisma.coachingPackage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Package updated successfully",
      package: updatedPackage,
    });
  } catch (error) {
    console.error("Error updating package:", error);
    return NextResponse.json(
      { error: "Failed to update package" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return NextResponse.json(
        { error: "Unauthorized. Trainer account required." },
        { status: 401 }
      );
    }

    const existingPackage = await prisma.coachingPackage.findUnique({
      where: { id },
    });

    if (!existingPackage) {
      return NextResponse.json(
        { error: "Coaching package not found" },
        { status: 404 }
      );
    }

    if (existingPackage.trainerId !== user.trainerProfile.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this coaching package." },
        { status: 403 }
      );
    }

    await prisma.coachingPackage.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Coaching package deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    return NextResponse.json(
      { error: "Failed to delete package" },
      { status: 500 }
    );
  }
}
