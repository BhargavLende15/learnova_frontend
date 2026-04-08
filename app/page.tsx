"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container stack">
      <header className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Learnova</h1>
        <span style={{ color: "var(--muted)" }}>Adaptive learning</span>
      </header>

      <div className="card stack" style={{ maxWidth: 420 }}>
        <div className="row">
          <button
            type="button"
            className={mode === "login" ? "btn" : "btn btn-ghost"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "btn" : "btn btn-ghost"}
            onClick={() => setMode("register")}
          >
            Register
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
            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: 0 }}>
          After login: choose a career goal and skills, take the adaptive assessment, then open your
          roadmap.
        </p>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
        <Link href="/dashboard">Continue to dashboard</Link> (requires session in this browser)
      </p>
    </div>
  );
}
