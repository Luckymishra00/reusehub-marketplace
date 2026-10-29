"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  MessageSquare,
  Send,
  ExternalLink,
  CheckCheck,
  User,
} from "lucide-react";

interface ConversationSummary {
  id: number;
  productId: number;
  buyerId: number;
  sellerId: number;
  updatedAt: string;
  roleInConversation: "buyer" | "seller";
  unreadCount: number;
  otherUser: {
    id: number;
    fullName: string;
    profileImage: string | null;
    location: string | null;
  } | null;
  product: {
    id: number;
    title: string;
    price: number;
    status: string;
    condition: string;
    primaryImage: string;
  } | null;
  lastMessage: {
    id: number;
    senderId: number;
    messageText: string;
    createdAt: string;
  } | null;
}

interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  messageText: string;
  readAt: string | null;
  createdAt: string;
  senderName: string;
  senderAvatar: string | null;
}

function MessagesInboxContent() {
  const {
    user,
    loading: authLoading,
    refreshUnreadCount,
    showToast,
  } = useAuth();
  const searchParams = useSearchParams();
  const initialConvParam = searchParams.get("conversationId");

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(
    initialConvParam ? Number(initialConvParam) : null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConvMeta, setActiveConvMeta] =
    useState<ConversationSummary | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setLoadingList(false);
      return;
    }
    try {
      const res = await fetch("/api/v1/conversations", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json.data)) {
        setConversations(json.data);
        if (!selectedConvId && json.data.length > 0) {
          const targetId = initialConvParam
            ? Number(initialConvParam)
            : json.data[0].id;
          setSelectedConvId(targetId);
        }
      }
    } catch {
      // ignore
    } finally {
      setLoadingList(false);
    }
  }, [user, selectedConvId, initialConvParam]);

  const fetchMessagesForConv = useCallback(
    async (convId: number, silent = false) => {
      if (!user) return;
      if (!silent) setLoadingThread(true);
      try {
        const res = await fetch(`/api/v1/conversations/${convId}/messages`, {
          cache: "no-store",
        });
        const json = await res.json();
        if (res.ok && json.data) {
          setMessages(json.data.messages || []);
          setActiveConvMeta(json.data.conversation || null);
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
          );
          refreshUnreadCount();
        }
      } catch {
        // ignore
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [user, refreshUnreadCount]
  );

  useEffect(() => {
    if (!authLoading) {
      fetchConversations();
    }
  }, [authLoading, fetchConversations]);

  useEffect(() => {
    if (selectedConvId && user) {
      fetchMessagesForConv(selectedConvId);
      const timer = setInterval(() => {
        fetchMessagesForConv(selectedConvId, true);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [selectedConvId, user, fetchMessagesForConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !user) return;
    const text = messageInput.trim();
    if (!text) return;

    setSending(true);
    try {
      const res = await fetch(
        `/api/v1/conversations/${selectedConvId}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageText: text }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        showToast(json.message || "Could not send message", "error");
        return;
      }
      setMessageInput("");
      setMessages((prev) => [...prev, json.data]);
      fetchConversations();
    } catch {
      showToast("Error sending message", "error");
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loadingList) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-[600px] bg-[#EFECE6] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="bg-white p-8 rounded-3xl border border-[#E6E1DA] space-y-4">
          <MessageSquare className="w-10 h-10 text-[#3B2B25] mx-auto" />
          <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25]">
            Buyer–Seller Inbox
          </h1>
          <p className="text-sm text-[#737373]">
            Sign in to view your private conversations with buyers and sellers.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#9A8174]">
          Direct Marketplace Dialogue
        </span>
        <h1 className="font-serif-display text-3xl font-semibold text-[#3B2B25] mt-1">
          Messages & Swap Inquiries
        </h1>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#E6E1DA] p-12 text-center max-w-lg mx-auto space-y-4">
          <MessageSquare className="w-10 h-10 text-[#9A8174] mx-auto" />
          <h2 className="font-serif-display text-2xl font-semibold text-[#242424]">
            No Conversations Yet
          </h2>
          <p className="text-sm text-[#737373]">
            Start a conversation from any product listing page to ask questions,
            negotiate price, or propose an item swap.
          </p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 rounded-xl bg-[#3B2B25] text-white text-sm font-semibold"
          >
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl border border-[#E6E1DA] overflow-hidden shadow-xs min-h-[620px]">
          {/* Left 4 Columns: Conversation List */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-[#E6E1DA] flex flex-col max-h-[640px]">
            <div className="p-4 border-b border-[#E6E1DA] bg-[#FAF8F5]">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3B2B25]">
                Active Threads ({conversations.length})
              </h2>
            </div>

            <div className="divide-y divide-[#F3EFEA] overflow-y-auto flex-1">
              {conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-[#F3EFEA]"
                        : "bg-white hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-[#EFECE6] overflow-hidden shrink-0 border border-[#E6E1DA]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={
                          conv.product?.primaryImage ||
                          "/images/placeholder-product.svg"
                        }
                        alt={conv.product?.title || "Product"}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#242424] truncate">
                          {conv.otherUser?.fullName || "Community Member"}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#6D8065] text-white text-[10px] font-bold">
                            {conv.unreadCount} new
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-[#3B2B25] truncate mt-0.5">
                        {conv.product?.title || "Listing"}
                      </p>

                      {conv.lastMessage && (
                        <p className="text-xs text-[#737373] truncate mt-1">
                          {conv.lastMessage.messageText}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right 8 Columns: Active Chat Window */}
          <div className="lg:col-span-8 flex flex-col max-h-[640px]">
            {loadingThread ? (
              <div className="flex-1 flex items-center justify-center p-12 text-sm text-[#737373]">
                Loading conversation...
              </div>
            ) : activeConvMeta ? (
              <>
                {/* Top Linked Product & Counterpart Banner */}
                <div className="p-4 sm:px-6 border-b border-[#E6E1DA] bg-[#FAF8F5] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {activeConvMeta.product && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F3EFEA] border border-[#E6E1DA] shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={activeConvMeta.product.primaryImage}
                          alt={activeConvMeta.product.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[#242424] truncate">
                          {activeConvMeta.product?.title || "Product Inquiry"}
                        </h3>
                        {activeConvMeta.product && (
                          <span className="px-2 py-0.5 rounded-full bg-[#EFECE6] text-[#3B2B25] text-[10px] font-semibold">
                            {activeConvMeta.product.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#737373] mt-0.5">
                        {activeConvMeta.product && (
                          <span className="font-mono-price font-semibold text-[#3B2B25]">
                            ${activeConvMeta.product.price}
                          </span>
                        )}
                        <span>•</span>
                        <span>
                          Chatting with{" "}
                          <strong className="text-[#242424]">
                            {activeConvMeta.otherUser?.fullName}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeConvMeta.otherUser && (
                      <Link
                        href={`/users/${activeConvMeta.otherUser.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-[#E6E1DA] text-xs font-medium text-[#242424] hover:border-[#3B2B25]"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Seller Profile</span>
                      </Link>
                    )}
                    {activeConvMeta.product && (
                      <Link
                        href={`/products/${activeConvMeta.product.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#3B2B25] text-white text-xs font-medium hover:bg-[#2A1E1A]"
                      >
                        <span>View Item</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Message History Stream */}
                <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-white">
                  {messages.map((msg) => {
                    const isMine = msg.senderId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? "items-end" : "items-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isMine
                              ? "bg-[#3B2B25] text-[#FAF8F5] rounded-br-xs"
                              : "bg-[#F3EFEA] text-[#242424] rounded-bl-xs border border-[#E6E1DA]"
                          }`}
                        >
                          <p className="whitespace-pre-line">
                            {msg.messageText}
                          </p>
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#737373] px-1">
                          <span>{isMine ? "You" : msg.senderName}</span>
                          <span>•</span>
                          <span>
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {isMine && msg.readAt && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[#6D8065]"
                              title="Read by recipient"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              <span>Read</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t border-[#E6E1DA] bg-[#FAF8F5] flex items-center gap-3"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Write a message, ask a question, or make an offer..."
                    className="flex-1 h-11 px-4 rounded-xl bg-white border border-[#E6E1DA] text-sm text-[#242424] focus:outline-none focus:border-[#3B2B25]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-[#3B2B25] text-[#FAF8F5] text-sm font-semibold hover:bg-[#2A1E1A] disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-sm text-[#737373]">
                Select a conversation on the left to view messages.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-[600px] bg-[#EFECE6] rounded-3xl animate-pulse" />
        </div>
      }
    >
      <MessagesInboxContent />
    </Suspense>
  );
}
