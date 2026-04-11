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
};

export default function AssessmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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
    try {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem("learnova_assessment_started_at", String(now));
      const r = await api.assessmentStart(userId);
      if (r.session_id) setSessionId(r.session_id);
      if (r.done) {
        setDone(true);
        setFeedback(r.message || "No questions.");
        return;
      }
      setQuestion(r.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start failed");
    } finally {
      setLoading(false);
    }
  }

  async function answer(opt: string) {
    if (!sessionId || !question) return;
    setError("");
    setLoading(true);
    setFeedback(null);
    try {
      const r = await api.assessmentAnswer(sessionId, question.question_id, opt);
      if (r.error) {
        setError(String(r.error));
        return;
      }
      setFeedback(r.correct ? "Correct — difficulty may increase." : "Incorrect — easing difficulty.");
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
      setFeedback("Assessment finalized. Generate your roadmap next.");
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
        <h1 className="pageTitle">Adaptive assessment</h1>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </header>

      <div className="card stack">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Questions adapt in real time: correct answers tend to raise difficulty; wrong answers lower
          it. Finish when prompted, then finalize to record skill levels.
        </p>

        {!sessionId && (
          <button className="btn" type="button" onClick={start} disabled={loading || !userId}>
            {loading ? "…" : "Start assessment"}
          </button>
        )}

        {sessionId && question && (
          <div className="stack">
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
              {question.skill} · tier {question.difficulty_tier}
            </p>
            <p style={{ margin: 0, fontSize: "1.05rem" }}>{question.question}</p>
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
            Finalize assessment
          </button>
        )}

        {feedback && <p style={{ color: "var(--success)", margin: 0 }}>{feedback}</p>}
        {error && <p className="error">{error}</p>}

        {summary && (
          <div className="stack">
            <h3 style={{ margin: 0 }}>Results</h3>
            <pre className="preNeo">
              {JSON.stringify(summary.skill_levels, null, 2)}
            </pre>
            <Link className="btn" href="/roadmap">
              Generate / view roadmap
            </Link>
            <Link className="btn btn-ghost" href="/results">
              Open results dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
