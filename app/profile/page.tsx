"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Flame, Trophy, UserCircle2 } from "lucide-react";

import { api } from "@/lib/api";

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
  const [userId, setUserId] = useState("");
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Profile</h1>
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
      </header>

      {loading && <p style={{ color: "var(--muted)", margin: 0 }}>Loading…</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && p && (
        <div className="profileGrid">
          <motion.div className="card stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row" style={{ gap: 10 }}>
                <UserCircle2 />
                <div>
                  <div style={{ fontWeight: 1000, fontSize: "1.15rem" }}>{p.name}</div>
                  <div style={{ color: "var(--muted)" }}>{p.email}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="card stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Total Points</div>
                <div style={{ fontWeight: 1100, fontSize: "2.4rem", marginTop: 4 }}>{p.points}</div>
              </div>
              <Trophy />
            </div>
          </motion.div>

          <motion.div className="card stack" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>Current streak</div>
                <div style={{ fontWeight: 1100, fontSize: "2.0rem", marginTop: 4 }}>{p.streak} days</div>
              </div>
              <Flame />
            </div>
          </motion.div>

          <motion.div className="card stack" style={{ gridColumn: "1 / -1" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Progress</h2>
              <span style={{ color: "var(--muted)", fontWeight: 800 }}>
                {progress.done} / {progress.total} topics completed
              </span>
            </div>
            <div className="barTrack" style={{ height: 14 }}>
              <div className="barFill" style={{ width: `${progress.pct}%` }} />
            </div>
          </motion.div>

          <motion.div className="card stack" style={{ gridColumn: "1 / -1" }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Recent activity</h2>
            {(p.recentCompletedTopics || []).length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>No completed topics yet.</p>
            ) : (
              <div className="stack" style={{ gap: "0.5rem" }}>
                {p.recentCompletedTopics.map((id) => (
                  <div key={id} className="row" style={{ justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 900 }}>{id}</span>
                    <span className="badge">Completed</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

