import { NextResponse } from "next/server";
import { seedTrainersIfEmpty } from "@/lib/seed";

export async function GET() {
  const result = await seedTrainersIfEmpty();
  return NextResponse.json(result);
}
