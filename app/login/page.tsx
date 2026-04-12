"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("learnova_token")
        : null;
    if (uid && token) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let uid = "";
      if (mode === "register") {
        const r = await api.register({ name, email, password });
        const token = r.token;
        const id = r.user?.id;
        const displayName = r.user?.name ?? name;
        if (!token || !id) throw new Error("Invalid server response");
        localStorage.setItem("token", token);
        localStorage.setItem("learnova_token", token);
        localStorage.setItem("learnova_user_id", id);
        localStorage.setItem("learnova_name", displayName);
        uid = id;
      } else {
        const r = await api.login(email, password);
        const token = r.token;
        const id = r.user?.id;
        const displayName = r.user?.name ?? "";
        if (!token || !id) throw new Error("Invalid server response");
        localStorage.setItem("token", token);
        localStorage.setItem("learnova_token", token);
        localStorage.setItem("learnova_user_id", id);
        if (displayName) localStorage.setItem("learnova_name", displayName);
        uid = id;
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
    <div className="container stack" style={{ paddingTop: "1rem", paddingBottom: "2.5rem", maxWidth: 480 }}>
      <p style={{ margin: 0 }}>
        <Link href="/" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
          ← Back to home
        </Link>
      </p>

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
    </div>
  );
}
