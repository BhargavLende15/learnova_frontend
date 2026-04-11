"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

type RowProps = {
  t: TopicRow;
  locked: boolean;
  isDone: boolean;
  topicRes?: { youtubeLink: string; gfgLink: string };
  isLoadingRes: boolean;
  errMsg?: string;
  onLoadLinks: (title: string) => void;
  onMarkDone: (id: string) => void;
};

const PracticeTopicRow = memo(function PracticeTopicRow({
  t,
  locked,
  isDone,
  topicRes,
  isLoadingRes,
  errMsg,
  onLoadLinks,
  onMarkDone,
}: RowProps) {
  const titleKey = t.title;

  return (
    <motion.div
      className={`practiceRow${locked ? " isLocked" : ""}`}
      initial={false}
      animate={{ opacity: locked ? 0.55 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="practiceCell">
        <div className="row" style={{ gap: "0.5rem", flexWrap: "nowrap", alignItems: "flex-start" }}>
          {locked ? <Lock size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} /> : isDone ? <CheckCircle2 size={16} aria-hidden style={{ flexShrink: 0, marginTop: 2 }} /> : null}
          <div style={{ minWidth: 0 }}>
            <div className="truncate" title={t.title}>
              {t.title}
            </div>
            {t.suggested_skip ? (
              <div style={{ color: "var(--warn)", fontSize: "0.8rem", marginTop: 2 }}>Optional skip</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="practiceCell">
        <div className="stack" style={{ gap: "0.4rem" }}>
          <button
            type="button"
            className="linkPill"
            disabled={locked || isLoadingRes}
            onClick={() => onLoadLinks(titleKey)}
          >
            {isLoadingRes ? "Loading…" : "Load links"}
          </button>
          {errMsg ? (
            <span style={{ color: "var(--danger)", fontSize: "0.85rem" }} role="alert">
              {errMsg}
            </span>
          ) : null}
          {topicRes?.youtubeLink ? (
            <a href={topicRes.youtubeLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <PlayCircle size={18} aria-hidden /> Watch video <ExternalLink size={16} aria-hidden />
            </a>
          ) : (
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Use “Load links” to fetch resources.</span>
          )}
        </div>
      </div>

      <div className="practiceCell">
        <div className="stack" style={{ gap: "0.35rem" }}>
          {topicRes?.gfgLink ? (
            <a href={topicRes.gfgLink} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              Practice on GFG <ExternalLink size={16} aria-hidden />
            </a>
          ) : (
            <span style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Use “Load links” to fetch resources.</span>
          )}
        </div>
      </div>

      <div className="practiceCell practiceCellActions">
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
                <CheckCircle2 size={18} aria-hidden /> Done
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
});

export function PracticeSessionPanel({ topics, completedIds, unlockedTopicIds, onMarkDone }: Props) {
  const [resources, setResources] = useState<Record<string, { youtubeLink: string; gfgLink: string }>>({});
  const [loadingRes, setLoadingRes] = useState<Record<string, boolean>>({});
  const [resError, setResError] = useState<Record<string, string>>({});

  const visibleTopics = useMemo(() => topics.filter((t) => t?.id && t?.title), [topics]);

  const ensureResources = useCallback(
    async (topicTitle: string) => {
      if (resources[topicTitle]) return;
      setLoadingRes((p) => ({ ...p, [topicTitle]: true }));
      setResError((p) => ({ ...p, [topicTitle]: "" }));
      try {
        const r = await api.getDirectResources(topicTitle);
        setResources((p) => ({ ...p, [topicTitle]: { youtubeLink: r.youtubeLink, gfgLink: r.gfgLink } }));
      } catch (e) {
        setResError((p) => ({
          ...p,
          [topicTitle]: e instanceof Error ? e.message : "Failed to fetch resources",
        }));
      } finally {
        setLoadingRes((p) => ({ ...p, [topicTitle]: false }));
      }
    },
    [resources]
  );

  const handleMarkDone = useCallback(
    (id: string) => {
      void onMarkDone(id);
    },
    [onMarkDone]
  );

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <h2 className="sectionTitle">Practice session</h2>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
            Work through topics in order. Completing a topic unlocks the next one.
          </p>
        </div>
      </div>

      <div className="practiceTableWrap" aria-label="Practice topics table">
        <div className="practiceTable">
          <div className="practiceHeader">
            <div>Topic</div>
            <div>Resources</div>
            <div>Practice</div>
            <div className="practiceHeaderActions">Complete</div>
          </div>

          {visibleTopics.map((t) => {
            const isDone = completedIds.has(t.id);
            const isUnlocked = unlockedTopicIds.has(t.id) || isDone;
            const locked = !isUnlocked;
            const titleKey = t.title;

            return (
              <PracticeTopicRow
                key={t.id}
                t={t}
                locked={locked}
                isDone={isDone}
                topicRes={resources[titleKey]}
                isLoadingRes={!!loadingRes[titleKey]}
                errMsg={resError[titleKey]}
                onLoadLinks={ensureResources}
                onMarkDone={handleMarkDone}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
