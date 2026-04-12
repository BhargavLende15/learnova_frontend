"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResponsiveHeatMap } from "@nivo/heatmap";
import { api } from "@/lib/api";

type TopicStat = {
  topicId: string;
  topicName: string;
  accuracyPct: number;
  attempts: number;
  masteryLevel: "Weak" | "Moderate" | "Strong" | string;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function SkillMapPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
    setUserId(uid);
    (async () => {
      try {
        const r = await api.getSkillMapData(uid);
        setTopics(r.topics || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load skill map");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const heatmap = useMemo(() => {
    const cols = 10;
    const rows = chunk(topics, cols);
    const xKeys = Array.from({ length: cols }, (_, i) => `c${i + 1}`);
    const data = rows.map((row, rIdx) => {
      const d: any[] = [];
      for (let i = 0; i < cols; i++) {
        const t = row[i];
        d.push({
          x: xKeys[i],
          y: t ? Math.max(0, Math.min(100, Number(t.accuracyPct ?? 0))) : null,
          meta: t ?? null,
        });
      }
      return { id: `row-${rIdx + 1}`, data: d };
    });
    return { data, xKeys };
  }, [topics]);

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="pageTitle">Skill heat map</h1>
        <Link href="/results" className="btn btn-ghost">
          Results
        </Link>
      </header>

      <div className="card stack">
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.55 }}>
          Each tile is a roadmap topic. Color intensity reflects how confidently you have practiced it (cooler = needs attention,
          warmer = stronger).
        </p>

        {loading && <p style={{ color: "var(--muted)", margin: 0 }}>Loading…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <div style={{ height: 420 }}>
            <ResponsiveHeatMap
              data={heatmap.data as any}
              margin={{ top: 16, right: 16, bottom: 16, left: 60 }}
              forceSquare={true}
              axisTop={null}
              axisRight={null}
              axisBottom={null}
              axisLeft={null}
              borderWidth={1}
              borderColor={{ from: "color", modifiers: [["darker", 0.6]] }}
              borderRadius={4}
              colors={{
                type: "diverging",
                scheme: "red_yellow_green",
                divergeAt: 0.5,
                minValue: 0,
                maxValue: 100,
              }}
              emptyColor="rgba(128, 140, 160, 0.14)"
              enableLabels={false}
              tooltip={({ cell }: any) => {
                const meta = cell?.data?.meta as TopicStat | null;
                if (!meta) return null;
                return (
                  <div className="card" style={{ padding: "0.75rem 0.9rem", minWidth: 220 }}>
                    <div style={{ fontWeight: 800 }}>{meta.topicName}</div>
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: 4 }}>
                      Accuracy: <strong style={{ color: "var(--text)" }}>{Math.round(meta.accuracyPct)}%</strong>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                      Attempts: <strong style={{ color: "var(--text)" }}>{meta.attempts}</strong>
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                      Mastery: <strong style={{ color: "var(--text)" }}>{meta.masteryLevel}</strong>
                    </div>
                  </div>
                );
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

