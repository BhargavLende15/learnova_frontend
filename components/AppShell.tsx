"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Flame, HomeIcon, LogOut, User } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { api } from "@/lib/api";
import RoadmapPage from "@/app/roadmap/page";
import ResultsPage from "@/app/results/page";
import { Award, Flame, Layers, LayoutDashboard, ListChecks, LogOut, Map, User } from "lucide-react";
import { Toaster } from "react-hot-toast";

import { api } from "@/lib/api";
import { ThemeToggle, applyTheme } from "@/components/ThemeToggle";

type Profile = {
  userId: string;
  name: string;
  email: string;
  points: number;
  streak: number;
};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assessment", label: "Assessment", icon: ListChecks },
  { href: "/roadmap", label: "Roadmap", icon: Map },
  { href: "/results", label: "Results", icon: Award },
  { href: "/skill-map", label: "Skill map", icon: Layers },
  { href: "/profile", label: "Profile", icon: User },
] as const;

function segmentLabel(pathname: string) {
  if (pathname === "/" || pathname === "") return "Home";
  const seg = pathname.replace(/^\//, "").split("/")[0];
  if (!seg) return "Home";
  return seg
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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
  useEffect(() => {
    try {
      const t = localStorage.getItem("learnova_theme");
      applyTheme(t === "dark" ? "dark" : "light");
    } catch {
      applyTheme("light");
    }
  }, []);

  useEffect(() => {
    const uid = typeof window !== "undefined" ? localStorage.getItem("learnova_user_id") : null;
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || localStorage.getItem("learnova_token")
        : null;
    if (!uid) {
      setProfile(null);
      localStorage.clear();
      router.replace("/");
    }
  })();
}, [pathname]); // ✅ NEVER CHANGE THIS AGAIN
    (async () => {
      try {
        if (token) {
          await api.me();
        }
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
        if (pathname !== "/") {
          localStorage.removeItem("token");
          localStorage.removeItem("learnova_token");
          localStorage.removeItem("learnova_user_id");
          router.replace("/");
        }
      }
    })();
  }, [pathname, router]);

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
    window.addEventListener("learnova:profile-updated", onUpdate as EventListener);
    return () => window.removeEventListener("learnova:profile-updated", onUpdate as EventListener);
  }, []);

  const showAppChrome = pathname !== "/";
  const crumb = useMemo(() => segmentLabel(pathname || ""), [pathname]);

  const initials = useMemo(() => {
    const n = profile?.name ?? "";
    const parts = n.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase();
    return "LN";
  }, [profile?.name]);

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
            background: "var(--surface)",
            color: "var(--text)",
            border: "none",
            borderRadius: 18,
            boxShadow: "var(--shadow-1), var(--shadow-2)",
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
      {showAppChrome ? (
        <div className="appRoot">
          <div className="appBody">
            <aside className="appSidebar" aria-label="Main navigation">
              <button
                type="button"
                className="sidebarLink"
                style={{ marginBottom: "0.25rem" }}
                onClick={() => router.push("/dashboard")}
                title="Learnova home"
                aria-label="Learnova home"
              >
                <span style={{ fontWeight: 900, fontSize: "0.85rem" }}>L</span>
              </button>
              <nav className="sidebarNav">
                {navItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className="sidebarLink"
                    aria-current={pathname === href ? "page" : undefined}
                    title={label}
                    aria-label={label}
                  >
                    <Icon size={22} strokeWidth={2} />
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="appMainCol">
              <header className="topBar">
                <div className="row" style={{ gap: "1rem" }}>
                  <button type="button" className="topBarBrand" onClick={() => router.push("/dashboard")}>
                    Learnova
                  </button>
                  <span className="breadcrumb">{crumb}</span>
                </div>
                <div className="topBarRight">
                  <span className="pill">
                    <Flame size={16} /> {profile?.streak ?? 0}
                  </span>
                  <span className="pill">{profile ? `${profile.points} pts` : "— pts"}</span>
                  <div className="userChip">
                    <span className="userAvatar" aria-hidden>
                      {initials}
                    </span>
                    <span>{profile?.name ?? "Guest"}</span>
                  </div>
                  <ThemeToggle />
                  <button type="button" className="navLink" onClick={logout} title="Log out">
                    <LogOut size={16} /> <span className="hideMobile">Logout</span>
                  </button>
                </div>
              </header>
              <main className="mainScroll">{children}</main>
            </div>
          </div>
        </div>
      ) : (
        <div className="landingWrap">
          <header className="landingTop">
            <span className="topBarBrand" style={{ cursor: "default" }}>
              Learnova
            </span>
            <ThemeToggle />
          </header>
          <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
        </div>
      )}

      {/* PAGE CONTENT */}
      <div style={{ paddingTop: showNav ? 72 : 0 }}>
        {children}
      </div>
    </>
  );
}
    </>
  );
}
