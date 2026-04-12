"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, HomeIcon, LogOut, User } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { api } from "@/lib/api";
import RoadmapPage from "@/app/roadmap/page";
import ResultsPage from "@/app/results/page";

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

  // ✅ AUTH + PROFILE LOAD (FIXED TOKEN HANDLING)
 useEffect(() => {
  const uid = localStorage.getItem("learnova_user_id");
  const token = localStorage.getItem("learnova_token");

  if (!uid) {
    setProfile(null);
    return;
  }

  (async () => {
    try {
      if (token) await api.me();

      const p = await api.profile(uid);

      setProfile({
        userId: uid,
        name: p.name,
        email: p.email,
        points: p.points ?? 0,
        streak: p.streak ?? 0,
      });
    } catch {
      setProfile(null);
      localStorage.clear();
      router.replace("/");
    }
  })();
}, [pathname]); // ✅ NEVER CHANGE THIS AGAIN

  // ✅ REAL-TIME PROFILE UPDATE LISTENER
  useEffect(() => {
    function onUpdate() {
      const uid =
        typeof window !== "undefined"
          ? localStorage.getItem("learnova_user_id")
          : null;

      if (!uid) return;

      api
        .profile(uid)
        .then((p) =>
          setProfile({
            userId: uid,
            name: p.name,
            email: p.email,
            points: p.points ?? 0,
            streak: p.streak ?? 0,
          })
        )
        .catch(() => {});
    }

    window.addEventListener("learnova:profile-updated", onUpdate as any);

    return () =>
      window.removeEventListener(
        "learnova:profile-updated",
        onUpdate as any
      );
  }, []);

  const showNav = pathname !== "/";

  // ✅ CLEAN LOGOUT
  function logout() {
    localStorage.removeItem("learnova_token");
    localStorage.removeItem("learnova_user_id");
    localStorage.removeItem("learnova_name");

    setProfile(null);
    router.push("/");
  }

  return (
    <>
      {/* ✅ TOASTER */}
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

      {/* ✅ NAVBAR */}
      {showNav && (
        <div className="navBar">
          <div className="navInner">
            {/* Brand */}
            <button
              type="button"
              className="navBrand"
              style={{ cursor: "pointer", letterSpacing: "0.5px" }}
              onClick={() => router.push("/dashboard")}
            >
              Learnova
            </button>

            {/* Navigation Links */}
            <div className="flexRow" style={{ gap: 10 }}>
               <Link href="/dashboard" className="navLink">
               <HomeIcon size={16} />  Home
              </Link>
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

            {/* User Stats */}
            <div className="flexRow" style={{ gap: 10 }}>
              <span className="pill">
                <Flame size={16} /> {profile?.streak ?? 0}
              </span>

              <span className="pill">
                {profile ? `${profile.points} pts` : "— pts"}
              </span>

              <button
                type="button"
                className="navLink"
                onClick={logout}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={{ paddingTop: showNav ? 72 : 0 }}>
        {children}
      </div>
    </>
  );
}