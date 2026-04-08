"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Award, Flame, Target, Timer, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

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
    <div className="card" style={{ padding: "1rem 1.1rem" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{label}</div>
          <div style={{ fontSize: "1.45rem", fontWeight: 900, marginTop: 4 }}>{value}</div>
        </div>
        <div style={{ opacity: 0.9 }}>{icon}</div>
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

  // hue: 0=red → 60=yellow → 120=green, proportional to pct
  const hue = Math.round(pct * 1.2);
  const arcColor = `hsl(${hue}, 80%, 55%)`;

  return (
    <div className="card" style={{ padding: "1.25rem 1.1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          {/* background track */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={strokeWidth}
          />
          {/* progress arc */}
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${gap}`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        {/* centre label */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "1.45rem", fontWeight: 900, color: arcColor }}>{pct}%</span>
        </div>
      </div>
      <div style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 600 }}>{label}</div>
    </div>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);
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
    const raw = result?.raw_scores ? Object.values(result.raw_scores).map((x: any) => Number(x) || 0) : [];
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
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Results</h1>
        <div className="row">
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          <Link href="/roadmap" className="btn btn-ghost">
            Roadmap
          </Link>
          <Link href="/skill-map" className="btn btn-ghost">
            Skill map
          </Link>
        </div>
      </header>

      {loading && <p style={{ color: "var(--muted)", margin: 0 }}>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && result && (
        <div className="stack">
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ textAlign: "center" }}
          >
            <div style={{ color: "var(--muted)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Score
            </div>
            <div style={{ fontSize: "3.2rem", fontWeight: 1000, marginTop: 8 }}>
              {Math.round(metrics.marks)}
              <span style={{ fontSize: "1.1rem", color: "var(--muted)" }}>/100</span>
            </div>
            <div style={{ color: "var(--muted)", marginTop: 8 }}>
              Time: {metrics.takenSec ? `${Math.round(metrics.takenSec)}s` : "—"} · Expected: ~{metrics.expectedSec}s
            </div>
          </motion.div>

          <div className="row" style={{ alignItems: "stretch" }}>
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <RadialStat label="Accuracy" value={metrics.accuracy} />
            </div>
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <RadialStat label="Confidence" value={metrics.confidence} />
            </div>
            <div style={{ flex: "1 1 260px", minWidth: 240 }}>
              <RadialStat label="Efficiency" value={metrics.efficiency} />
            </div>
          </div>

          <div className="row" style={{ alignItems: "stretch" }}>
            <div style={{ flex: "1 1 220px", minWidth: 220 }}>{kpi("Marks", `${Math.round(metrics.marks)}%`, <Target />)}</div>
            <div style={{ flex: "1 1 220px", minWidth: 220 }}>
              {kpi("Efficiency", `${Math.round(metrics.efficiency)}%`, <TrendingUp />)}
            </div>
            <div style={{ flex: "1 1 220px", minWidth: 220 }}>
              {kpi("Time", metrics.takenSec ? `${Math.round(metrics.takenSec)}s` : "—", <Timer />)}
            </div>
          </div>

          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Credentials</h2>
              {g && (
                <div className="row" style={{ gap: 10 }}>
                  <span className="pill">
                    <Flame size={16} /> {g.streakCount} day streak
                  </span>
                  <span className="pill">
                    <Award size={16} /> {g.points} pts
                  </span>
                </div>
              )}
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
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Per-skill breakdown</h2>
            <div className="stack" style={{ gap: "0.6rem" }}>
              {Object.entries(result.raw_scores || {}).map(([skill, score]: any) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="barRow"
                >
                  <div style={{ minWidth: 120, fontWeight: 800 }}>{skill}</div>
                  <div className="barTrack">
                    <div className="barFill" style={{ width: `${clamp(Number(score) || 0, 0, 100)}%` }} />
                  </div>
                  <div style={{ width: 60, textAlign: "right", color: "var(--muted)", fontWeight: 800 }}>
                    {Math.round(Number(score) || 0)}%
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

