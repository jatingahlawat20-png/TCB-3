import { NextResponse } from "next/server";
import { getTrainerById } from "@/lib/trainers";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const trainer = await getTrainerById(id);

    if (!trainer) {
      return NextResponse.json(
        { error: "Trainer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ trainer });
  } catch (error) {
    console.error("Error in GET /api/trainers/[id]:", error);
    return NextResponse.json(
      { error: "Failed to load trainer details" },
      { status: 500 }
    );
  }
}
