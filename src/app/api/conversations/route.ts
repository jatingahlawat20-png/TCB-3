import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let whereClause: any = {};
    if (user.role === "CLIENT") {
      whereClause = { clientId: user.id };
    } else if (user.role === "TRAINER") {
      if (!user.trainerProfile) {
        return NextResponse.json({ conversations: [] });
      }
      whereClause = { trainerId: user.trainerProfile.id };
    } else {
      // ADMIN can see all
      whereClause = {};
    }

    const conversations = await prisma.conversation.findMany({
      where: whereClause,
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
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            senderId: true,
            content: true,
            messageType: true,
            readAt: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            messages: {
              where: {
                senderId: { not: user.id },
                readAt: null,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = conversations.map((conv) => {
      const isClient = user.role === "CLIENT";
      const otherParticipant = isClient
        ? {
            id: conv.trainer.user.id,
            name: conv.trainer.user.name,
            email: conv.trainer.user.email,
            specialty: conv.trainer.specialty,
            role: "TRAINER",
          }
        : {
            id: conv.client.id,
            name: conv.client.name,
            email: conv.client.email,
            specialty: null,
            role: "CLIENT",
          };

      return {
        id: conv.id,
        clientId: conv.clientId,
        trainerId: conv.trainerId,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherParticipant,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error: any) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { targetTrainerId, targetClientId } = body;

    let clientId: string;
    let trainerProfileId: string;

    if (user.role === "CLIENT") {
      clientId = user.id;

      if (!targetTrainerId) {
        return NextResponse.json(
          { error: "targetTrainerId is required for client" },
          { status: 400 }
        );
      }

      // Find trainer profile
      const profile = await prisma.trainerProfile.findFirst({
        where: {
          OR: [
            { id: String(targetTrainerId) },
            { id: `profile_${targetTrainerId}` },
            { userId: `trainer_${targetTrainerId}` },
            { userId: String(targetTrainerId) },
          ],
        },
      });

      if (!profile) {
        return NextResponse.json(
          { error: "Trainer profile not found" },
          { status: 404 }
        );
      }

      if ((profile.status !== "ACTIVE" && profile.status !== "PENDING") || !profile.isPublic) {
        return NextResponse.json(
          { error: "This coach is not currently active for new messages." },
          { status: 400 }
        );
      }

      trainerProfileId = profile.id;
    } else if (user.role === "TRAINER") {
      if (!user.trainerProfile) {
        return NextResponse.json(
          { error: "Trainer profile not found for authenticated user" },
          { status: 404 }
        );
      }

      trainerProfileId = user.trainerProfile.id;

      if (!targetClientId) {
        return NextResponse.json(
          { error: "targetClientId is required for trainer" },
          { status: 400 }
        );
      }

      const clientUser = await prisma.user.findUnique({
        where: { id: String(targetClientId) },
      });

      if (!clientUser) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      clientId = clientUser.id;
    } else {
      return NextResponse.json(
        { error: "Admin cannot initiate conversations directly" },
        { status: 403 }
      );
    }

    // Atomic find-or-create using composite unique constraint
    const conversation = await prisma.conversation.upsert({
      where: {
        clientId_trainerId: {
          clientId,
          trainerId: trainerProfileId,
        },
      },
      update: {},
      create: {
        clientId,
        trainerId: trainerProfileId,
      },
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
      },
    });

    return NextResponse.json({
      message: "Conversation ready",
      conversation,
    });
  } catch (error: any) {
    console.error("Error creating/finding conversation:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to initialize conversation" },
      { status: 500 }
    );
  }
}
