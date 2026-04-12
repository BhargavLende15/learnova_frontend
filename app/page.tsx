"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Map, Sparkles, Target } from "lucide-react";
import { api } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let uid = "";
      if (mode === "register") {
        const r = await api.register({ name, email, password });
        localStorage.setItem("token", r.token);
        localStorage.setItem("learnova_token", r.token);
        localStorage.setItem("learnova_user_id", r.user.id);
        localStorage.setItem("learnova_name", r.user.name);
        uid = r.user.id;
      } else {
        const r = await api.login(email, password);
        localStorage.setItem("token", r.token);
        localStorage.setItem("learnova_token", r.token);
        localStorage.setItem("learnova_user_id", r.user.id);
        localStorage.setItem("learnova_name", r.user.name);
        uid = r.user.id;
      }
      if (uid) {
        try {
          await api.dailyLogin(uid);
          window.dispatchEvent(new Event("learnova:profile-updated"));
        } catch {
          /* ignore */
        }
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

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

      <div className="card stack" style={{ maxWidth: 440 }}>
        <div className="row">
          <button
            type="button"
            className={mode === "login" ? "btn" : "btn btn-ghost"}
            onClick={() => setMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            className={mode === "register" ? "btn" : "btn btn-ghost"}
            onClick={() => setMode("register")}
          >
            Create account
          </button>
        </div>

        <form className="stack" onSubmit={submit}>
          {mode === "register" && (
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Continue" : "Create account & continue"}
          </button>
        </form>

        <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
          Flow: set goal & skills → adaptive check → roadmap with weekly detail → practice with curated resources → track progress.
        </p>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
        <Link href="/dashboard">Go to dashboard</Link> — requires an active session in this browser.
      </p>
    </div>
  );
}
