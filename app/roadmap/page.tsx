"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PracticeSessionPanel } from "@/components/PracticeSessionPanel";
import toast from "react-hot-toast";

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
    setLoading(true);
    setError("");
    try {
      if (type === "topic") {
        const r = await api.completeTopic(userId, itemId);
        if (r.earned) toast.success(`+${r.earned} points earned!`);
        if (r.roadmap) setRoadmap(r.roadmap);
        window.dispatchEvent(new Event("learnova:profile-updated"));
      } else {
        const r = await api.progressUpdate({
          user_id: userId,
          item_id: itemId,
          item_type: type,
          completed: true,
          performance_score: null,
        });
        setRoadmap(r.roadmap);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  const completed = useMemo(() => new Set(roadmap?.progress?.completed_ids || []), [roadmap]);
  const unlocked = useMemo(() => {
    const p: any = (roadmap as any)?.progress || {};
    const ids: string[] = p.unlocked_topic_ids || [];
    if (ids.length) return new Set(ids);
    // Fallback client-side unlock: first incomplete topic is unlocked.
    const ordered: string[] = [];
    for (const ph of roadmap?.phases || []) for (const t of ph.topics || []) ordered.push(t.id);
    const u = new Set<string>(completed);
    for (const tid of ordered) {
      if (!completed.has(tid)) {
        u.add(tid);
        break;
      }
    }
    return u;
  }, [roadmap, completed]);

  const allTopics = useMemo(() => {
    const out: { id: string; title: string; suggested_skip?: boolean }[] = [];
    for (const ph of roadmap?.phases || []) {
      for (const t of ph.topics || []) out.push({ id: t.id, title: t.title, suggested_skip: t.suggested_skip });
    }
    return out;
  }, [roadmap]);

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
          <Link href="/skill-map" className="btn btn-ghost">
            Skill map
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

          <PracticeSessionPanel
            userId={userId}
            topics={allTopics}
            completedIds={completed}
            unlockedTopicIds={unlocked}
            onMarkDone={async (topicId) => completeItem(topicId, "topic")}
          />
        </div>
      )}
    </div>
  );
}
