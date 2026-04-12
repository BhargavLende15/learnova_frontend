"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter, RefreshCw, Search } from "lucide-react";
import { api } from "@/lib/api";
import { PracticeSessionPanel } from "@/components/PracticeSessionPanel";
import { RoadmapProgressPanel } from "@/components/RoadmapProgressPanel";
import toast from "react-hot-toast";

type WeekPlan = {
  week: number;
  title?: string;
  focus_skill?: string;
  topics?: string[];
  subtopics?: string[];
  practice_tasks?: string[];
  mini_projects?: string[];
  revision_goals?: string[];
  useful_resources?: string[];
  milestone?: string;
  estimated_effort_hours?: number;
};

type Phase = {
  name: string;
  description?: string;
  timeline_weeks: number;
  timeline_rationale?: string;
  weekly_breakdown?: WeekPlan[];
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
  const [filterQ, setFilterQ] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");
    try {
      const r = await api.getRoadmap(userId);
      setRoadmap(r.roadmap);
    } catch {
      setRoadmap(null);
      setError("No roadmap yet — finish your assessment, then generate a roadmap from this page.");
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
          userId: userId,
          itemId: itemId,
          itemType: type,
          completed: true,
          performanceScore: null,
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

  const filteredTopics = useMemo(() => {
    let list = allTopics;
    const q = filterQ.trim().toLowerCase();
    if (q) list = list.filter((t) => t.title.toLowerCase().includes(q));
    if (hideCompleted) list = list.filter((t) => !completed.has(t.id));
    return list;
  }, [allTopics, filterQ, hideCompleted, completed]);

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Learning roadmap</h1>
        <div className="row">
          <Link href="/profile" className="btn btn-ghost">
            Dashboard
          </Link>
          <Link href="/assessment" className="btn btn-ghost">
            Assessment
          </Link>
          <Link href="/skill-map" className="btn btn-ghost">
            Skill map
          </Link>
        </div>
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Your learning roadmap</h1>
        <Link href="/assessment" className="btn btn-ghost">
          Assessment
        </Link>
      </header>

      <div className="row" style={{ alignItems: "stretch", gap: "0.75rem" }}>
        <div className="searchBarNeo" style={{ flex: 1, minWidth: 0 }}>
          <Search size={18} color="var(--muted)" aria-hidden />
          <input
            type="search"
            placeholder="Filter topics by keyword…"
            value={filterQ}
            onChange={(e) => setFilterQ(e.target.value)}
            aria-label="Search topics"
          />
        </div>
        <button className="btn btn-ghost" type="button" onClick={load} disabled={loading} title="Reload roadmap">
          <RefreshCw size={18} />
        </button>
        <button className="btn" type="button" onClick={generate} disabled={loading}>
          {loading ? "…" : "Regenerate roadmap"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          aria-pressed={hideCompleted}
          aria-label="Hide completed topics"
          title={hideCompleted ? "Show all topics" : "Hide completed"}
          onClick={() => setHideCompleted((v) => !v)}
          style={hideCompleted ? { boxShadow: "var(--shadow-in-1), var(--shadow-in-2)" } : undefined}
        >
          <Filter size={18} />
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {roadmap && (
        <div className="stack">
          <RoadmapProgressPanel
            careerGoal={roadmap.career_goal}
            phases={roadmap.phases || []}
            topicsTotal={allTopics.length}
            topicsCompleted={allTopics.filter((t) => completed.has(t.id)).length}
          />
          {(roadmap.progress?.notes?.length ?? 0) > 0 && (
            <div className="card stack" style={{ borderLeft: "4px solid var(--warn)" }}>
              <strong>Progress notes</strong>
              <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.25rem" }}>
                {roadmap.progress!.notes!.slice(-5).map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card stack">
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Timeline & weekly cadence</h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", maxWidth: 720 }}>
              Phases are sized like a focused part-time program: each week mixes theory, practice, a small build, and revision so
              the total duration reflects real depth — not an arbitrary deadline.
            </p>
            <div className="stack" style={{ gap: "1.25rem" }}>
              {(roadmap.phases || []).map((ph) => (
                <div key={ph.name} className="card-inset stack" style={{ padding: "1.1rem 1.2rem" }}>
                  <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "1.05rem" }}>{ph.name}</strong>
                    <span style={{ color: "var(--muted)", fontSize: "0.85rem", fontWeight: 700 }}>~{ph.timeline_weeks} weeks</span>
                  </div>
                  {ph.description && (
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem" }}>{ph.description}</p>
                  )}
                  {ph.timeline_rationale && (
                    <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>{ph.timeline_rationale}</p>
                  )}
                  {ph.weekly_breakdown && ph.weekly_breakdown.length > 0 && (
                    <div className="stack" style={{ gap: "0.85rem", marginTop: "0.35rem" }}>
                      {ph.weekly_breakdown.map((w) => (
                        <div key={`${ph.name}-w${w.week}`} className="weekPlanCard">
                          <div className="weekPlanHead">
                            <span className="weekPlanBadge">Week {w.week}</span>
                            <span className="weekPlanTitle">{w.title || `${ph.name} focus`}</span>
                            {typeof w.estimated_effort_hours === "number" && (
                              <span className="weekPlanHours">≈{w.estimated_effort_hours}h</span>
                            )}
                          </div>
                          {w.milestone && <p className="weekPlanMilestone">{w.milestone}</p>}
                          <ul className="weekPlanList">
                            {(w.subtopics || []).slice(0, 6).map((s) => (
                              <li key={s}>
                                <strong>Subtopic:</strong> {s}
                              </li>
                            ))}
                            {(w.practice_tasks || []).map((s) => (
                              <li key={s}>
                                <strong>Practice:</strong> {s}
                              </li>
                            ))}
                            {(w.mini_projects || []).map((s) => (
                              <li key={s}>
                                <strong>Mini project:</strong> {s}
                              </li>
                            ))}
                            {(w.revision_goals || []).map((s) => (
                              <li key={s}>
                                <strong>Revision:</strong> {s}
                              </li>
                            ))}
                            {(w.useful_resources || []).map((s) => (
                              <li key={s}>
                                <strong>Resources:</strong> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <PracticeSessionPanel
            topics={filteredTopics}
            completedIds={completed}
            unlockedTopicIds={unlocked}
           onMarkDone={async (topicId: string) =>
            completeItem(topicId, "topic")
}
          />
        </div>
      )}
    </div>
  );
}
