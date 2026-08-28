"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type Participant = {
  id: string;
  name: string;
  email: string;
  specialty?: string | null;
  role: "CLIENT" | "TRAINER";
};

export type MessageItem = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: "TEXT" | "IMAGE" | "VIDEO" | "FILE";
  mediaUrl?: string | null;
  readAt?: Date | string | null;
  createdAt: Date | string;
};

export type ConversationItem = {
  id: string;
  clientId: string;
  trainerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  otherParticipant: Participant;
  lastMessage?: {
    id: string;
    senderId: string;
    content: string;
    createdAt: Date | string;
    readAt?: Date | string | null;
  } | null;
  unreadCount: number;
};

type ChatViewProps = {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: "CLIENT" | "TRAINER" | "ADMIN";
  };
  initialConversations: ConversationItem[];
  initialActiveId?: string | null;
};

export function ChatView({
  currentUser,
  initialConversations,
  initialActiveId,
}: ChatViewProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    initialActiveId || initialConversations[0]?.id || null
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileList, setShowMobileList] = useState(!initialActiveId && initialConversations.length > 0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewUnreadInView, setHasNewUnreadInView] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const prevActiveIdRef = useRef<string | null>(null);
  const prevMessagesCountRef = useRef<number>(0);

  // Ensure window document stays at top when opening messages
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  // Dedicated internal container auto-scroll (NEVER touches window/document)
  const scrollToBottom = useCallback((smooth = true) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    if (smooth) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
    setHasNewUnreadInView(false);
    setIsNearBottom(true);
  }, []);

  // Track internal scroll position to know if user is reading older messages
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 80; // px tolerance from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const isAtBottom = distanceFromBottom <= threshold;

    setIsNearBottom(isAtBottom);
    if (isAtBottom) {
      setHasNewUnreadInView(false);
    }
  }, []);

  // Fetch messages for active conversation and mark as read
  const loadMessages = useCallback(async (convId: string, showLoader = false) => {
    if (showLoader) setIsLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${convId}`);
      if (res.ok) {
        const data = await res.json();
        const incomingMessages = data.conversation?.messages || [];
        setMessages(incomingMessages);

        // Clear local unread count for this conversation
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error("Error loading conversation messages:", err);
    } finally {
      if (showLoader) setIsLoadingMessages(false);
    }
  }, []);

  // Fetch updated conversations list
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Error refreshing conversations:", err);
    }
  }, []);

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId, true);
      setShowMobileList(false);
    }
  }, [activeConversationId, loadMessages]);

  // Smart internal scroll handling on message updates
  useEffect(() => {
    const isConvSwitch = prevActiveIdRef.current !== activeConversationId;
    prevActiveIdRef.current = activeConversationId;

    if (isConvSwitch) {
      // Switched conversation: instantly scroll internal container to bottom
      scrollToBottom(false);
      prevMessagesCountRef.current = messages.length;
      return;
    }

    const prevCount = prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    if (messages.length > prevCount) {
      const latestMsg = messages[messages.length - 1];
      const isMyMessage = latestMsg?.senderId === currentUser.id;

      if (isMyMessage || isNearBottom) {
        // User sent a message OR was already at bottom: scroll down
        scrollToBottom(true);
      } else {
        // User is looking at older messages: do NOT disturb scroll position, show indicator
        setHasNewUnreadInView(true);
      }
    }
  }, [messages, activeConversationId, currentUser.id, isNearBottom, scrollToBottom]);

  // Near real-time polling: Every 3.5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeConversationId) {
        loadMessages(activeConversationId, false);
      }
      refreshConversations();
    }, 3500);

    return () => clearInterval(interval);
  }, [activeConversationId, loadMessages, refreshConversations]);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setShowMobileList(false);
    setHasNewUnreadInView(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversationId || isSending) return;

    const messageContent = inputText.trim();
    setInputText("");
    setIsSending(true);

    // Optimistic message addition
    const optimisticMessage: MessageItem = {
      id: `temp_${Date.now()}`,
      conversationId: activeConversationId,
      senderId: currentUser.id,
      content: messageContent,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent }),
      });

      if (res.ok) {
        const data = await res.json();
        // Replace optimistic with real DB record
        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? data.data : m))
        );
        refreshConversations();
      } else {
        const errData = await res.json();
        console.error("Failed to send message:", errData.error);
        // Rollback on failure
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
        setInputText(messageContent);
      }
    } catch (err) {
      console.error("Network error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setInputText(messageContent);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        messageInputRef.current?.focus({ preventScroll: true });
        scrollToBottom(true);
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const filteredConversations = conversations.filter((c) =>
    c.otherParticipant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherParticipant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.otherParticipant.specialty && c.otherParticipant.specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-[580px] w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0B0F14] shadow-[0_25px_70px_rgba(0,0,0,0.6)]">
      {/* 1. SIDEBAR (Conversation List) */}
      <aside
        className={`flex w-full flex-col border-r border-white/10 bg-[#11161D] md:w-80 lg:w-96 shrink-0 ${
          !showMobileList && activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Sidebar Header */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-white">Direct Messages</h2>
            <span className="rounded-full bg-[#7CFF3B]/10 px-3 py-0.5 text-xs font-bold text-[#7CFF3B] border border-[#7CFF3B]/30">
              {conversations.length} Active
            </span>
          </div>

          {/* Search box */}
          <div className="mt-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-2.5 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#7CFF3B]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`w-full text-left p-4 transition flex items-start gap-3.5 ${
                    isSelected
                      ? "bg-[#7CFF3B]/10 border-l-4 border-[#7CFF3B]"
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  {/* Participant Avatar */}
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7CFF3B]/20 to-[#244613] text-base font-black text-[#7CFF3B] border border-[#7CFF3B]/30">
                    {conv.otherParticipant.name[0]}
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#7CFF3B] text-[9px] font-black text-black shadow">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`truncate text-sm font-bold ${
                          isSelected ? "text-[#7CFF3B]" : "text-white"
                        }`}
                      >
                        {conv.otherParticipant.name}
                      </h4>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-gray-500 shrink-0">
                          {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-400 truncate">
                      {conv.otherParticipant.specialty ||
                        (conv.otherParticipant.role === "TRAINER" ? "Coach" : "Client")}
                    </p>

                    <p className="mt-1 text-xs text-gray-400 truncate">
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.senderId === currentUser.id ? (
                            <span className="text-gray-500">You: </span>
                          ) : null}
                          <span className={conv.unreadCount > 0 ? "font-bold text-white" : ""}>
                            {conv.lastMessage.content}
                          </span>
                        </>
                      ) : (
                        <span className="italic text-gray-600">Start conversation</span>
                      )}
                    </p>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-gray-500">
              {searchQuery ? "No matching conversations." : "No conversations yet."}
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN CHAT AREA */}
      <main
        className={`relative flex flex-1 flex-col bg-[#0B0F14] ${
          showMobileList && !activeConversationId ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-[#11161D] px-6 py-4 z-10">
              <div className="flex items-center gap-3.5">
                {/* Mobile Back Button */}
                <button
                  onClick={() => setShowMobileList(true)}
                  className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-gray-300 hover:text-white"
                >
                  ←
                </button>

                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7CFF3B] to-[#244613] text-lg font-black text-black">
                  {activeConversation.otherParticipant.name[0]}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-white">
                      {activeConversation.otherParticipant.name}
                    </h3>
                    <span className="rounded-full bg-[#7CFF3B]/10 px-2 py-0.5 text-[10px] font-bold text-[#7CFF3B] border border-[#7CFF3B]/30">
                      {activeConversation.otherParticipant.role === "TRAINER" ? "Coach" : "Athlete"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-[#7CFF3B] inline-block animate-pulse"></span>
                    <span className="text-[#7CFF3B] font-semibold">Active Coaching Channel</span>
                    {activeConversation.otherParticipant.specialty && (
                      <span className="text-gray-500">• {activeConversation.otherParticipant.specialty}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Action links */}
              <div className="flex items-center gap-2">
                {currentUser.role === "CLIENT" ? (
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                  >
                    My Dashboard →
                  </Link>
                ) : (
                  <Link
                    href="/trainer/dashboard"
                    className="hidden sm:inline-flex rounded-xl border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-gray-300 hover:border-[#7CFF3B] hover:text-[#7CFF3B]"
                  >
                    Coach Portal →
                  </Link>
                )}
              </div>
            </div>

            {/* Messages Stream (Internal Scroll Container ONLY) */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-6 space-y-4 relative"
            >
              {isLoadingMessages ? (
                <div className="flex h-full items-center justify-center text-xs text-gray-500">
                  Loading message history...
                </div>
              ) : messages.length > 0 ? (
                <>
                  <div className="text-center my-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-gray-400">
                      3-Day Complimentary Chat Channel • End-to-End Encrypted
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isSelf = msg.senderId === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-5 py-3.5 text-sm shadow-md transition ${
                            isSelf
                              ? "bg-[#7CFF3B] text-black font-medium rounded-br-none"
                              : "bg-[#161D26] text-gray-200 border border-white/10 rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 px-1 text-[10px] text-gray-500">
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isSelf && (
                            <span className={msg.readAt ? "text-[#7CFF3B] font-bold" : "text-gray-500"}>
                              {msg.readAt ? "✓✓ Read" : "✓ Sent"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center p-8">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#7CFF3B]/10 text-2xl text-[#7CFF3B] border border-[#7CFF3B]/20">
                    💬
                  </div>
                  <h4 className="text-lg font-bold text-white">Start the Conversation</h4>
                  <p className="mt-1 max-w-sm text-xs text-gray-400">
                    Say hello to {activeConversation.otherParticipant.name} to discuss training splits, dietary targets, and goals.
                  </p>
                </div>
              )}
            </div>

            {/* Floating "New message ↓" Indicator (When user has scrolled up) */}
            {hasNewUnreadInView && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-[#7CFF3B] px-5 py-2.5 text-xs font-black text-black shadow-[0_10px_30px_rgba(124,255,59,0.5)] transition hover:scale-105 hover:bg-[#68e326] animate-bounce cursor-pointer border border-black/20"
              >
                <span>New message</span>
                <span className="text-sm">↓</span>
              </button>
            )}

            {/* Message Composer Footer */}
            <div className="border-t border-white/10 bg-[#11161D] p-4 z-10">
              <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={messageInputRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${activeConversation.otherParticipant.name.split(" ")[0]}... (Enter to send)`}
                    maxLength={2000}
                    className="flex-1 max-h-32 min-h-[46px] resize-none rounded-2xl border border-white/10 bg-[#080B0F] px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#7CFF3B]"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="flex h-[46px] items-center justify-center rounded-2xl bg-[#7CFF3B] px-6 text-sm font-bold text-black transition hover:scale-105 hover:bg-[#68e326] disabled:opacity-40 disabled:hover:scale-100 cursor-pointer"
                  >
                    {isSending ? "..." : "Send →"}
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 text-[10px] text-gray-500">
                  <span>Shift + Enter for new line</span>
                  <span>{inputText.length} / 2000</span>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-4xl text-gray-400">
              ✉️
            </div>
            <h3 className="text-xl font-bold text-white">Select a Conversation</h3>
            <p className="mt-2 max-w-sm text-xs text-gray-400">
              Choose an active coaching relationship from the list on the left to review messages and chat in real-time.
            </p>
            {currentUser.role === "CLIENT" && (
              <Link
                href="/trainers"
                className="mt-6 rounded-2xl bg-[#7CFF3B] px-6 py-3 text-xs font-bold text-black hover:scale-105"
              >
                Browse Coaches →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
