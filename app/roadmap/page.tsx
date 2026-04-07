"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Phase = {
  name: string;
  description?: string;
  timeline_weeks: number;
  topics: { id: string; title: string; skill?: string; suggested_skip?: boolean }[];
  mini_projects?: { id: string; title: string; skill?: string }[];
};

export default function RoadmapPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [roadmap, setRoadmap] = useState<{ career_goal?: string; phases?: Phase[]; progress?: { completed_ids?: string[]; notes?: string[] } } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [perfInput, setPerfInput] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.getRoadmap(userId);
      setRoadmap(r.roadmap);
    } catch {
      setRoadmap(null);
      setError("No roadmap yet — generate after assessment.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    setUserId(uid);
  }, [router]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  async function generate() {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.generateRoadmap(userId);
      setRoadmap(r.roadmap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generate failed");
    } finally {
      setLoading(false);
    }
  }

  async function completeItem(itemId: string, type: "topic" | "project") {
    if (!userId) return;
    const raw = perfInput[itemId];
    const performance_score = raw === "" || raw === undefined ? null : Number(raw);
    setLoading(true);
    setError("");
    try {
      const r = await api.progressUpdate({
        user_id: userId,
        item_id: itemId,
        item_type: type,
        completed: true,
        performance_score: Number.isFinite(performance_score as number) ? (performance_score as number) : null,
      });
      setRoadmap(r.roadmap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const completed = new Set(roadmap?.progress?.completed_ids || []);

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Learning roadmap</h1>
        <div className="row">
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          <Link href="/assessment" className="btn btn-ghost">
            Assessment
          </Link>
        </div>
      </header>

      <div className="row">
        <button className="btn" type="button" onClick={generate} disabled={loading}>
          {loading ? "…" : "Generate / refresh roadmap"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>
          Reload
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {roadmap && (
        <div className="stack">
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Goal: <strong>{roadmap.career_goal}</strong>
          </p>
          {(roadmap.progress?.notes?.length ?? 0) > 0 && (
            <div className="card" style={{ borderColor: "var(--warn)" }}>
              <strong>Progress agent</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {roadmap.progress!.notes!.slice(-5).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Timeline</h2>
            <div className="row" style={{ alignItems: "stretch" }}>
              {(roadmap.phases || []).map((ph) => (
                <div
                  key={ph.name}
                  className="card"
                  style={{ flex: "1 1 200px", minWidth: 180, padding: "1rem" }}
                >
                  <strong>{ph.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
                    ~{ph.timeline_weeks} wk
                  </div>
                </div>
              ))}
            </div>
          </div>

          {(roadmap.phases || []).map((ph) => (
            <div key={ph.name} className="card phase stack">
              <div>
                <h2 style={{ margin: 0 }}>{ph.name}</h2>
                <p style={{ color: "var(--muted)", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
                  {ph.description}
                </p>
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", color: "var(--muted)" }}>Topics</h3>
                {ph.topics.map((t) => (
                  <div key={t.id} className="topic-line">
                    <div>
                      <div>{t.title}</div>
                      {t.suggested_skip && (
                        <span style={{ color: "var(--warn)", fontSize: "0.8rem" }}>Optional skip</span>
                      )}
                    </div>
                    <div className="row">
                      <input
                        className="input"
                        style={{ width: 72 }}
                        placeholder="%"
                        value={perfInput[t.id] ?? ""}
                        onChange={(e) => setPerfInput((p) => ({ ...p, [t.id]: e.target.value }))}
                      />
                      <button
                        className="btn"
                        type="button"
                        disabled={loading || completed.has(t.id)}
                        onClick={() => completeItem(t.id, "topic")}
                      >
                        {completed.has(t.id) ? "Done" : "Complete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {(ph.mini_projects?.length ?? 0) > 0 && (
                <div>
                  <h3 style={{ fontSize: "0.95rem", color: "var(--muted)" }}>Mini-projects</h3>
                  {ph.mini_projects!.map((p) => (
                    <div key={p.id} className="topic-line">
                      <span>{p.title}</span>
                      <div className="row">
                        <input
                          className="input"
                          style={{ width: 72 }}
                          placeholder="%"
                          value={perfInput[p.id] ?? ""}
                          onChange={(e) => setPerfInput((x) => ({ ...x, [p.id]: e.target.value }))}
                        />
                        <button
                          className="btn"
                          type="button"
                          disabled={loading || completed.has(p.id)}
                          onClick={() => completeItem(p.id, "project")}
                        >
                          {completed.has(p.id) ? "Done" : "Complete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
