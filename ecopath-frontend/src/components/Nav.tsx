"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type Palette = {
  bg: string;
  border: string;
  brandClass: string;
  linkClass: string;
  hoverClass: string;
  activeClass: string;
};

const routeColors: Record<string, Palette> = {
  "/": {
    // Restore original grey-blue style for home
    bg: "rgb(36, 73, 89)",
    border: "rgba(71,85,105,0.3)",
    brandClass: "text-blue-300",
    linkClass: "text-slate-200",
    hoverClass: "hover:text-blue-300",
    activeClass: "text-white",
  },
  "/quiz": {
    // Keep same style as home for consistency
    bg: "rgba(255,255,255,0.9)",
    border: "rgba(251,146,60,0.5)",
    brandClass: "text-orange-700",
    linkClass: "text-slate-700",
    hoverClass: "hover:text-orange-600",
    activeClass: "text-orange-600",
  },
  "/pledge": {
    bg: "rgb(20, 78, 74)",
    border: "rgba(45,106,79,0.35)",
    brandClass: "text-emerald-200",
    linkClass: "text-emerald-100",
    hoverClass: "hover:text-emerald-300",
    activeClass: "text-white",
  },
  "/info": {
    bg: "rgb(54, 65, 82)",
    border: "rgba(71,85,105,0.35)",
    brandClass: "text-blue-300",
    linkClass: "text-slate-200",
    hoverClass: "hover:text-blue-300",
    activeClass: "text-white",
  },
  "/visualize": {
    bg: "rgb(88, 28, 135)",
    border: "rgba(147,51,234,0.35)",
    brandClass: "text-purple-200",
    linkClass: "text-purple-100",
    hoverClass: "hover:text-white",
    activeClass: "text-white",
  },
};

export default function Nav() {
  const pathname = usePathname() || "/";
  const palette = routeColors[pathname] || routeColors["/"];
  const [hasPledges, setHasPledges] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user has pledges
    if (typeof window !== "undefined") {
      const userId = localStorage.getItem("leafforward_uid");
      if (userId && userId !== "anonymous") {
        // Check localStorage for saved pledges or fetch from API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
        fetch(`${apiUrl}/api/pledges/user?userId=${userId}`, {
          headers: { "x-user-id": userId },
        })
          .then((res) => res.json())
          .then((data) => {
            const pledges = data?.data || [];
            setHasPledges(pledges.length > 0);
          })
          .catch(() => {
            // Fallback: check if user has completed quiz (indicator they might have pledges)
            const carbonFootprint = localStorage.getItem("carbonFootprint");
            setHasPledges(!!carbonFootprint);
          });
      }
    }
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const linkBase = `transition-colors ${palette.linkClass} ${palette.hoverClass}`;
  const isActive = (href: string) => (pathname === href ? palette.activeClass : undefined);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-40 border-b h-16"
        style={{ backgroundColor: palette.bg, borderColor: palette.border }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16">
          <div className="h-full flex items-center justify-between">
            <Link
              href="/"
              className={`font-['Pacifico'] text-2xl sm:text-3xl ${palette.brandClass}`}
            >
              LeafForward
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className={`${linkBase} ${isActive("/")}`}>
                Home
              </Link>
              <Link href="/quiz" className={`${linkBase} ${isActive("/quiz")}`}>
                Explore My Impact
              </Link>
              <Link href="/pledge" className={`${linkBase} ${isActive("/pledge")}`}>
                My Pledge
              </Link>
              {hasPledges && (
                <Link href="/visualize" className={`${linkBase} ${isActive("/visualize")}`}>
                  Visualize Impact
                </Link>
              )}
              <Link href="/info" className={`${linkBase} ${isActive("/info")}`}>
                Info
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className={`md:hidden ${palette.linkClass} p-2`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {mobileMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{ backgroundColor: palette.bg, borderColor: palette.border }}
          >
            <div className="px-4 py-3 space-y-3">
              <Link href="/" className={`block py-2 ${linkBase} ${isActive("/")}`}>
                Home
              </Link>
              <Link href="/quiz" className={`block py-2 ${linkBase} ${isActive("/quiz")}`}>
                Explore My Impact
              </Link>
              <Link href="/pledge" className={`block py-2 ${linkBase} ${isActive("/pledge")}`}>
                My Pledge
              </Link>
              {hasPledges && (
                <Link
                  href="/visualize"
                  className={`block py-2 ${linkBase} ${isActive("/visualize")}`}
                >
                  Visualize Impact
                </Link>
              )}
              <Link href="/info" className={`block py-2 ${linkBase} ${isActive("/info")}`}>
                Info
              </Link>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
