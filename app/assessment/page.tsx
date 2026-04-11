"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, PageHeader, Spinner } from "@/components/ui";

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
      <PageHeader title="Adaptive assessment" description="Questions adapt as you answer. Finalize when you are done to record skill levels.">
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
        <Link href="/roadmap" className="btn btn-ghost">
          Roadmap
        </Link>
      </PageHeader>

      <div className="card stack" aria-busy={loading}>
        {!sessionId ? (
          <button className="btn" type="button" onClick={start} disabled={loading || !userId}>
            {loading ? (
              <span className="row" style={{ gap: 8 }}>
                <Spinner label="Starting" />
                Starting…
              </span>
            ) : (
              "Start assessment"
            )}
          </button>
        ) : null}

        {sessionId && question ? (
          <div className="stack fade-in-up">
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.875rem" }}>
              {question.skill} · tier {question.difficulty_tier}
            </p>
            <p style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 600 }}>{question.question}</p>
            <div className="stack" style={{ gap: "0.5rem" }} role="group" aria-label="Answer choices">
              {question.options.map((o) => (
                <button
                  key={o}
                  type="button"
                  className="btn btn-ghost btnBlock"
                  disabled={loading}
                  onClick={() => answer(o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {sessionId && done && !question && !summary ? (
          <button className="btn" type="button" onClick={finalize} disabled={loading}>
            {loading ? (
              <span className="row" style={{ gap: 8 }}>
                <Spinner label="Finalizing" />
                Finalizing…
              </span>
            ) : (
              "Finalize assessment"
            )}
          </button>
        ) : null}

        {feedback ? (
          <p className="feedbackSuccess" role="status">
            {feedback}
          </p>
        ) : null}
        {error ? (
          <Alert variant="error" title="Action needed">
            {error}
          </Alert>
        ) : null}

        {summary ? (
          <div className="stack fade-in-up">
            <h2 className="sectionTitle">Results snapshot</h2>
            <pre className="preJson">{JSON.stringify((summary as { skill_levels?: unknown }).skill_levels ?? summary, null, 2)}</pre>
            <div className="row">
              <Link className="btn" href="/roadmap">
                Generate / view roadmap
              </Link>
              <Link className="btn btn-ghost" href="/results">
                Open results dashboard
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
