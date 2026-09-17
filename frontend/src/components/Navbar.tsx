"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Search,
  Users,
  ArrowRightLeft,
  Percent,
  Calendar,
  Shield,
  Wallet,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close menus when clicking any link
  const closeMenus = () => {
    setToolsOpen(false);
    setMobileMenuOpen(false);
  };

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setToolsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setToolsOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const isToolsActive =
    pathname.startsWith("/player-search") ||
    pathname.startsWith("/team-selections") ||
    pathname.startsWith("/transfer-recommendations") ||
    pathname.startsWith("/budget-optimizer") ||
    pathname.startsWith("/match-odds") ||
    pathname.startsWith("/fixture-ticker") ||
    pathname.startsWith("/fixture-xgc-ticker");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenus}
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-95"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#FE5803] to-[#FF8C44] shadow-sm shadow-orange-500/25 ring-1 ring-orange-600/20 transition-transform group-hover:scale-105">
            <Flame className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-[#FE5803] transition-colors">
                FPL Hauls
              </span>
            </div>
          </div>
        </Link>

        {/* Desktop Navigation (Centered) */}
        <nav
          className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1"
          aria-label="Main Navigation"
        >
          <Link
            href="/"
            onClick={closeMenus}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${pathname === "/"
              ? "bg-orange-50 text-[#FE5803] font-semibold"
              : "text-slate-600 hover:bg-orange-50/50 hover:text-[#FE5803]"
              }`}
          >
            Home
          </Link>

          {/* Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setToolsOpen((prev) => !prev)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${toolsOpen || isToolsActive
                ? "bg-orange-50 text-[#FE5803] font-semibold"
                : "text-slate-600 hover:bg-orange-50/50 hover:text-[#FE5803]"
                }`}
            >
              <span>Tools</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${toolsOpen || isToolsActive
                  ? "rotate-180 text-[#FE5803]"
                  : "text-slate-500 group-hover:text-[#FE5803]"
                  }`}
              />
            </button>

            {/* Dropdown Panel */}
            {toolsOpen && (
              <div className="absolute left-0 mt-2 w-80 origin-top-left rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl shadow-slate-900/5 backdrop-blur-xl ring-1 ring-slate-900/5 focus:outline-none">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Data Science & Prediction Tools
                </div>
                <div className="space-y-1">
                  <Link
                    href="/player-search"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/player-search"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-[#FE5803] group-hover:bg-orange-100">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Player search
                      </div>
                      <div className="text-xs text-slate-500">
                        Prediction models, points distributions & fixtures
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/team-selections"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/team-selections"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100/80 text-amber-700 group-hover:bg-amber-100">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Team selections
                      </div>
                      <div className="text-xs text-slate-500">
                        Optimize starting squad, bench order & budget
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/transfer-recommendations"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/transfer-recommendations"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-[#FE5803] group-hover:bg-orange-100">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Transfer recommendations
                      </div>
                      <div className="text-xs text-slate-500">
                        Points, template protection & haul potential
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/budget-optimizer"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/budget-optimizer"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100/80 text-[#FE5803] group-hover:bg-orange-100">
                      <Wallet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Budget squad optimizer
                      </div>
                      <div className="text-xs text-slate-500">
                        Solve optimal squads for any team value (&lt;£100m)
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/match-odds"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/match-odds"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-700 group-hover:bg-blue-100">
                      <Percent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Match projections
                      </div>
                      <div className="text-xs text-slate-500">
                        Win probabilities, projected xG & top scorelines
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/fixture-ticker"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/fixture-ticker"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100/70 text-purple-700 group-hover:bg-purple-100">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Fixture xG ticker
                      </div>
                      <div className="text-xs text-slate-500">
                        Target attack runs & gameweek expected goals
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/fixture-xgc-ticker"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${pathname === "/fixture-xgc-ticker"
                      ? "bg-orange-50 text-orange-950 font-medium"
                      : "hover:bg-orange-50/50 text-slate-700 hover:text-[#FE5803]"
                      }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100/70 text-teal-700 group-hover:bg-teal-100">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900 group-hover:text-[#FE5803] transition-colors">
                        Fixture xGC ticker
                      </div>
                      <div className="text-xs text-slate-500">
                        Target clean sheet runs & defensive goals against
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/about"
            onClick={closeMenus}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${pathname === "/about"
              ? "bg-orange-50 text-[#FE5803] font-semibold"
              : "text-slate-600 hover:bg-orange-50/50 hover:text-[#FE5803]"
              }`}
          >
            About
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-orange-50 hover:text-[#FE5803] focus:outline-none"
            aria-label="Toggle main menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200/80 bg-white/95 px-4 pt-2 pb-6 backdrop-blur-xl md:hidden">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={closeMenus}
              className={`block rounded-lg px-3 py-2 text-base font-medium ${pathname === "/"
                ? "bg-orange-50 text-[#FE5803] font-semibold"
                : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                }`}
            >
              Home
            </Link>

            <div className="pt-2">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Data Science Tools
              </div>
              <div className="mt-1 space-y-1 pl-2">
                <Link
                  href="/player-search"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/player-search"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Search className="h-4 w-4 text-[#FE5803]" />
                  <span>Player search</span>
                </Link>

                <Link
                  href="/team-selections"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/team-selections"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Users className="h-4 w-4 text-[#FE5803]" />
                  <span>Team selections</span>
                </Link>

                <Link
                  href="/transfer-recommendations"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/transfer-recommendations"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <ArrowRightLeft className="h-4 w-4 text-[#FE5803]" />
                  <span>Transfer recommendations</span>
                </Link>

                <Link
                  href="/budget-optimizer"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/budget-optimizer"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Wallet className="h-4 w-4 text-[#FE5803]" />
                  <span>Budget squad optimizer</span>
                </Link>

                <Link
                  href="/match-odds"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/match-odds"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Percent className="h-4 w-4 text-[#FE5803]" />
                  <span>Match projections</span>
                </Link>

                <Link
                  href="/fixture-ticker"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/fixture-ticker"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Calendar className="h-4 w-4 text-[#FE5803]" />
                  <span>Fixture xG ticker</span>
                </Link>

                <Link
                  href="/fixture-xgc-ticker"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${pathname === "/fixture-xgc-ticker"
                    ? "bg-orange-50 text-[#FE5803] font-semibold"
                    : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                    }`}
                >
                  <Shield className="h-4 w-4 text-[#FE5803]" />
                  <span>Fixture xGC ticker</span>
                </Link>
              </div>
            </div>

            <Link
              href="/about"
              onClick={closeMenus}
              className={`block rounded-lg px-3 py-2 text-base font-medium ${pathname === "/about"
                ? "bg-orange-50 text-[#FE5803] font-semibold"
                : "text-slate-700 hover:bg-orange-50/50 hover:text-[#FE5803]"
                }`}
            >
              About
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
