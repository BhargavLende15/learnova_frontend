"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, Lock, PlayCircle } from "lucide-react";

import { api } from "@/lib/api";

export type TopicRow = {
  id: string;
  title: string;
  suggested_skip?: boolean;
};

type Props = {
  userId: string;
  topics: TopicRow[];
  completedIds: Set<string>;
  unlockedTopicIds: Set<string>;
  onMarkDone: (topicId: string) => Promise<void>;
};

export function PracticeSessionPanel({ userId, topics, completedIds, unlockedTopicIds, onMarkDone }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [resources, setResources] = useState<Record<string, { youtubeLink: string; gfgLink: string }>>({});
  const [loadingRes, setLoadingRes] = useState<Record<string, boolean>>({});
  const [resError, setResError] = useState<Record<string, string>>({});

  const visibleTopics = useMemo(() => topics.filter((t) => t?.id && t?.title), [topics]);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const initial: Record<string, string> = {};
      await Promise.all(
        visibleTopics.slice(0, 8).map(async (t) => {
          try {
            const r = await api.getNotes(userId, t.id);
            initial[t.id] = r.notes ?? "";
          } catch {
            initial[t.id] = "";
          }
        })
      );
      setNotes((prev) => ({ ...initial, ...prev }));
    })();
  }, [userId, visibleTopics]);

  async function ensureResources(topicTitle: string) {
    if (resources[topicTitle]) return;
    setLoadingRes((p) => ({ ...p, [topicTitle]: true }));
    setResError((p) => ({ ...p, [topicTitle]: "" }));
    try {
      const r = await api.getDirectResources(topicTitle);
      setResources((p) => ({ ...p, [topicTitle]: { youtubeLink: r.youtubeLink, gfgLink: r.gfgLink } }));
    } catch (e) {
      setResError((p) => ({ ...p, [topicTitle]: e instanceof Error ? e.message : "Failed to fetch resources" }));
    } finally {
      setLoadingRes((p) => ({ ...p, [topicTitle]: false }));
    }
  }

  async function saveTopicNotes(topicId: string) {
    setSaving((p) => ({ ...p, [topicId]: true }));
    try {
      await api.saveNotes({ userId, topicId, notes: notes[topicId] ?? "" });
    } finally {
      setSaving((p) => ({ ...p, [topicId]: false }));
    }
  }

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Practice session</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
            Work through topics in order. Completing a topic unlocks the next one.
          </p>
        </div>
      </div>

      <div className="practiceTableWrap">
        <div className="practiceTable">
          <div className="practiceHeader">
            <div>Topic</div>
            <div>Resources</div>
            <div>Practice</div>
            <div>Notes</div>
            <div>Complete</div>
          </div>

          {visibleTopics.map((t) => {
            const isDone = completedIds.has(t.id);
            const isUnlocked = unlockedTopicIds.has(t.id) || isDone;
            const locked = !isUnlocked;

            const titleKey = t.title;
            const topicRes = resources[titleKey];
            const isLoading = !!loadingRes[titleKey];
            const errMsg = resError[titleKey];

            return (
              <motion.div
                key={t.id}
                className={`practiceRow ${locked ? "isLocked" : ""}`}
                initial={false}
                animate={{ opacity: locked ? 0.6 : 1 }}
                transition={{ duration: 0.25 }}
              >
                <div className="practiceCell">
                  <div className="row" style={{ gap: "0.5rem", flexWrap: "nowrap" }}>
                    {locked ? <Lock size={16} /> : isDone ? <CheckCircle2 size={16} /> : null}
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" title={t.title}>
                        {t.title}
                      </div>
                      {t.suggested_skip && (
                        <div style={{ color: "var(--warn)", fontSize: "0.8rem" }}>Optional skip</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="practiceCell">
                  <div className="stack" style={{ gap: "0.4rem" }}>
                    <button
                      type="button"
                      className="linkPill"
                      disabled={locked || isLoading}
                      onClick={() => ensureResources(titleKey)}
                    >
                      {isLoading ? "Loading…" : "Load links"}
                    </button>
                    {errMsg && <span style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{errMsg}</span>}
                    {topicRes?.youtubeLink ? (
                      <a href={topicRes.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-ghost">
                        <PlayCircle size={18} /> Watch Video <ExternalLink size={16} />
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>Click “Load links” to fetch.</span>
                    )}
                  </div>
                </div>

                <div className="practiceCell">
                  <div className="stack" style={{ gap: "0.35rem" }}>
                    {topicRes?.gfgLink ? (
                      <a href={topicRes.gfgLink} target="_blank" rel="noreferrer" className="btn btn-ghost">
                        💻 Practice on GFG <ExternalLink size={16} />
                      </a>
                    ) : (
                      <span style={{ color: "var(--muted)" }}>Click “Load links” to fetch.</span>
                    )}
                  </div>
                </div>

                <div className="practiceCell">
                  <textarea
                    className="textarea"
                    placeholder={locked ? "Locked" : "Write quick notes…"}
                    disabled={locked}
                    value={notes[t.id] ?? ""}
                    onChange={(e) => setNotes((p) => ({ ...p, [t.id]: e.target.value }))}
                    onBlur={() => {
                      if (!locked) saveTopicNotes(t.id);
                    }}
                  />
                  <div style={{ marginTop: 6, color: "var(--muted)", fontSize: "0.8rem" }}>
                    {saving[t.id] ? "Saving…" : "Autosaves on blur"}
                  </div>
                </div>

                <div className="practiceCell" style={{ justifySelf: "end" }}>
                  <button
                    type="button"
                    className={`btn ${isDone ? "btn-success" : ""}`}
                    disabled={locked || isDone}
                    onClick={() => onMarkDone(t.id)}
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      {isDone ? (
                        <motion.span
                          key="done"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="row"
                          style={{ gap: 8 }}
                        >
                          <CheckCircle2 size={18} /> Done
                        </motion.span>
                      ) : (
                        <motion.span key="mark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Mark as done
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

