"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame, Trophy, UserCircle2 } from "lucide-react";

import { api } from "@/lib/api";
import { Alert, LoadingState, PageHeader } from "@/components/ui";

type Profile = {
  userId: string;
  name: string;
  email: string;
  points: number;
  streak: number;
  totalTopics: number;
  completedTopics: string[];
  recentCompletedTopics: string[];
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export default function ProfilePage() {
  const router = useRouter();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    (async () => {
      setLoading(true);
      setError("");
      try {
        const r = await api.profile(uid);
        setP(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const progress = useMemo(() => {
    const total = p?.totalTopics ?? 0;
    const done = (p?.completedTopics ?? []).length;
    const pct = total > 0 ? clamp((done / total) * 100, 0, 100) : 0;
    return { total, done, pct };
  }, [p]);

  return (
    <div className="container stack">
      <PageHeader title="Profile" description="Your progress, streak, and recent topic completions.">
        <Link href="/roadmap" className="btn btn-ghost">
          Roadmap
        </Link>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </PageHeader>

      {loading ? <LoadingState message="Loading profile…" /> : null}

      {!loading && error ? (
        <Alert variant="error" title="Could not load profile">
          {error}
        </Alert>
      ) : null}

      {!loading && !error && p ? (
        <div className="profileGrid">
          <div className="card stack fade-in-up">
            <div className="row" style={{ gap: 12 }}>
              <UserCircle2 size={40} aria-hidden style={{ flexShrink: 0, opacity: 0.9 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>{p.name}</div>
                <div style={{ color: "var(--muted)", fontSize: "0.9375rem" }}>{p.email}</div>
              </div>
            </div>
          </div>

          <div className="card stack fade-in-up" style={{ animationDelay: "0.05s" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.8125rem", fontWeight: 600 }}>Total points</div>
                <div style={{ fontWeight: 800, fontSize: "2.25rem", marginTop: 4, letterSpacing: "-0.03em" }}>{p.points}</div>
              </div>
              <Trophy size={32} aria-hidden style={{ opacity: 0.85 }} />
            </div>
          </div>

          <div className="card stack fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.8125rem", fontWeight: 600 }}>Current streak</div>
                <div style={{ fontWeight: 800, fontSize: "1.85rem", marginTop: 4, letterSpacing: "-0.02em" }}>{p.streak} days</div>
              </div>
              <Flame size={32} aria-hidden style={{ opacity: 0.85 }} />
            </div>
          </div>

          <div className="card stack fade-in-up" style={{ gridColumn: "1 / -1", animationDelay: "0.12s" }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 className="sectionTitle">Progress</h2>
              <span style={{ color: "var(--muted)", fontWeight: 700, fontSize: "0.875rem" }}>
                {progress.done} / {progress.total} topics completed
              </span>
            </div>
            <div className="barTrack" style={{ height: 14, marginTop: 8 }}>
              <div className="barFill" style={{ width: `${progress.pct}%` }} />
            </div>
          </div>

          <div className="card stack fade-in-up" style={{ gridColumn: "1 / -1", animationDelay: "0.16s" }}>
            <h2 className="sectionTitle">Recent activity</h2>
            {(p.recentCompletedTopics || []).length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>No completed topics yet. Finish items on your roadmap to see them here.</p>
            ) : (
              <ul className="stack" style={{ gap: "0.5rem", listStyle: "none", margin: 0, padding: 0 }}>
                {p.recentCompletedTopics.map((id) => (
                  <li key={id} className="row" style={{ justifyContent: "space-between" }}>
                    <span className="truncate" style={{ fontWeight: 700 }} title={id}>
                      {id}
                    </span>
                    <span className="badge">Completed</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
