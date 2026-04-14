"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { chatService, ChatMessage, ChatUser } from "@/services/chat.service";
import { getSupabaseClient } from "@/lib/supabase-client";
import { MessageCircle, Send, X, ChevronLeft, Users, Trash2, Check, CheckCheck, Bell } from "lucide-react";

export function ChatWidget() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [text, setText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadPerUser, setUnreadPerUser] = useState<Record<string, number>>({});
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [view, setView] = useState<"users" | "chat">("users");
  const [newMessageIds, setNewMessageIds] = useState<Set<string>>(new Set());
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevUnreadRef = useRef(0);
  const prevMessageCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Presence: tracks online users per clínica vía Supabase Realtime
  useEffect(() => {
    if (!user?.id || !user?.clinica_id) return;
    const supabase = getSupabaseClient();
    const channel = supabase.channel(`chat-presence-${user.clinica_id}`, {
      config: { presence: { key: user.id } },
    });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        setOnlineUserIds(new Set(Object.keys(state)));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user?.id, user?.clinica_id]);

  // Load users
  useEffect(() => {
    if (!open) return;
    chatService.getClinicUsers().then(setUsers).catch(() => {});
  }, [open]);

  // Initial loads + Realtime: chat_messages INSERT refresca mensajes y contadores
  const loadMessagesRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    const loadMessages = () => {
      if (!open || view !== "chat") return;
      chatService
        .getMessages(selectedUser?.id)
        .then((msgs) => {
          setMessages((prev) => {
            const prevIds = new Set(prev.map((m) => m.id));
            const incoming = msgs.filter((m) => !prevIds.has(m.id) && m.sender_id !== user?.id);
            if (incoming.length > 0) {
              setNewMessageIds((s) => {
                const next = new Set(s);
                incoming.forEach((m) => next.add(m.id));
                return next;
              });
              setTimeout(() => {
                setNewMessageIds((s) => {
                  const next = new Set(s);
                  incoming.forEach((m) => next.delete(m.id));
                  return next;
                });
              }, 5000);
            }
            return msgs;
          });
          const unread = msgs.filter((m) => m.receiver_id === user?.id && !m.read_at);
          if (unread.length > 0) {
            chatService.markAsRead(unread.map((m) => m.id)).catch(() => {});
          }
        })
        .catch(() => {});
    };
    loadMessagesRef.current = loadMessages;
    loadMessages();
  }, [open, view, selectedUser, user?.id]);

  useEffect(() => {
    const loadUnread = () => {
      chatService.getUnreadCount().then((count) => {
        setUnreadCount(count);
        if (count > prevUnreadRef.current && !open) setHasNewNotification(true);
        prevUnreadRef.current = count;
      }).catch(() => {});
      chatService.getUnreadPerUser().then(setUnreadPerUser).catch(() => {});
    };
    loadUnread();

    if (!user?.clinica_id) return;
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`chat-messages-${user.clinica_id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `clinica_id=eq.${user.clinica_id}`,
        },
        () => {
          loadMessagesRef.current?.();
          loadUnread();
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [open, user?.clinica_id]);

  // Auto-scroll
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) scrollToBottom();
    prevMessageCountRef.current = messages.length;
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) setHasNewNotification(false);
  }, [open]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const msg = await chatService.sendMessage(text.trim(), selectedUser?.id);
      setMessages((prev) => [...prev, msg]);
      setText("");
      inputRef.current?.focus();
      scrollToBottom();
    } catch (err: any) {
      console.error("Chat send error:", err?.response?.data || err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearChat = async () => {
    if (!confirm("¿Estás seguro de vaciar este chat? Esta acción no se puede deshacer.")) return;
    try {
      await chatService.clearChat(selectedUser?.id);
      setMessages([]);
    } catch {
      // silently fail
    }
  };

  const otherUsers = users.filter((u) => u.id !== user?.id);

  const openChat = (chatUser: ChatUser | null) => {
    setSelectedUser(chatUser);
    setView("chat");
    setMessages([]);
    setNewMessageIds(new Set());
    prevMessageCountRef.current = 0;
  };

  const roleLabel = (role: string) => ({ admin: "Admin", professional: "Profesional", assistant: "Secretaria" }[role] || role);

  const roleColor = (role: string) => ({
    admin: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
    professional: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    assistant: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  }[role] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300");

  const isOnline = (userId: string) => onlineUserIds.has(userId);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => { setOpen(!open); if (!open) setView("users"); }}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 ${hasNewNotification && !open ? "animate-bounce" : ""}`}
      >
        {open ? <X className="h-6 w-6" /> : (
          <>
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-2 border-b bg-gradient-to-r from-[var(--ht-primary)] to-[var(--ht-accent-dark)] px-4 py-3 text-white">
            {view === "chat" && (
              <button onClick={() => setView("users")} className="rounded-lg p-1 hover:bg-white/20 transition-colors">
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold truncate">
                {view === "users" ? "Chat Interno" : selectedUser ? `${selectedUser.nombre} ${selectedUser.apellido}` : "Canal General"}
              </h3>
              {view === "chat" && selectedUser && (
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isOnline(selectedUser.id) ? "bg-emerald-400" : "bg-white/40"}`} />
                  <p className="text-[11px] text-white/70">{isOnline(selectedUser.id) ? "En línea" : roleLabel(selectedUser.role)}</p>
                </div>
              )}
            </div>
            {view === "chat" && isAdmin && (
              <button onClick={handleClearChat} className="rounded-lg p-1.5 hover:bg-white/20 transition-colors" title="Vaciar chat">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            {view === "users" && unreadCount > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1">
                <Bell className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">{unreadCount}</span>
              </div>
            )}
          </div>

          {/* User list */}
          {view === "users" && (
            <div className="flex-1 overflow-auto">
              {/* General channel */}
              <button
                onClick={() => openChat(null)}
                className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted/50 transition-colors ${(unreadPerUser["general"] ?? 0) > 0 ? "bg-primary/5 dark:bg-primary/10" : ""}`}
              >
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-emerald-100 dark:from-sky-900/30 dark:to-emerald-900/30">
                  <Users className="h-5 w-5 text-primary dark:text-primary/90" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Canal General</p>
                  <p className="text-xs text-muted-foreground">Mensajes para todo el equipo</p>
                </div>
                {(unreadPerUser["general"] ?? 0) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                    {unreadPerUser["general"]}
                  </span>
                )}
              </button>

              {otherUsers.map((u) => {
                const unread = unreadPerUser[u.id] ?? 0;
                return (
                  <button
                    key={u.id}
                    onClick={() => openChat(u)}
                    className={`flex w-full items-center gap-3 border-b px-4 py-3 text-left hover:bg-muted/50 transition-colors ${unread > 0 ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                          {u.nombre[0]}{u.apellido[0]}
                        </span>
                      </div>
                      {/* Online indicator */}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${isOnline(u.id) ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${unread > 0 ? "font-bold" : "font-medium"}`}>
                          {u.nombre} {u.apellido}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${roleColor(u.role)}`}>
                          {roleLabel(u.role)}
                        </span>
                        {isOnline(u.id) && (
                          <span className="text-[10px] text-emerald-500 font-medium">en línea</span>
                        )}
                      </div>
                    </div>
                    {unread > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>
                );
              })}

              {otherUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Users className="mb-2 h-8 w-8 opacity-50" />
                  <p className="text-sm">No hay otros usuarios</p>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {view === "chat" && (
            <>
              <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
                {messages.length === 0 && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <MessageCircle className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Sin mensajes aún</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">¡Escribe el primero!</p>
                    </div>
                  </div>
                )}
                {messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const isNew = newMessageIds.has(msg.id);
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} ${isNew ? "animate-in slide-in-from-left-3 duration-300" : ""}`}>
                      <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm transition-all duration-500 ${
                        isOwn
                          ? "bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white"
                          : isNew
                            ? "bg-primary/5 dark:bg-primary/10 ring-2 ring-primary/50"
                            : "bg-muted"
                      }`}>
                        {!isOwn && (
                          <p className="text-[10px] font-semibold mb-0.5 text-primary dark:text-primary/90">
                            {msg.sender?.nombre} {msg.sender?.apellido}
                            {isNew && <span className="ml-1.5 inline-flex items-center rounded-full bg-primary px-1.5 py-0 text-[8px] font-bold text-white">NUEVO</span>}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center justify-end gap-1 mt-1 ${isOwn ? "text-white/50" : "text-muted-foreground"}`}>
                          <span className="text-[10px]">
                            {new Date(msg.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {/* Read receipts for own messages */}
                          {isOwn && (
                            msg.read_at
                              ? <CheckCheck className="h-3 w-3 text-sky-300" />
                              : <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    autoFocus
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--ht-primary)] to-[var(--ht-accent-dark)] text-white disabled:opacity-50 hover:shadow-md transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
