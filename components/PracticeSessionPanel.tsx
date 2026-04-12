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

type TopicResources = {
  youtubeLink: string;
  gfgLink: string;
  youtubeDescription?: string;
  gfgDescription?: string;
};

type Props = {
  topics: TopicRow[];
  completedIds: Set<string>;
  unlockedTopicIds: Set<string>;
  onMarkDone: (topicId: string) => Promise<void>;
};

export function PracticeSessionPanel({ topics, completedIds, unlockedTopicIds, onMarkDone }: Props) {
  const [resources, setResources] = useState<Record<string, TopicResources>>({});
  const [extraPack, setExtraPack] = useState<
    Record<string, { reading?: { title: string; url: string; description?: string }[] }>
  >({});
  const [loadingRes, setLoadingRes] = useState<Record<string, boolean>>({});
  const [resError, setResError] = useState<Record<string, string>>({});

  const visibleTopics = useMemo(() => topics.filter((t) => t?.id && t?.title), [topics]);

  async function ensureResources(topicTitle: string) {
    if (resources[topicTitle]) return;
    setLoadingRes((p) => ({ ...p, [topicTitle]: true }));
    setResError((p) => ({ ...p, [topicTitle]: "" }));
    try {
      const r = await api.getDirectResources(topicTitle);
      setResources((p) => ({
        ...p,
        [topicTitle]: {
          youtubeLink: r.youtubeLink,
          gfgLink: r.gfgLink,
          youtubeDescription: r.youtubeDescription,
          gfgDescription: r.gfgDescription,
        },
      }));
      try {
        const pack = await api.generateResourcePack(topicTitle);
        setExtraPack((p) => ({ ...p, [topicTitle]: { reading: pack.reading } }));
      } catch {
        /* optional pack */
      }
    } catch (e) {
      setResError((p) => ({
        ...p,
        [topicTitle]: e instanceof Error ? e.message : "We could not load resources. Try again.",
      }));
    } finally {
      setLoadingRes((p) => ({ ...p, [topicTitle]: false }));
    }
  }

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Practice session</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem", maxWidth: 640 }}>
            Work through topics in order. Each row unlocks after the previous one is complete. Load resources to see curated links
            with short descriptions — URLs stay the same; we add context so you know why each source helps.
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
            const readingExtra = extraPack[titleKey]?.reading;

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
                    {locked ? (
                      <Lock size={16} className="practiceTopicIcon" />
                    ) : isDone ? (
                      <CheckCircle2 size={16} className="practiceTopicIcon" />
                    ) : (
                      <span className="practiceTopicSpacer" />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <div className="truncate" title={t.title}>
                        {t.title}
                      </div>
                      {t.suggested_skip && (
                        <div style={{ color: "var(--warn)", fontSize: "0.8rem", marginTop: 2 }}>Optional track</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="practiceCell practiceCellStack" style={{ display: "flex", alignItems: "center" }}>
                  <button
                    type="button"
                    className="linkPill"
                    disabled={locked || isLoading}
                    onClick={() => ensureResources(titleKey)}
                  >
                    {isLoading ? "Loading…" : "Load resources"}
                  </button>
                  {errMsg && <span className="practiceCellHint practiceCellHintError">{errMsg}</span>}
                  {topicRes?.youtubeLink ? (
                    <>
                      <a
                        href={topicRes.youtubeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost practiceRowBtn"
                      >
                        <PlayCircle size={18} /> Watch <ExternalLink size={16} />
                      </a>
                      {/* {topicRes.youtubeDescription && <p className="resourceDesc">{topicRes.youtubeDescription}</p>} */}
                    </>
                  ) : (
                    <span className="practiceCellHint">Use “Load resources” for the video link.</span>
                  )}
                  {/* {readingExtra?.length ? (
                    <div className="resourceExtraBlock">
                      <div className="resourceExtraLabel">More reading</div>
                      {readingExtra.slice(0, 2).map((item) => (
                        <div key={item.url} className="resourceExtraItem">
                          <a href={item.url} target="_blank" rel="noreferrer" className="miniLink">
                            {item.title} <ExternalLink size={14} />
                          </a>
                          {item.description && <p className="resourceDesc">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  ) : null} */}
                </div>

                <div className="practiceCell practiceCellStack" style={{ display: "flex", alignItems: "center" }}>
                  {topicRes?.gfgLink ? (
                    <>
                      <a href={topicRes.gfgLink} target="_blank" rel="noreferrer" className="btn btn-ghost practiceRowBtn">
                        Practice search <ExternalLink size={16} />
                      </a>
                      {/* {topicRes.gfgDescription && <p className="resourceDesc">{topicRes.gfgDescription}</p>} */}
                    </>
                  ) : (
                    <span className="practiceCellHint">Use “Load resources” for practice search.</span>
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
                      "Mark complete"
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
