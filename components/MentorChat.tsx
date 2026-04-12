"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

import { api } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string };

const SUGGESTIONS = [
  "Why was this roadmap suggested for me?",
  "What should I learn next?",
  "How do I start today?",
  "Explain the Foundation phase.",
];

export function MentorChat() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
    setUserId(uid);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !userId || loading) return;
      setMessages((m) => [...m, { role: "user", text: t }]);
      setInput("");
      setLoading(true);
      try {
        const r = await api.mentorChat(userId, t);
        const reply = typeof r.reply === "string" ? r.reply : "I could not generate a reply. Try again.";
        setMessages((m) => [...m, { role: "assistant", text: reply }]);
      } catch (e) {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            text: e instanceof Error ? e.message : "Something went wrong. Check that the API is running.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [userId, loading]
  );

  if (!userId) return null;

  return (
    <div className="mentorDock" aria-live="polite">
      {open && (
        <div className="mentorPanel card stack">
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>Learnova Coach</div>
              <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 2 }}>
                Roadmaps, careers, quiz concepts, and motivation — tailored to your profile.
              </div>
            </div>
            <button type="button" className="mentorIconBtn" onClick={() => setOpen(false)} aria-label="Close coach">
              <X size={20} />
            </button>
          </div>

          <div className="mentorSuggestRow">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" className="mentorChip" disabled={loading} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>

          <div className="mentorMessages">
            {messages.length === 0 && (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                Ask anything about your path, or tap a suggestion to get started.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mentorBubble ${m.role === "user" ? "mentorBubbleUser" : "mentorBubbleAi"}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="mentorBubble mentorBubbleAi">Thinking…</div>}
            <div ref={endRef} />
          </div>

          <form
            className="mentorForm"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="input"
              placeholder="Ask your coach…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              aria-label="Message to coach"
            />
            <button type="submit" className="btn" disabled={loading || !input.trim()} aria-label="Send">
              <Send size={18} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        className="mentorFab btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close coach" : "Open Learnova Coach"}
      >
        <MessageCircle size={22} />
      </button>
    </div>
  );
}
