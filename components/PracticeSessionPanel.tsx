"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

import { api } from "@/lib/api";
import { topicResources } from "@/lib/topicResources";


export function PracticeSessionPanel({
  userId,
  topics,
  completedIds,
  unlockedTopicIds,
  onMarkDone,
}: any) {
  const [notes, setNotes] = useState<any>({});
  const [saving, setSaving] = useState<any>({});
  const [resources, setResources] = useState<any>({});
  const [loadingRes, setLoadingRes] = useState<any>({});

  // 🔥 LOCAL STATE FOR INSTANT UNLOCK
  const [localCompleted, setLocalCompleted] = useState(new Set(completedIds));
  useEffect(() => {
  setLocalCompleted(new Set(completedIds));
  }, [completedIds]);


  const visibleTopics = useMemo(
    () => topics.filter((t: any) => t?.id && t?.title),
    [topics]
  );

  useEffect(() => {
    if (!userId) return;

    (async () => {
      const initial: any = {};

      await Promise.all(
        visibleTopics.slice(0, 8).map(async (t: any) => {
          try {
            const r = await api.getNotes(userId, t.id);
            initial[t.id] = r.notes ?? "";
          } catch {
            initial[t.id] = "";
          }
        })
      );

      setNotes((prev: any) => ({ ...initial, ...prev }));
    })();
  }, [userId, visibleTopics]);

  // 🔥 RESOURCE LOADER
  async function ensureResources(title: string) {
  // ✅ TOGGLE: if already loaded → reset
  if (resources[title]) {
    setResources((p: any) => {
      const newRes = { ...p };
      delete newRes[title];
      return newRes;
    });
    return;
  }

  // ✅ LOAD
  setLoadingRes((p: any) => ({ ...p, [title]: true }));

  const local = topicResources[title];

  setResources((p: any) => ({
    ...p,
    [title]: local
      ? {
          youtubeLink: local.youtube,
          articleLink: local.article,
          practiceLink: local.practice,
        }
      : {
          youtubeLink: `https://youtube.com/results?search_query=${title}`,
          articleLink: `https://geeksforgeeks.org/search/?q=${title}`,
          practiceLink: `https://www.hackerrank.com/domains/tutorials/10-days-of-${title
            .toLowerCase()
            .replace(/\s+/g, "-")}`,
        },
  }));

  setLoadingRes((p: any) => ({ ...p, [title]: false }));
}

  async function saveTopicNotes(topicId: string) {
    setSaving((p: any) => ({ ...p, [topicId]: true }));

    try {
      await api.saveNotes({
        userId,
        topicId,
        notes: notes[topicId] ?? "",
      });
    } finally {
      setSaving((p: any) => ({ ...p, [topicId]: false }));
    }
  }

  return (
    <div className="card stack">
      <h2>Practice Session</h2>

      <div className="practiceTableWrap">
        <div className="practiceTable">
          <div className="practiceHeader">
            <div>Topic</div>
            <div>Resources</div>
            <div>Practice</div>
            <div>Notes</div>
            <div>Complete</div>
          </div>

          {visibleTopics.map((t: any, index: number) => {
            const isDone = localCompleted.has(t.id);

            const isUnlocked =
              index === 0 ||
              localCompleted.has(visibleTopics[index - 1]?.id) ||
              unlockedTopicIds.has(t.id) ||
              isDone;

            const locked = !isUnlocked;

            const topicRes = resources[t.title];
            const isLoading = !!loadingRes[t.title];

            return (
              <motion.div
                key={t.id}
                className={`practiceRow ${
                  locked ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {/* Topic */}
                <div className="practiceCell">
                  {locked ? (
                    <Lock size={16} />
                  ) : isDone ? (
                    <CheckCircle2 size={16} />
                  ) : null}
                  <span>{t.title}</span>
                </div>

                {/* Resources */}
                <div className="practiceCell">
                 <button
  className="btn btn-primary"
  disabled={locked || isLoading}
  onClick={() => ensureResources(t.title)}
>
  {isLoading
    ? "Loading..."
    : topicRes
    ? "Hide Resources"
    : "Load Resources"}
</button>
                  {topicRes && (
                    <div style={{ marginTop: 10 }}>
                      <a href={topicRes.youtubeLink} target="_blank" className="link">
                        🎥 YouTube Tutorial
                      </a>
                      <br />
                      <a href={topicRes.articleLink} target="_blank" className="link">
                        📘 GFG Article
                      </a>
                    </div>
                  )}
                </div>

                {/* Practice */}
                <div className="practiceCell">
                  {topicRes?.practiceLink ? (
                    <a
                      href={topicRes.practiceLink}
                      target="_blank"
                      className="btn btn-gradient"
                    >
                     📘 Start Practice on HackerRank
                    </a>
                  ) : (
                    <span>Load resources first</span>
                  )}
                </div>

                {/* Notes */}
                <div className="practiceCell">
                  <textarea
                    disabled={locked}
                    value={notes[t.id] ?? ""}
                    onChange={(e) =>
                      setNotes((p: any) => ({
                        ...p,
                        [t.id]: e.target.value,
                      }))
                    }
                    onBlur={() => !locked && saveTopicNotes(t.id)}
                  />
                </div>

                {/* Complete */}
                <div className="practiceCell">
  <div style={{ display: "flex", gap: "6px" }}>
    {!isDone ? (
      <button
        className="btn btn-primary"
        disabled={locked}
        onClick={async () => {
          await onMarkDone(t.id);
          setLocalCompleted((prev) => new Set(prev).add(t.id));
        }}
      >
        Mark Done
      </button>
    ) : (
      <>
        <button className="btn success" disabled>
          Done ✓
        </button>

        <button
          className="btn btn-ghost"
          onClick={() => {
            setLocalCompleted((prev) => {
              const newSet = new Set(prev);
              newSet.delete(t.id);
              return newSet;
            });
          }}
        >
          Reattempt
        </button>
          </>
        )}
      </div>
    </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}