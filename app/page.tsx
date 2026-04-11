"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, FormField, PageHeader, SegmentedControl, Spinner } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const formId = useId();
  const nameId = `${formId}-name`;
  const emailId = `${formId}-email`;
  const passwordId = `${formId}-password`;

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
      <PageHeader title="Learnova" description="Adaptive learning for your goals, skills, and roadmap." />

      <div className="card stack authCard">
        <SegmentedControl
          ariaLabel="Account mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: "login", label: "Login" },
            { value: "register", label: "Register" },
          ]}
        />

        <form className="stack" onSubmit={submit} noValidate>
          {mode === "register" ? (
            <FormField id={nameId} label="Name">
              <input
                id={nameId}
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </FormField>
          ) : null}
          <FormField id={emailId} label="Email">
            <input
              id={emailId}
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </FormField>
          <FormField id={passwordId} label="Password">
            <input
              id={passwordId}
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </FormField>
          {error ? (
            <Alert variant="error" title="Could not continue">
              {error}
            </Alert>
          ) : null}
          <button className="btn" type="submit" disabled={loading} aria-busy={loading}>
            {loading ? (
              <span className="row" style={{ gap: 8 }}>
                <Spinner label="Signing in" />
                Working…
              </span>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p className="pageHeaderDesc" style={{ margin: 0 }}>
          After login: pick a career goal and skills, take the adaptive assessment, then open your roadmap.
        </p>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: 0 }}>
        <Link href="/dashboard">Continue to dashboard</Link> (requires a session in this browser)
      </p>
    </div>
  );
}
