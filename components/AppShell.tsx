"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, LogOut, User } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { api } from "@/lib/api";

type Profile = {
  userId: string;
  name: string;
  email: string;
  points: number;
  streak: number;
};

const NAV = [
  { href: "/roadmap", label: "Roadmap" },
  { href: "/results", label: "Results" },
  { href: "/skill-map", label: "Skill map" },
  { href: "/profile", label: "Profile" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") || localStorage.getItem("learnova_token") : null;
    if (!uid) {
      setProfile(null);
      return;
    }
    (async () => {
      try {
        if (token) {
          await api.me();
        }
        const p = await api.profile(uid);
        setProfile({ userId: uid, name: p.name, email: p.email, points: p.points ?? 0, streak: p.streak ?? 0 });
      } catch {
        setProfile(null);
        if (pathname !== "/") {
          localStorage.removeItem("token");
          localStorage.removeItem("learnova_token");
          localStorage.removeItem("learnova_user_id");
          router.replace("/");
        }
      }
    })();
  }, [pathname, router]);

  useEffect(() => {
    function onUpdate() {
      const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
      if (!uid) return;
      api
        .profile(uid)
        .then((p) => setProfile({ userId: uid, name: p.name, email: p.email, points: p.points ?? 0, streak: p.streak ?? 0 }))
        .catch(() => {});
    }
    window.addEventListener("learnova:profile-updated", onUpdate as EventListener);
    return () => window.removeEventListener("learnova:profile-updated", onUpdate as EventListener);
  }, []);

  const showNav = pathname !== "/";

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("learnova_token");
    localStorage.removeItem("learnova_user_id");
    localStorage.removeItem("learnova_name");
    setProfile(null);
    router.push("/");
  }

  return (
    <>
      <a href="#main-content" className="skipLink">
        Skip to main content
      </a>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(13, 19, 36, 0.95)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            backdropFilter: "blur(10px)",
          },
        }}
      />
      {showNav && (
        <header className="navBar" role="banner">
          <div className="navInner">
            <button type="button" className="navBrand" onClick={() => router.push("/dashboard")} aria-label="Learnova home, go to dashboard">
              Learnova
            </button>
            <nav className="navLinks" aria-label="Primary">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="navLink"
                  aria-current={pathname === item.href ? "page" : undefined}
                >
                  {item.href === "/profile" ? <User size={16} aria-hidden /> : null}
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="navMeta">
              <span className="pill" title="Login streak">
                <Flame size={16} aria-hidden /> {profile?.streak ?? 0}
              </span>
              <span className="pill" title="Total points">
                {profile ? `${profile.points} pts` : "— pts"}
              </span>
              <button type="button" className="navLink" onClick={logout}>
                <LogOut size={16} aria-hidden /> Logout
              </button>
            </div>
          </div>
        </header>
      )}
      <main className={`pageMain${showNav ? " hasNav" : ""}`} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </>
  );
}
