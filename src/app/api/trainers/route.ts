import { NextResponse } from "next/server";
import { getAllTrainers } from "@/lib/trainers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || searchParams.get("filter") || undefined;
    const minPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const maxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

    const trainers = await getAllTrainers({
      search,
      category,
      minPrice,
      maxPrice,
    });

    return NextResponse.json({
      trainers,
      count: trainers.length,
    });
  } catch (error) {
    console.error("Error in GET /api/trainers:", error);
    return NextResponse.json(
      { error: "Failed to load trainers" },
      { status: 500 }
    );
  }
}
