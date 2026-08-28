"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type UserSession = {
  id: string;
  name: string;
  email: string;
  role: "CLIENT" | "TRAINER" | "ADMIN";
} | null;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserSession>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || null);

          if (data.user) {
            fetchUnread();
          }
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    async function fetchUnread() {
      try {
        const unreadRes = await fetch("/api/messages/unread-count");
        if (unreadRes.ok) {
          const unreadData = await unreadRes.json();
          setUnreadCount(unreadData.unreadCount || 0);
        }
      } catch {
        setUnreadCount(0);
      }
    }

    fetchSession();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      setUnreadCount(0);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#080B0F]/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-2xl font-black text-white">
          <span className="text-[#7CFF3B]">TCB</span>-3
        </Link>

        {/* Dynamic Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {!user ? (
            // PUBLIC NAV
            <>
              <Link
                href="/"
                className={`transition ${
                  isActive("/") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Home
              </Link>
              <Link
                href="/trainers"
                className={`transition ${
                  isActive("/trainers") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Trainers
              </Link>
              <Link
                href="/features"
                className={`transition ${
                  isActive("/features") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Features
              </Link>
              <Link
                href="/pricing"
                className={`transition ${
                  isActive("/pricing") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Pricing
              </Link>
            </>
          ) : user.role === "CLIENT" ? (
            // LOGGED IN CLIENT NAV
            <>
              <Link
                href="/"
                className={`transition ${
                  isActive("/") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Home
              </Link>
              <Link
                href="/trainers"
                className={`transition ${
                  isActive("/trainers") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Trainers
              </Link>
              <Link
                href="/dashboard"
                className={`transition ${
                  isActive("/dashboard") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/workouts"
                className={`transition ${
                  isActive("/workouts") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Workouts
              </Link>
              <Link
                href="/nutrition"
                className={`transition ${
                  isActive("/nutrition") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Nutrition
              </Link>
              <Link
                href="/sessions"
                className={`transition ${
                  isActive("/sessions") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Sessions
              </Link>
              <Link
                href="/messages"
                className={`inline-flex items-center transition ${
                  isActive("/messages") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#7CFF3B] px-1.5 py-0.2 text-[10px] font-black text-black animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          ) : (
            // LOGGED IN TRAINER NAV
            <>
              <Link
                href="/"
                className={`transition ${
                  isActive("/") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Home
              </Link>
              <Link
                href="/trainers"
                className={`transition ${
                  isActive("/trainers") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Trainers
              </Link>
              <Link
                href="/trainer/dashboard"
                className={`transition ${
                  isActive("/trainer/dashboard") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/trainer/programs"
                className={`transition ${
                  isActive("/trainer/programs") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Programs
              </Link>
              <Link
                href="/trainer/sessions"
                className={`transition ${
                  isActive("/trainer/sessions") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Sessions
              </Link>
              <Link
                href="/trainer/packages"
                className={`transition ${
                  isActive("/trainer/packages") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                Packages
              </Link>
              <Link
                href="/messages"
                className={`inline-flex items-center transition ${
                  isActive("/messages") ? "font-bold text-[#7CFF3B]" : "text-gray-300 hover:text-[#7CFF3B]"
                }`}
              >
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#7CFF3B] px-1.5 py-0.2 text-[10px] font-black text-black animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </>
          )}
        </nav>

        {/* Action CTAs */}
        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-300 font-medium">
                {user.name.split(" ")[0]} ({user.role === "TRAINER" ? "Coach" : "Client"})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 transition hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-300 transition hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/get-started"
                className="rounded-xl bg-[#7CFF3B] px-5 py-2.5 text-sm font-bold text-black transition-all duration-300 hover:scale-105 hover:bg-[#68e326] hover:shadow-[0_0_20px_rgba(124,255,59,0.3)]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-xl border border-white/10 p-2 text-gray-300 md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#080B0F] px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4 text-base font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className={isActive("/") ? "font-bold text-[#7CFF3B]" : "text-gray-300"}
            >
              Home
            </Link>
            <Link
              href="/trainers"
              onClick={() => setMobileMenuOpen(false)}
              className={isActive("/trainers") ? "font-bold text-[#7CFF3B]" : "text-gray-300"}
            >
              Trainers
            </Link>
            {!user ? (
              <>
                <Link
                  href="/features"
                  onClick={() => setMobileMenuOpen(false)}
                  className={isActive("/features") ? "font-bold text-[#7CFF3B]" : "text-gray-300"}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className={isActive("/pricing") ? "font-bold text-[#7CFF3B]" : "text-gray-300"}
                >
                  Pricing
                </Link>
                <div className="mt-4 flex flex-col gap-3 pt-4 border-t border-white/10">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl border border-white/10 py-3 text-center text-sm font-bold text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/get-started"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-xl bg-[#7CFF3B] py-3 text-center text-sm font-bold text-black"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  href={user.role === "TRAINER" ? "/trainer/dashboard" : "/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-bold text-[#7CFF3B]"
                >
                  Dashboard
                </Link>
                {user.role === "CLIENT" ? (
                  <>
                    <Link
                      href="/workouts"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-300"
                    >
                      Workouts
                    </Link>
                    <Link
                      href="/nutrition"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-gray-300"
                    >
                      Nutrition
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/trainer/programs"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300"
                  >
                    Programs
                  </Link>
                )}
                <Link
                  href={user.role === "TRAINER" ? "/trainer/sessions" : "/sessions"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-300"
                >
                  Video Sessions
                </Link>
                {user.role === "TRAINER" && (
                  <Link
                    href="/trainer/packages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-300"
                  >
                    Packages
                  </Link>
                )}
                <Link
                  href="/messages"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between text-gray-300"
                >
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#7CFF3B] px-2 py-0.5 text-xs font-black text-black">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 text-left font-bold text-red-400"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}