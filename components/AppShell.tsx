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

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
    const token = typeof window !== "undefined" ? (localStorage.getItem("token") || localStorage.getItem("learnova_token")) : null;
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
  }, [pathname]);

  useEffect(() => {
    function onUpdate() {
      const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
      if (!uid) return;
      api.profile(uid).then((p) => setProfile({ userId: uid, name: p.name, email: p.email, points: p.points ?? 0, streak: p.streak ?? 0 })).catch(() => {});
    }
    window.addEventListener("learnova:profile-updated", onUpdate as any);
    return () => window.removeEventListener("learnova:profile-updated", onUpdate as any);
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
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15, 20, 35, 0.9)",
            color: "var(--text)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            backdropFilter: "blur(10px)",
          },
        }}
      />
      {showNav && (
        <div className="navBar">
          <div className="navInner">
            <button type="button" className="navBrand" onClick={() => router.push("/dashboard")}>
              Learnova
            </button>
            <div className="row" style={{ gap: 10 }}>
              <Link href="/roadmap" className="navLink">
                Roadmap
              </Link>
              <Link href="/results" className="navLink">
                Results
              </Link>
              <Link href="/skill-map" className="navLink">
                Skill map
              </Link>
              <Link href="/profile" className="navLink">
                <User size={16} /> Profile
              </Link>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <span className="pill">
                <Flame size={16} /> {profile?.streak ?? 0}
              </span>
              <span className="pill">{profile ? `${profile.points} pts` : "— pts"}</span>
              <button type="button" className="navLink" onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ paddingTop: showNav ? 72 : 0 }}>{children}</div>
    </>
  );
}

