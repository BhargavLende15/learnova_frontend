"use client";

import Link from "next/link";
import { BookOpen, Map, Sparkles, Target } from "lucide-react";

export default function HomePage() {
  return (
    <div className="container stack" style={{ paddingTop: "1rem", paddingBottom: "2.5rem" }}>
      <section className="stack" style={{ gap: "1.5rem" }}>
        <header className="stack" style={{ gap: "0.75rem", maxWidth: 720 }}>
          <h1 className="pageTitle" style={{ fontSize: "clamp(1.85rem, 4vw, 2.35rem)", lineHeight: 1.15 }}>
            Learn smarter with a roadmap built around you
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "1.05rem", lineHeight: 1.6, fontWeight: 500 }}>
            Learnova turns your career goal and skills into an adaptive assessment, a phased learning plan with weekly milestones,
            guided practice, and an in-app coach — so you always know what to do next.
          </p>
          <div className="row" style={{ flexWrap: "wrap", gap: "0.75rem", marginTop: "0.25rem" }}>
            <Link href="/login" className="btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              Sign in / Get started
            </Link>
          </div>
        </header>

        <div
          className="row"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1rem",
            width: "100%",
          }}
        >
          <div className="card stack" style={{ padding: "1.1rem 1.2rem" }}>
            <Target size={22} color="var(--accent)" aria-hidden />
            <strong style={{ fontSize: "0.95rem" }}>Personalized path</strong>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Pick a role-aligned goal and skills — we assess where you are and sequence what matters.
            </p>
          </div>
          <div className="card stack" style={{ padding: "1.1rem 1.2rem" }}>
            <Sparkles size={22} color="var(--accent)" aria-hidden />
            <strong style={{ fontSize: "0.95rem" }}>Fresh assessment items</strong>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Questions are generated per session with realistic distractors — not recycled trivia.
            </p>
          </div>
          <div className="card stack" style={{ padding: "1.1rem 1.2rem" }}>
            <Map size={22} color="var(--accent)" aria-hidden />
            <strong style={{ fontSize: "0.95rem" }}>Roadmap you can execute</strong>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Weeks include topics, practice, mini-projects, revision, and milestones you can actually ship.
            </p>
          </div>
          <div className="card stack" style={{ padding: "1.1rem 1.2rem" }}>
            <BookOpen size={22} color="var(--accent)" aria-hidden />
            <strong style={{ fontSize: "0.95rem" }}>Coach on demand</strong>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>
              After sign-in, open Learnova Coach anytime for career context, motivation, and concept help.
            </p>
          </div>
        </div>
      </section>

      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
        <Link href="/dashboard">Go to dashboard</Link> — requires an active session in this browser.
      </p>
    </div>
  );
}
