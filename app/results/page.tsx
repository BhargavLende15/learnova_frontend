"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, Flame, Target, Timer, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/ui";

type Gamification = {
  points: number;
  badges: string[];
  streakCount: number;
  lastActiveDate: string | null;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

function kpi(label: string, value: string, icon: React.ReactNode) {
  return (
    <div className="card kpiCard fade-in-up">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: "0.8125rem", fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: "1.35rem", fontWeight: 800, marginTop: 4, letterSpacing: "-0.02em" }}>{value}</div>
        </div>
        <div style={{ opacity: 0.9 }} aria-hidden>
          {icon}
        </div>
      </div>
    </div>
  );
}

function RadialStat({ label, value }: { label: string; value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const size = 140;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  const gap = circumference - dash;
  const hue = Math.round(pct * 1.2);
  const arcColor = `hsl(${hue}, 78%, 58%)`;

  return (
    <div className="card radialCard fade-in-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }} role="img" aria-label={`${label}: ${pct} percent`}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }} aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22, 1, 0.36, 1)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "1.35rem", fontWeight: 800, color: arcColor }}>{pct}%</span>
        </div>
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.8125rem", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [g, setG] = useState<Gamification | null>(null);
  const [takenSec, setTakenSec] = useState<number>(0);

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    setUserId(uid);
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api.latestResult(uid);
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No results yet");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = Number(localStorage.getItem("learnova_last_assessment_seconds") || "0") || 0;
    setTakenSec(t);
  }, []);

  const metrics = useMemo(() => {
    const raw = result?.raw_scores ? Object.values(result.raw_scores as Record<string, unknown>).map((x) => Number(x) || 0) : [];
    const marks = clamp(avg(raw), 0, 100);
    const expectedSec = 15 * 25;
    const speedRatio = takenSec > 0 ? clamp(expectedSec / takenSec, 0.4, 1.4) : 1;
    const accuracy = marks;
    const confidence = clamp(50 + (speedRatio - 1) * 40, 0, 100);
    const efficiency = clamp(marks * speedRatio, 0, 100);
    return { marks, accuracy, confidence, efficiency, takenSec, expectedSec };
  }, [result, takenSec]);

  useEffect(() => {
    if (!userId || !result) return;
    (async () => {
      try {
        const updated = await api.updateGamification({
          userId,
          score: metrics.marks,
          efficiency: metrics.efficiency,
        });
        setG({
          points: updated.points ?? 0,
          badges: updated.badges ?? [],
          streakCount: updated.streakCount ?? 0,
          lastActiveDate: updated.lastActiveDate ?? null,
        });
      } catch {
        try {
          const existing = await api.getGamification(userId);
          setG({
            points: existing.points ?? 0,
            badges: existing.badges ?? [],
            streakCount: existing.streakCount ?? 0,
            lastActiveDate: existing.lastActiveDate ?? null,
          });
        } catch {
          setG(null);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, result]);

  return (
    <div className="container stack">
      <PageHeader title="Results" description="Scores, streaks, and per-skill breakdown from your latest assessment.">
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
        <Link href="/roadmap" className="btn btn-ghost">
          Roadmap
        </Link>
        <Link href="/skill-map" className="btn btn-ghost">
          Skill map
        </Link>
      </PageHeader>

      {loading ? <LoadingState message="Loading results…" /> : null}

      {!loading && error ? (
        <div className="card stack">
          <Alert variant="error" title="No results to show">{error}</Alert>
          <EmptyState
            title="Take an assessment first"
            description="Complete the adaptive assessment to see scores and credentials here."
            action={
              <Link href="/assessment" className="btn">
                Start assessment
              </Link>
            }
          />
        </div>
      ) : null}

      {!loading && !error && result ? (
        <div className="stack">
          <div className="card fade-in-up" style={{ textAlign: "center" }}>
            <div style={{ color: "var(--muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.75rem" }}>
              Score
            </div>
            <div style={{ fontSize: "clamp(2.5rem, 8vw, 3.25rem)", fontWeight: 800, marginTop: 8, letterSpacing: "-0.03em" }}>
              {Math.round(metrics.marks)}
              <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: 600 }}>/100</span>
            </div>
            <div style={{ color: "var(--muted)", marginTop: 8, fontSize: "0.9375rem" }}>
              Time: {metrics.takenSec ? `${Math.round(metrics.takenSec)}s` : "—"} · Expected: ~{metrics.expectedSec}s
            </div>
          </div>

          <div className="statGrid">
            <RadialStat label="Accuracy" value={metrics.accuracy} />
            <RadialStat label="Confidence" value={metrics.confidence} />
            <RadialStat label="Efficiency" value={metrics.efficiency} />
          </div>

          <div className="statGrid">
            {kpi("Marks", `${Math.round(metrics.marks)}%`, <Target />)}
            {kpi("Efficiency", `${Math.round(metrics.efficiency)}%`, <TrendingUp />)}
            {kpi("Time", metrics.takenSec ? `${Math.round(metrics.takenSec)}s` : "—", <Timer />)}
          </div>

          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="sectionTitle">Credentials</h2>
              {g ? (
                <div className="row" style={{ gap: 10 }}>
                  <span className="pill">
                    <Flame size={16} aria-hidden /> {g.streakCount} day streak
                  </span>
                  <span className="pill">
                    <Award size={16} aria-hidden /> {g.points} pts
                  </span>
                </div>
              ) : null}
            </div>
            <div className="row" style={{ gap: 10 }}>
              {(g?.badges?.length ? g.badges : ["Beginner"]).map((b) => (
                <span key={b} className="badge">
                  {b}
                </span>
              ))}
            </div>
          </div>

          <div className="card stack">
            <h2 className="sectionTitle">Per-skill breakdown</h2>
            <div className="stack" style={{ gap: "0.6rem" }}>
              {Object.entries((result.raw_scores as Record<string, unknown>) || {}).map(([skill, score], i) => (
                <div key={skill} className="barRow fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div className="truncate" style={{ fontWeight: 700 }} title={skill}>
                    {skill}
                  </div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${clamp(Number(score) || 0, 0, 100)}%` }} />
                  </div>
                  <div style={{ textAlign: "right", color: "var(--muted)", fontWeight: 700, minWidth: "3ch" }}>
                    {Math.round(Number(score) || 0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
