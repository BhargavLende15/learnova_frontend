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
        setError("We could not reach the catalog. Confirm the Learnova API is running and try again.");
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
      setError("Choose a career goal and at least one skill to continue.");
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
      <div className="container stack" style={{ gap: "0.75rem" }}>
        <div className="skeletonLine" style={{ maxWidth: 280 }} />
        <div className="skeletonLine" style={{ maxWidth: "100%" }} />
        <div className="skeletonLine" style={{ maxWidth: "85%" }} />
      </div>
    );
  }

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Your learning profile</h1>
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </header>

      <div className="card stack">
        <p style={{ color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
          Tell Learnova which role you are pursuing and which catalog skills to measure. We use this profile to generate assessment
          questions and your multi-phase roadmap — pick honestly so difficulty and pacing match you.
        </p>

        <div>
          <label className="label">Career goal</label>
          <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">Choose a goal…</option>
            {goals.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {goal && (
          <div>
            <label className="label">Skills to assess</label>
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
            {saving ? "Saving…" : "Save & go to assessment"}
          </button>
          <Link href="/roadmap" className="btn btn-ghost">
            View roadmap
          </Link>
        </div>
      </div>
    </div>
  );
}
