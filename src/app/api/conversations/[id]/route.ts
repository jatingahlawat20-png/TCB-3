import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trainer: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            senderId: true,
            content: true,
            messageType: true,
            mediaUrl: true,
            readAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Strict Authorization Check: User must be conversation client or conversation trainer
    const isClient = conversation.clientId === user.id;
    const isTrainer = conversation.trainer.userId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isClient && !isTrainer && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden. You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    // Automatically mark all unread messages from the other user as read
    const unreadMessagesCount = await prisma.message.count({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        readAt: null,
      },
    });

    if (unreadMessagesCount > 0) {
      await prisma.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: user.id },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });
    }

    const otherParticipant = isClient
      ? {
          id: conversation.trainer.user.id,
          name: conversation.trainer.user.name,
          email: conversation.trainer.user.email,
          specialty: conversation.trainer.specialty,
          role: "TRAINER",
        }
      : {
          id: conversation.client.id,
          name: conversation.client.name,
          email: conversation.client.email,
          specialty: null,
          role: "CLIENT",
        };

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        clientId: conversation.clientId,
        trainerId: conversation.trainerId,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        otherParticipant,
        messages: conversation.messages,
      },
    });
  } catch (error: any) {
    console.error("Error retrieving conversation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch conversation" },
      { status: 500 }
    );
  }
}
