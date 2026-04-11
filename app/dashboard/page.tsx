"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, LoadingState, PageHeader } from "@/components/ui";

export default function DashboardPage() {
  const router = useRouter();
  const gid = useId();
  const goalSelectId = `${gid}-goal`;

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
      <div className="container stack">
        <PageHeader title="Goal & skills" description="Choose what you want to learn next." />
        <LoadingState message="Loading catalog…" />
      </div>
    );
  }

  return (
    <div className="container stack">
      <PageHeader title="Goal & skills" description="Choose your career goal and the skills to assess. Only catalog options are allowed.">
        <Link href="/" className="btn btn-ghost">
          Home
        </Link>
      </PageHeader>

      <div className="card stack">
        <div>
          <label className="label" htmlFor={goalSelectId}>
            Career goal
          </label>
          <select id={goalSelectId} className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
            <option value="">Select a goal…</option>
            {goals.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {goal ? (
          <fieldset className="stack" style={{ border: "none", margin: 0, padding: 0, minWidth: 0 }}>
            <legend className="label" style={{ padding: 0 }}>
              Skills (select one or more)
            </legend>
            {skills.length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted)" }}>No skills listed for this goal.</p>
            ) : (
              <div className="skillList">
                {skills.map((s) => (
                  <label key={s} className="skillCheck">
                    <input type="checkbox" checked={selected.has(s)} onChange={() => toggleSkill(s)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        ) : null}

        {error ? (
          <Alert variant="error" title="Something went wrong">
            {error}
          </Alert>
        ) : null}

        <div className="row">
          <button className="btn" type="button" onClick={save} disabled={saving} aria-busy={saving}>
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
