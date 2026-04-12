"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Question = {
  skill: string;
  question_id: string;
  question: string;
  options: string[];
  topic?: string;
};

export default function AssessmentPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
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

  const allAnswered = useMemo(() => {
    if (!questions.length) return false;
    return questions.every((q) => Boolean(answers[q.question_id]?.trim()));
  }, [questions, answers]);

  async function start() {
    setError("");
    setLoading(true);
    setSummary(null);
    setQuestions([]);
    setAnswers({});
    try {
      const now = Date.now();
      setStartedAt(now);
      localStorage.setItem("learnova_assessment_started_at", String(now));
      const r = await api.assessmentStart(userId);
      if (r.session_id) setSessionId(r.session_id);
      const qs = Array.isArray(r.questions) ? r.questions : [];
      if (!qs.length) {
        setError("No questions were returned for your skills.");
        return;
      }
      setQuestions(qs as Question[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not start the assessment. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  function selectOption(questionId: string, option: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function generateRoadmap() {
    if (!sessionId || !userId || !allAnswered) return;
    setError("");
    setLoading(true);
    try {
      const r = await api.assessmentSubmitAll(userId, sessionId, answers);
      setSummary(r);
      const startTs =
        (startedAt ?? Number(localStorage.getItem("learnova_assessment_started_at") || "0")) || 0;
      if (startTs) {
        const seconds = Math.max(1, Math.round((Date.now() - startTs) / 1000));
        localStorage.setItem("learnova_last_assessment_seconds", String(seconds));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save assessment.");
      setLoading(false);
      return;
    }
    try {
      await api.generateRoadmap(userId);
      router.push("/roadmap");
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} Your assessment was saved — open Roadmap and tap generate if needed.`
          : "Roadmap generation failed; your assessment was saved."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Skills assessment</h1>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </header>

      <div className="card stack">
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
          Answer every question for your selected skills on this page, then choose <strong>Generate roadmap</strong> to save your
          results and build your learning plan.
        </p>

        {!sessionId && (
          <button className="btn" type="button" onClick={start} disabled={loading || !userId}>
            {loading ? "Loading…" : "Begin assessment"}
          </button>
        )}

        {sessionId && questions.length > 0 && (
          <div className="stack" style={{ gap: "1.5rem" }}>
            {questions.map((q, idx) => (
              <section
                key={q.question_id}
                className="card-inset stack"
                style={{ padding: "1rem 1.1rem", gap: "0.65rem" }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.04em" }}>
                  {idx + 1}. {q.skill}
                  {q.topic && q.topic !== q.skill ? ` · ${q.topic}` : ""}
                </div>
                <p style={{ margin: 0, fontSize: "1.02rem", fontWeight: 600, lineHeight: 1.45 }}>{q.question}</p>
                <div className="stack" style={{ gap: "0.4rem" }}>
                  {q.options.map((o) => {
                    const picked = answers[q.question_id] === o;
                    return (
                      <button
                        key={o}
                        type="button"
                        className="btn btn-ghost"
                        style={{
                          justifyContent: "flex-start",
                          textAlign: "left",
                          borderColor: picked ? "var(--accent)" : undefined,
                          background: picked ? "var(--success)" : undefined,
                          color: picked ? "var(--bg)" : undefined,
                        }}
                        disabled={loading}
                        onClick={() => selectOption(q.question_id, o)}
                      >
                        {o}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <button
              className="btn"
              type="button"
              onClick={generateRoadmap}
              disabled={loading || !allAnswered}
            >
              {loading ? "Saving & generating…" : "Generate roadmap"}
            </button>
            {!allAnswered && (
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--muted)" }}>
                Select an answer for each question to continue.
              </p>
            )}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        {summary && (
          <div className="stack">
            <h3 style={{ margin: 0 }}>Saved snapshot</h3>
            <pre className="preNeo">{JSON.stringify(summary.skill_levels, null, 2)}</pre>
            <Link className="btn" href="/roadmap">
              Open roadmap
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
