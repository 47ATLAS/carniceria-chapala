import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, X, Send } from "lucide-react";
import { askAssistant, getChatHistory } from "@/lib/chat.functions";

type Msg = { role: "user" | "assistant"; content: string };

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("cc_chat_session");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("cc_chat_session", id);
  }
  return id;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const ask = useServerFn(askAssistant);
  const history = useServerFn(getChatHistory);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSessionId(getSessionId()); }, []);
  useEffect(() => {
    if (!open || !sessionId) return;
    history({ data: { session_id: sessionId } }).then((rows) => {
      setMessages(rows.map((r) => ({ role: r.role as "user" | "assistant", content: r.content })));
    }).catch(() => {});
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open, sessionId, history]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { reply } = await ask({ data: { session_id: sessionId, message: text } });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: (e as Error).message }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full wine-bg shadow-lg shadow-black/30 transition-transform hover:scale-110"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[500px] w-[90vw] max-w-sm flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl">
          <div className="ink-bg px-4 py-3">
            <div className="text-xs uppercase tracking-widest opacity-60">Asistente</div>
            <div className="display text-xl">Carnicería Chapala</div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Pregúntame por horarios, precios, disponibilidad o cómo apartar un pedido.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[80%] rounded-lg wine-bg px-3 py-2 text-sm">{m.content}</div>
                ) : (
                  <div className="max-w-[90%] text-sm whitespace-pre-wrap text-foreground">{m.content}</div>
                )}
              </div>
            ))}
            {loading && <div className="text-sm text-muted-foreground">Escribiendo…</div>}
            <div ref={bottomRef} />
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta…"
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button type="submit" disabled={loading || !input.trim()} className="flex h-9 w-9 items-center justify-center rounded-md wine-bg disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}