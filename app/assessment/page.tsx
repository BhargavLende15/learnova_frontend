"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Question = {
  skill: string;
  question_id: string;
  question: string;
  options: string[];
  difficulty_tier: number;
  difficulty_label?: string;
  topic?: string;
};

export default function AssessmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    setUserId(uid);
  }, [router]);

  async function start() {
    setError("");
    setLoading(true);
    setSummary(null);
    setDone(false);
    setQuestion(null);
    setLastExplanation(null);
    try {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem("learnova_assessment_started_at", String(now));
      const r = await api.assessmentStart(userId);
      if (r.session_id) setSessionId(r.session_id);
      if (r.done) {
        setDone(true);
        setFeedback(r.message || "No questions were available.");
        return;
      }
      setQuestion(r.question);
      setFeedback("Questions are generated for you each session — work carefully; distractors are meant to be realistic.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the assessment. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  async function answer(opt: string) {
    if (!sessionId || !question) return;
    setError("");
    setLoading(true);
    setFeedback(null);
    setLastExplanation(null);
    try {
      const r = await api.assessmentAnswer(sessionId, question.question_id, opt);
      if (r.error) {
        setError(String(r.error));
        return;
      }
      setFeedback(
        r.correct
          ? "Nice — we will nudge the next item toward a harder tier."
          : "Not quite — the next question may ease slightly so you can consolidate."
      );
      if (r.explanation && typeof r.explanation === "string") {
        setLastExplanation(r.explanation);
      }
      const n = r.next;
      if (n?.done) {
        setDone(true);
        setQuestion(null);
        setFeedback((f) => (n.message ? `${f ?? ""} ${n.message}` : f));
      } else {
        setQuestion(n.question);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setLoading(false);
    }
  }

  async function finalize() {
    if (!sessionId) return;
    setError("");
    setLoading(true);
    try {
      const r = await api.assessmentFinalize(sessionId);
      setSummary(r);
      setDone(true);
      setQuestion(null);
      setFeedback("Assessment saved. You can now generate a roadmap tailored to these levels.");
      const startTs =
        (startedAt ?? Number(localStorage.getItem("learnova_assessment_started_at") || "0")) || 0;
      if (startTs) {
        const seconds = Math.max(1, Math.round((Date.now() - startTs) / 1000));
        localStorage.setItem("learnova_last_assessment_seconds", String(seconds));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Finalize failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Adaptive skills check</h1>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </header>

      <div className="card stack">
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
          Each question is generated for your selected skills (with AI when configured on the server, otherwise a smart fallback).
          Four options always belong to the topic; difficulty shifts based on how you answer. When you finish the run, finalize to
          lock in skill levels for your roadmap.
        </p>

        {!sessionId && (
          <button className="btn" type="button" onClick={start} disabled={loading || !userId}>
            {loading ? "Starting…" : "Begin assessment"}
          </button>
        )}

        {sessionId && question && (
          <div className="stack">
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              {question.skill}
              {question.topic && question.topic !== question.skill ? ` · ${question.topic}` : ""} ·{" "}
              {question.difficulty_label || `Tier ${question.difficulty_tier}`}
            </p>
            <p style={{ margin: 0, fontSize: "1.08rem", fontWeight: 600, lineHeight: 1.45 }}>{question.question}</p>
            <div className="stack" style={{ gap: "0.5rem" }}>
              {question.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className="btn btn-ghost"
                  style={{ justifyContent: "flex-start", textAlign: "left" }}
                  disabled={loading}
                  onClick={() => answer(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        )}

        {sessionId && done && !question && !summary && (
          <button className="btn" type="button" onClick={finalize} disabled={loading}>
            {loading ? "Saving…" : "Finalize & save results"}
          </button>
        )}

        {feedback && <p style={{ color: "var(--success)", margin: 0 }}>{feedback}</p>}
        {lastExplanation && (
          <div className="card-inset" style={{ padding: "0.85rem 1rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--muted)" }}>
              EXPLANATION
            </div>
            <p style={{ margin: "0.35rem 0 0", fontSize: "0.92rem", lineHeight: 1.5 }}>{lastExplanation}</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}

        {summary && (
          <div className="stack">
            <h3 style={{ margin: 0 }}>Your skill snapshot</h3>
            <pre className="preNeo">{JSON.stringify(summary.skill_levels, null, 2)}</pre>
            <Link className="btn" href="/roadmap">
              Open roadmap
            </Link>
            <Link className="btn btn-ghost" href="/results">
              View results dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
