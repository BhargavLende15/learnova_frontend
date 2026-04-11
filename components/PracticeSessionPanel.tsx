"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ExternalLink, Lock, PlayCircle } from "lucide-react";

import { api } from "@/lib/api";

export type TopicRow = {
  id: string;
  title: string;
  suggested_skip?: boolean;
};

type Props = {
  topics: TopicRow[];
  completedIds: Set<string>;
  unlockedTopicIds: Set<string>;
  onMarkDone: (topicId: string) => Promise<void>;
};

export function PracticeSessionPanel({ topics, completedIds, unlockedTopicIds, onMarkDone }: Props) {
  const [resources, setResources] = useState<Record<string, { youtubeLink: string; gfgLink: string }>>({});
  const [loadingRes, setLoadingRes] = useState<Record<string, boolean>>({});
  const [resError, setResError] = useState<Record<string, string>>({});

  const visibleTopics = useMemo(() => topics.filter((t) => t?.id && t?.title), [topics]);

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
            <div className="practiceHeadComplete">Action</div>
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
                <div className="practiceCell practiceCellTopic">
                  <div className="practiceTopicInner">
                    {locked ? <Lock size={16} className="practiceTopicIcon" /> : isDone ? <CheckCircle2 size={16} className="practiceTopicIcon" /> : <span className="practiceTopicSpacer" />}
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" title={t.title}>
                        {t.title}
                      </div>
                      {t.suggested_skip && <div style={{ color: "var(--warn)", fontSize: "0.8rem", marginTop: 2 }}>Optional skip</div>}
                    </div>
                  </div>
                </div>

                <div className="practiceCell practiceCellStack">
                  <button type="button" className="linkPill" disabled={locked || isLoading} onClick={() => ensureResources(titleKey)}>
                    {isLoading ? "Loading…" : "Load links"}
                  </button>
                  {errMsg && <span className="practiceCellHint practiceCellHintError">{errMsg}</span>}
                  {topicRes?.youtubeLink ? (
                    <a href={topicRes.youtubeLink} target="_blank" rel="noreferrer" className="btn btn-ghost practiceRowBtn">
                      <PlayCircle size={18} /> Watch <ExternalLink size={16} />
                    </a>
                  ) : (
                    <span className="practiceCellHint">Use “Load links” for video.</span>
                  )}
                </div>

                <div className="practiceCell practiceCellStack">
                  {topicRes?.gfgLink ? (
                    <a href={topicRes.gfgLink} target="_blank" rel="noreferrer" className="btn btn-ghost practiceRowBtn">
                      GFG practice <ExternalLink size={16} />
                    </a>
                  ) : (
                    <span className="practiceCellHint">Use “Load links” for practice.</span>
                  )}
                </div>

                <div className="practiceCell practiceCellAction">
                  <button
                    type="button"
                    className={`btn practiceMarkDoneBtn ${isDone ? "btn-success" : ""}`}
                    disabled={locked || isDone}
                    onClick={() => onMarkDone(t.id)}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 size={18} aria-hidden /> Done
                      </>
                    ) : (
                      "Mark as done"
                    )}
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
