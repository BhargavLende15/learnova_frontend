"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [goals, setGoals] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [goal, setGoal] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    setUserId(uid);
    (async () => {
      try {
        const g = await api.goals();
        setGoals(g.goals || []);
        const prefs = await api.getGoalSkills(uid);
        if (prefs.career_goal) {
          setGoal(prefs.career_goal);
          const sk = await api.skills(prefs.career_goal);
          setSkills(sk.skills || []);
          setSelected(new Set(prefs.selected_skills || []));
        }
      } catch {
        setError("Could not load catalog. Is the API running?");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  useEffect(() => {
    if (!goal) {
      setSkills([]);
      return;
    }
    (async () => {
      try {
        const sk = await api.skills(goal);
        setSkills(sk.skills || []);
        setSelected(new Set());
      } catch {
        setSkills([]);
      }
    })();
  }, [goal]);

  function toggleSkill(s: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });
  }

  async function save() {
    if (!userId || !goal || selected.size === 0) {
      setError("Pick a goal and at least one skill.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.saveGoalSkills({
        user_id: userId,
        career_goal: goal,
        selected_skills: Array.from(selected),
      });
      router.push("/assessment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Goal & skills</h1>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </header>

      <div className="card stack">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Choose your career goal and the skills to assess. Only catalog options are allowed (no free
          text).
        </p>

        <div>
          <label className="label">Career goal</label>
          <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">Select…</option>
            {goals.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {goal && (
          <div>
            <label className="label">Skills (multi-select)</label>
            <div className="stack" style={{ gap: "0.4rem" }}>
              {skills.map((s) => (
                <label key={s} className="row" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={selected.has(s)}
                    onChange={() => toggleSkill(s)}
                  />
                  <span>{s}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="row">
          <button className="btn" type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save & start assessment"}
          </button>
          <Link href="/roadmap" className="btn btn-ghost">
            Open roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
