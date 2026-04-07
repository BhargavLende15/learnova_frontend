"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ExternalLink, Lock } from "lucide-react";

import { api } from "@/lib/api";

export type TopicRow = {
  id: string;
  title: string;
  suggested_skip?: boolean;
};

type LinkItem = { title: string; url: string };

type Props = {
  userId: string;
  topics: TopicRow[];
  completedIds: Set<string>;
  unlockedTopicIds: Set<string>;
  onMarkDone: (topicId: string) => Promise<void>;
};

function dedupeLinks(items: LinkItem[]) {
  const seen = new Set<string>();
  return items.filter((x) => {
    const k = x.url;
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function PracticeSessionPanel({ userId, topics, completedIds, unlockedTopicIds, onMarkDone }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [links, setLinks] = useState<
    Record<string, { reading: LinkItem[]; videos: LinkItem[]; practice: LinkItem[] }>
  >({});
  const [loadingLinks, setLoadingLinks] = useState<Record<string, boolean>>({});
  const loadedOnce = useRef<Set<string>>(new Set());

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

  async function ensureLinks(topicTitle: string) {
    if (loadedOnce.current.has(topicTitle)) return;
    loadedOnce.current.add(topicTitle);
    setLoadingLinks((p) => ({ ...p, [topicTitle]: true }));
    try {
      const [r1, r2] = await Promise.all([api.generateResources(topicTitle), api.generatePracticeLinks(topicTitle)]);
      setLinks((p) => ({
        ...p,
        [topicTitle]: {
          reading: dedupeLinks((r1.reading || []).map((x: any) => ({ title: x.title, url: x.url }))),
          videos: dedupeLinks((r1.videos || []).map((x: any) => ({ title: x.title, url: x.url }))),
          practice: dedupeLinks((r2.practice || []).map((x: any) => ({ title: x.title, url: x.url }))),
        },
      }));
    } finally {
      setLoadingLinks((p) => ({ ...p, [topicTitle]: false }));
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
            const topicLinks = links[titleKey];
            const isLoading = !!loadingLinks[titleKey];

            return (
              <motion.div
                key={t.id}
                className={`practiceRow ${locked ? "isLocked" : ""}`}
                initial={false}
                animate={{ opacity: locked ? 0.6 : 1 }}
                transition={{ duration: 0.25 }}
                onViewportEnter={() => {
                  if (!locked) ensureLinks(titleKey);
                }}
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
                      onClick={() => ensureLinks(titleKey)}
                    >
                      {isLoading ? "Loading…" : "Load links"}
                    </button>
                    <div className="stack" style={{ gap: "0.25rem" }}>
                      {(topicLinks?.reading || []).slice(0, 2).map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="miniLink">
                          {l.title} <ExternalLink size={14} />
                        </a>
                      ))}
                      {(topicLinks?.videos || []).slice(0, 2).map((l) => (
                        <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="miniLink">
                          {l.title} <ExternalLink size={14} />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="practiceCell">
                  <div className="stack" style={{ gap: "0.35rem" }}>
                    {(topicLinks?.practice || []).slice(0, 4).map((l) => (
                      <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="miniLink">
                        {l.title} <ExternalLink size={14} />
                      </a>
                    ))}
                    {!topicLinks?.practice?.length && <span style={{ color: "var(--muted)" }}>—</span>}
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

