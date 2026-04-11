"use client";

import { useMemo } from "react";
import { ResponsiveHeatMap } from "@nivo/heatmap";

export type TopicStat = {
  topicId: string;
  topicName: string;
  accuracyPct: number;
  attempts: number;
  masteryLevel: "Weak" | "متوسط" | "Strong" | string;
};

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function SkillMapChart({ topics }: { topics: TopicStat[] }) {
  const heatmap = useMemo(() => {
    const cols = 10;
    const rows = chunk(topics, cols);
    const xKeys = Array.from({ length: cols }, (_, i) => `c${i + 1}`);
    const data = rows.map((row, rIdx) => {
      const d: { x: string; y: number | null; meta: TopicStat | null }[] = [];
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
    <div className="skillMapChart">
      <ResponsiveHeatMap
        data={heatmap.data as never}
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
        emptyColor="rgba(255,255,255,0.04)"
        enableLabels={false}
        tooltip={(d: any) => {
          const meta = (d.cell?.data?.meta ?? null) as TopicStat | null;
          if (!meta) return null;
          return (
            <div className="card skillMapTooltip">
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
  );
}
