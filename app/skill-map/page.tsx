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
          <>
            <div style={{ height: 280, width: "100%", marginTop: 8 }}>
              <ResponsiveHeatMap
                data={heatmap.data as any}
                margin={{ top: 20, right: 20, bottom: 20, left: 72 }}
                forceSquare={true}
                axisTop={null}
                axisRight={null}
                axisBottom={null}
                axisLeft={null}
                borderWidth={1}
                borderColor="rgba(128, 140, 160, 0.25)"
                borderRadius={6}
                inactiveOpacity={0.35}
                colors={({ value }: { value: number | null }) => {
                  if (value === null || value === undefined) return "rgba(128, 140, 160, 0.12)";
                  if (value < 40) return "var(--danger)";
                  if (value < 70) return "var(--warn)";
                  return "var(--success)";
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
                    </div>
                  );
                }}
              />
            </div>

            <div className="row" style={{ marginTop: 12, gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ color: "var(--danger)", fontWeight: 600 }}>● Weak</span>
              <span style={{ color: "var(--warn)", fontWeight: 600 }}>● Medium</span>
              <span style={{ color: "var(--success)", fontWeight: 600 }}>● Strong</span>
            </div>

            <div
              className="card-inset"
              style={{ marginTop: 16, padding: 0, overflow: "hidden" }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead style={{ background: "var(--surface-2)" }}>
                  <tr>
                    <th style={{ padding: "0.65rem 1rem", textAlign: "left" }}>Range</th>
                    <th style={{ padding: "0.65rem 1rem", textAlign: "left" }}>Level</th>
                    <th style={{ padding: "0.65rem 1rem", textAlign: "left" }}>Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: "0.65rem 1rem" }}>0–39%</td>
                    <td style={{ color: "var(--danger)", padding: "0.65rem 1rem", fontWeight: 700 }}>Weak</td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--muted)" }}>Needs more practice</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.65rem 1rem" }}>40–69%</td>
                    <td style={{ color: "var(--warn)", padding: "0.65rem 1rem", fontWeight: 700 }}>Medium</td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--muted)" }}>Moderate understanding</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.65rem 1rem" }}>70–100%</td>
                    <td style={{ color: "var(--success)", padding: "0.65rem 1rem", fontWeight: 700 }}>Strong</td>
                    <td style={{ padding: "0.65rem 1rem", color: "var(--muted)" }}>Solid mastery</td>
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