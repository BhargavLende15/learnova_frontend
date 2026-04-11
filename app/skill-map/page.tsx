"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, EmptyState, LoadingState, PageHeader } from "@/components/ui";
import type { TopicStat } from "@/components/SkillMapChart";

const SkillMapChart = dynamic(() => import("@/components/SkillMapChart"), {
  ssr: false,
  loading: () => (
    <div
      className="skillMapChart skeletonLine"
      style={{ borderRadius: "var(--radius-md)", minHeight: 280 }}
      aria-hidden
    />
  ),
});

export default function SkillMapPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = localStorage.getItem("learnova_user_id");
    if (!uid) {
      router.replace("/");
      return;
    }
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

  return (
    <div className="container stack">
      <PageHeader title="Skill map" description="Topic mastery as a heatmap — darker green means stronger performance.">
        <Link href="/roadmap" className="btn btn-ghost">
          Roadmap
        </Link>
        <Link href="/results" className="btn btn-ghost">
          Results
        </Link>
      </PageHeader>

      <div className="card stack">
        {loading ? <LoadingState message="Loading skill map…" /> : null}

        {!loading && error ? (
          <Alert variant="error" title="Could not load map">
            {error}
          </Alert>
        ) : null}

        {!loading && !error && topics.length === 0 ? (
          <EmptyState
            title="No topic data yet"
            description="Practice topics on your roadmap to build accuracy stats for this view."
            action={
              <Link href="/roadmap" className="btn">
                Open roadmap
              </Link>
            }
          />
        ) : null}

        {!loading && !error && topics.length > 0 ? <SkillMapChart topics={topics} /> : null}
      </div>
    </div>
  );
}
