import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/landing/v2/navbar/navbar";
import { Footer } from "@/components/landing/v2/footer/footer";
import { ChatView, type ConversationItem } from "@/components/chat/chat-view";

export const dynamic = "force-dynamic";

type MessagesPageProps = {
  searchParams: Promise<{
    conversationId?: string;
    trainerId?: string;
    clientId?: string;
  }>;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const user = await requireUser(["CLIENT", "TRAINER", "ADMIN"]);
  const { conversationId, trainerId, clientId } = await searchParams;

  let activeId: string | null = conversationId || null;

  // Auto-create/resolve conversation if target trainerId/clientId is provided in URL
  if (!activeId) {
    if (user.role === "CLIENT" && trainerId) {
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

      if (profile) {
        const conv = await prisma.conversation.upsert({
          where: {
            clientId_trainerId: {
              clientId: user.id,
              trainerId: profile.id,
            },
          },
          update: {},
          create: {
            clientId: user.id,
            trainerId: profile.id,
          },
        });
        activeId = conv.id;
      }
    } else if (user.role === "TRAINER" && user.trainerProfile && clientId) {
      const conv = await prisma.conversation.upsert({
        where: {
          clientId_trainerId: {
            clientId: String(clientId),
            trainerId: user.trainerProfile.id,
          },
        },
        update: {},
        create: {
          clientId: String(clientId),
          trainerId: user.trainerProfile.id,
        },
      });
      activeId = conv.id;
    }
  }

  // Fetch all conversations for current user
  let whereClause: any = {};
  if (user.role === "CLIENT") {
    whereClause = { clientId: user.id };
  } else if (user.role === "TRAINER") {
    if (user.trainerProfile) {
      whereClause = { trainerId: user.trainerProfile.id };
    }
  }

  const rawConversations = await prisma.conversation.findMany({
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

  const formattedConversations: ConversationItem[] = rawConversations.map((conv) => {
    const isClient = user.role === "CLIENT";
    const otherParticipant = isClient
      ? {
          id: conv.trainer.user.id,
          name: conv.trainer.user.name,
          email: conv.trainer.user.email,
          specialty: conv.trainer.specialty,
          role: "TRAINER" as const,
        }
      : {
          id: conv.client.id,
          name: conv.client.name,
          email: conv.client.email,
          specialty: null,
          role: "CLIENT" as const,
        };

    return {
      id: conv.id,
      clientId: conv.clientId,
      trainerId: conv.trainerId,
      createdAt: conv.createdAt.toISOString(),
      updatedAt: conv.updatedAt.toISOString(),
      otherParticipant,
      lastMessage: conv.messages[0]
        ? {
            ...conv.messages[0],
            createdAt: conv.messages[0].createdAt.toISOString(),
            readAt: conv.messages[0].readAt?.toISOString() || null,
          }
        : null,
      unreadCount: conv._count.messages,
    };
  });

  if (!activeId && formattedConversations.length > 0) {
    activeId = formattedConversations[0].id;
  }

  return (
    <main className="min-h-screen bg-[#080B0F] text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <ChatView
          currentUser={{
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }}
          initialConversations={formattedConversations}
          initialActiveId={activeId}
        />
      </section>

      <Footer />
    </main>
  );
}
