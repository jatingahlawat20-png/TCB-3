import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return NextResponse.json(
        { error: "Unauthorized. Trainer account required." },
        { status: 401 }
      );
    }

    const packages = await prisma.coachingPackage.findMany({
      where: { trainerId: user.trainerProfile.id },
      orderBy: { price: "asc" },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error("Error fetching trainer packages:", error);
    return NextResponse.json(
      { error: "Failed to load packages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "TRAINER" || !user.trainerProfile) {
      return NextResponse.json(
        { error: "Unauthorized. Trainer account required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, duration, price, benefits, active } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Package name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return NextResponse.json(
        { error: "Valid package price is required" },
        { status: 400 }
      );
    }

    const parsedBenefits: string[] = Array.isArray(benefits)
      ? benefits.map((b: string) => String(b).trim()).filter(Boolean)
      : typeof benefits === "string"
      ? benefits.split("\n").map((b) => b.trim()).filter(Boolean)
      : ["Personalized programming", "Weekly check-ins"];

    const newPackage = await prisma.coachingPackage.create({
      data: {
        trainerId: user.trainerProfile.id,
        name: name.trim(),
        description: description ? description.trim() : "Custom coaching plan",
        duration: duration ? duration.trim() : "1 Month",
        price: numPrice,
        benefits: parsedBenefits,
        active: active !== undefined ? Boolean(active) : true,
      },
    });

    return NextResponse.json(
      {
        message: "Coaching package created successfully",
        package: newPackage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating package:", error);
    return NextResponse.json(
      { error: "Failed to create coaching package" },
      { status: 500 }
    );
  }
}
