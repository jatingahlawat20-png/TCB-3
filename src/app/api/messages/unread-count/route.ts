import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    let conversationIds: string[] = [];

    if (user.role === "CLIENT") {
      const convs = await prisma.conversation.findMany({
        where: { clientId: user.id },
        select: { id: true },
      });
      conversationIds = convs.map((c) => c.id);
    } else if (user.role === "TRAINER" && user.trainerProfile) {
      const convs = await prisma.conversation.findMany({
        where: { trainerId: user.trainerProfile.id },
        select: { id: true },
      });
      conversationIds = convs.map((c) => c.id);
    }

    if (conversationIds.length === 0) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const unreadCount = await prisma.message.count({
      where: {
        conversationId: { in: conversationIds },
        senderId: { not: user.id },
        readAt: null,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
