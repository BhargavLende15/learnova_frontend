"use client";

type Phase = { name: string; timeline_weeks?: number };

type Props = {
  careerGoal?: string;
  phases: Phase[];
  topicsTotal: number;
  topicsCompleted: number;
};

export function RoadmapProgressPanel({ careerGoal, phases, topicsTotal, topicsCompleted }: Props) {
  const pct = topicsTotal > 0 ? Math.round((topicsCompleted / topicsTotal) * 100) : 0;
  const totalWeeks = phases.reduce((s, p) => s + (Number(p.timeline_weeks) || 0), 0);
  const phaseCount = phases.length;

  const size = 160;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  const gap = c - dash;

  return (
    <div className="card stack" style={{ gap: "1.15rem" }}>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 className="pageTitle" style={{ fontSize: "1.2rem", marginBottom: "0.35rem" }}>
            Your roadmap progress
          </h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem", maxWidth: 520 }}>
            Topics you have finished versus your full learning path
            {careerGoal ? (
              <>
                {" "}
                for <strong style={{ color: "var(--text)" }}>{careerGoal}</strong>.
              </>
            ) : (
              "."
            )}
          </p>
        </div>
      </div>

      <div className="roadmapProgressGrid">
        <div className="roadmapRingWrap" aria-hidden>
          <div style={{ position: "relative", width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
              <defs>
                <linearGradient id="roadmapRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent)" />
                  <stop offset="100%" stopColor="var(--accent-2)" />
                </linearGradient>
              </defs>
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(128, 140, 160, 0.22)" strokeWidth={stroke} />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="url(#roadmapRingGrad)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${gap}`}
                style={{ transition: "stroke-dasharray 0.75s ease" }}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <span style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--text)" }}>{pct}%</span>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em" }}>COMPLETE</span>
            </div>
          </div>
        </div>

        <div className="roadmapProgressStats">
          <div className="roadmapStatCard">
            <span className="roadmapStatLabel">Topics done</span>
            <span className="roadmapStatValue">
              {topicsCompleted} / {topicsTotal}
            </span>
          </div>
          <div className="roadmapStatCard">
            <span className="roadmapStatLabel">Learning phases</span>
            <span className="roadmapStatValue">{phaseCount}</span>
          </div>
          <div className="roadmapStatCard">
            <span className="roadmapStatLabel">Est. timeline</span>
            <span className="roadmapStatValue">~{totalWeeks} wk</span>
          </div>
        </div>
      </div>
    </div>
  );
}
