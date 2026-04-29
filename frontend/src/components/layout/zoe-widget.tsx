"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useClinica } from "@/components/providers/clinica-provider";
import { Bot, Send, X, Sparkles } from "lucide-react";

interface ZoeMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const DEMO_RESPONSES: Record<string, string> = {
  default:
    "Hola! Soy {name}, asistente virtual de {clinica}. Puedo ayudarte a agendar turnos, consultar disponibilidad y más. Escribime tu consulta!",
  turno:
    "Perfecto! Para agendar un turno necesito algunos datos. Dejame consultar la disponibilidad...",
  horario:
    "Los horarios de atención de {clinica} son de lunes a viernes. Querés que te muestre los turnos disponibles?",
  cancelar:
    "Entendido. Para cancelar un turno necesito verificar tu identidad. Podrías indicarme tu DNI?",
};

function getResponse(input: string, agentName: string, clinicaName: string): string {
  const lower = input.toLowerCase();
  let key = "default";
  if (lower.includes("turno") || lower.includes("cita") || lower.includes("agendar")) key = "turno";
  else if (lower.includes("horario") || lower.includes("hora")) key = "horario";
  else if (lower.includes("cancelar")) key = "cancelar";
  return (DEMO_RESPONSES[key] || DEMO_RESPONSES.default)
    .replace("{name}", agentName)
    .replace("{clinica}", clinicaName);
}

export function ZoeWidget() {
  const { clinica } = useClinica();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ZoeMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentName = clinica?.agent_nombre || "Avax";
  const clinicaName = clinica?.nombre || "tu clínica";
  const isActive = !!clinica?.agent_nombre;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: DEMO_RESPONSES.default
            .replace("{name}", agentName)
            .replace("{clinica}", clinicaName),
          timestamp: new Date(),
        },
      ]);
    }
  }, [open, messages.length, agentName, clinicaName]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!isActive) return null;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || typing) return;

    const userMsg: ZoeMessage = {
      id: Date.now().toString(),
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      const response = getResponse(trimmed, agentName, clinicaName);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          text: response,
          timestamp: new Date(),
        },
      ]);
      setTyping(false);
    }, 800 + Math.random() * 1200);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white shadow-lg animate-glow-pulse hover:scale-105 transition-transform"
          title={`Hablar con ${agentName}`}
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden" style={{ height: "480px" }}>
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{agentName}</p>
                <p className="text-[10px] opacity-80 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 inline-block" />
                  En línea
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Demo badge */}
          <div className="flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 text-[10px] text-amber-700 dark:text-amber-300 border-b">
            <Sparkles className="h-3 w-3" />
            Vista previa — las respuestas reales son por WhatsApp
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[var(--primary)] text-white rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t px-3 py-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Escribile a ${agentName}...`}
                className="flex-1 rounded-full border bg-muted/50 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
