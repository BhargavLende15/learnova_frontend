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
  masteryLevel: "Weak" | "متوسط" | "Strong" | string;
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
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Skill map</h1>
        <div className="row">
          <Link href="/roadmap" className="btn btn-ghost">
            Roadmap
          </Link>
          <Link href="/results" className="btn btn-ghost">
            Results
          </Link>
        </div>
      </header>

      <div className="card stack">
        <p style={{ margin: 0,fontSize: "35px", color: "var(--muted)" }}>
                         Each block is a topic. Color intensity reflects mastery.
        </p>

        {loading && <p style={{ color: "var(--muted)", margin: 0 }}>Loading…</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && (
          <>
            {/* 🔥 HEATMAP */}
            <div style={{ height: 120, width: "100%", marginTop: 10 }}>
              <ResponsiveHeatMap
                data={heatmap.data as any}
                margin={{ top: 16, right: 16, bottom: 16, left: 60 }}
                forceSquare={true}
                axisTop={null}
                axisRight={null}
                axisBottom={null}
                axisLeft={null}
                borderWidth={1}
                borderColor="rgba(255,255,255,0.1)" // ✅ cleaner border
                borderRadius={6}
                activeOpacity={1}
                inactiveOpacity={0.3}

               // ✅ ORANGE PROFESSIONAL THEME
               colors={({ value }: any) => {
                if (value === null) return "rgba(255,255,255,0.04)";

                if (value < 40) return "#ef4444";   // 🔴 Weak
                if (value < 70) return "#facc15";   // 🟡 Medium (REAL YELLOW)
                return "#22c55e";                   // 🟢 Strong
              }}

                emptyColor="rgba(255,255,255,0.04)"
                enableLabels={false}

                
                // ✅ IMPROVED TOOLTIP
                tooltip={({ cell }: any) => {
                  const meta = cell?.data?.meta as TopicStat | null;
                  if (!meta) return null;

                  return (
                    <div
                      style={{
                        background: "rgba(20, 25, 45, 0.95)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10,
                        padding: "10px 12px",
                        minWidth: 200,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                        backdropFilter: "blur(8px)",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>
                        {meta.topicName}
                      </div>

                      <div style={{ fontSize: "0.85rem", marginTop: 6 }}>
                        🎯 Accuracy: <strong>{Math.round(meta.accuracyPct)}%</strong>
                      </div>

                      <div style={{ fontSize: "0.85rem" }}>
                        🔁 Attempts: <strong>{meta.attempts}</strong>
                      </div>

                      <div style={{ fontSize: "0.85rem" }}>
                        📊 Mastery: <strong>{meta.masteryLevel}</strong>
                      </div>
                    </div>
                  );
                }}
              />
            </div>

            {/* ✅ LEGEND (VERY IMPORTANT UX) */}
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <span style={{ color: "#ef4444" }}>● Weak</span>
              <span style={{ color: "#f59e0b" }}>● Medium</span>
              <span style={{ color: "#22c55e" }}>● Strong</span>
            </div>

            {/* ✅ RANGE TABLE */}
<div
  style={{
    marginTop: 20,
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10,
    overflow: "hidden",
  }}
>
  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
    <thead style={{ background: "rgba(255,255,255,0.04)" }}>
      <tr>
        <th style={{ padding: "10px", textAlign: "left" }}>Range</th>
        <th style={{ padding: "10px", textAlign: "left" }}>Level</th>
        <th style={{ padding: "10px", textAlign: "left" }}>Meaning</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style={{ padding: "10px" }}>0–39%</td>
        <td style={{ color: "#ef4444", padding: "10px" }}>Weak</td>
        <td style={{ padding: "10px" }}>Needs improvement</td>
      </tr>
      <tr>
        <td style={{ padding: "10px" }}>40–69%</td>
        <td style={{ color: "#f59e0b", padding: "10px" }}>Medium</td>
        <td style={{ padding: "10px" }}>Moderate understanding</td>
      </tr>
      <tr>
        <td style={{ padding: "10px" }}>70–100%</td>
        <td style={{ color: "#22c55e", padding: "10px" }}>Strong</td>
        <td style={{ padding: "10px" }}>Good mastery</td>
      </tr>
    </tbody>
  </table>
</div>


          </>
        )}
      </div>
    </div>
  );
}