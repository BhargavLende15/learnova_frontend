"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PracticeSessionPanel } from "@/components/PracticeSessionPanel";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/ui";
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
  const [roadmap, setRoadmap] = useState<{
    career_goal?: string;
    phases?: Phase[];
    progress?: { completed_ids?: string[]; notes?: string[] };
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.getRoadmap(userId);
      if (r.roadmap) {
        setRoadmap(r.roadmap);
        setError("");
      } else {
        setRoadmap(null);
        setError("No roadmap yet — generate after assessment.");
      }
    } catch {
      setRoadmap(null);
      setError("No roadmap yet — generate after assessment.");
    } finally {
      setLoading(false);
      setBootLoading(false);
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

  const generate = useCallback(async () => {
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
      setBootLoading(false);
    }
  }, [userId]);

  const completeItem = useCallback(
    async (itemId: string, type: "topic" | "project") => {
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
    },
    [userId]
  );

  const onMarkTopicDone = useCallback(
    (topicId: string) => completeItem(topicId, "topic"),
    [completeItem]
  );

  const completed = useMemo(() => new Set(roadmap?.progress?.completed_ids || []), [roadmap]);
  const unlocked = useMemo(() => {
    const p: { unlocked_topic_ids?: string[] } = (roadmap as { progress?: { unlocked_topic_ids?: string[] } })?.progress || {};
    const ids: string[] = p.unlocked_topic_ids || [];
    if (ids.length) return new Set(ids);
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
      <PageHeader title="Learning roadmap" description="Generate from your latest assessment, then work topics in order.">
        <Link href="/dashboard" className="btn btn-ghost">
          Dashboard
        </Link>
        <Link href="/assessment" className="btn btn-ghost">
          Assessment
        </Link>
        <Link href="/skill-map" className="btn btn-ghost">
          Skill map
        </Link>
      </PageHeader>

      <div className="row">
        <button className="btn" type="button" onClick={generate} disabled={loading}>
          {loading ? "Working…" : "Generate / refresh roadmap"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={load} disabled={loading}>
          Reload
        </button>
      </div>

      {bootLoading && !roadmap ? <LoadingState message="Loading roadmap…" /> : null}

      {!bootLoading && !roadmap && error ? (
        <EmptyState
          title="Create your roadmap"
          description={error}
          action={
            <div className="row" style={{ justifyContent: "center" }}>
              <Link href="/assessment" className="btn">
                Go to assessment
              </Link>
              <button type="button" className="btn btn-ghost" onClick={generate} disabled={loading}>
                Try generate
              </button>
            </div>
          }
        />
      ) : null}

      {error && roadmap ? (
        <Alert variant="warning" title="Heads up">
          {error}
        </Alert>
      ) : null}

      {roadmap ? (
        <div className="stack">
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Goal: <strong>{roadmap.career_goal}</strong>
          </p>
          {(roadmap.progress?.notes?.length ?? 0) > 0 ? (
            <div className="card" style={{ borderColor: "rgba(251, 191, 36, 0.45)" }}>
              <strong>Progress agent</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {roadmap.progress!.notes!.slice(-5).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card stack">
            <h2 className="sectionTitle">Timeline</h2>
            <div className="timelineGrid">
              {(roadmap.phases || []).map((ph) => (
                <div key={ph.name} className="card timelineCard cardMuted">
                  <strong>{ph.name}</strong>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 4 }}>~{ph.timeline_weeks} wk</div>
                </div>
              ))}
            </div>
          </div>

          <PracticeSessionPanel
            topics={allTopics}
            completedIds={completed}
            unlockedTopicIds={unlocked}
            onMarkDone={onMarkTopicDone}
          />
        </div>
      ) : null}
    </div>
  );
}
