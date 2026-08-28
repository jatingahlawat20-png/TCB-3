import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to send messages" },
        { status: 401 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        trainer: true,
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Strict Server-Side Authorization Check
    const isClient = conversation.clientId === user.id;
    const isTrainer = conversation.trainer.userId === user.id;

    if (!isClient && !isTrainer && user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden. You cannot send messages in this conversation." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { content, messageType, mediaUrl } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    const trimmedContent = content.trim();

    if (trimmedContent.length > 2000) {
      return NextResponse.json(
        { error: "Message length exceeds maximum limit (2000 characters)" },
        { status: 400 }
      );
    }

    // Persist message with sender derived strictly from authenticated session
    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        content: trimmedContent,
        messageType: messageType || "TEXT",
        mediaUrl: mediaUrl || null,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        readAt: true,
        createdAt: true,
      },
    });

    // Update conversation updatedAt for sorting
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(
      {
        message: "Message sent successfully",
        data: newMessage,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
