"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Search,
  Users,
  ChevronDown,
  Menu,
  X,
  Sparkles,
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
    pathname.startsWith("/team-selections");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          onClick={closeMenus}
          className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-sm shadow-emerald-500/25 ring-1 ring-emerald-600/20 transition-transform group-hover:scale-105">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-slate-900">
                FPL Monte Carlo
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                Sim
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              Probabilistic Analytics
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
          <Link
            href="/"
            onClick={closeMenus}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                toolsOpen || isToolsActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span>Tools</span>
              <ChevronDown
                className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                  toolsOpen ? "rotate-180 text-slate-900" : ""
                }`}
              />
            </button>

            {/* Dropdown Panel */}
            {toolsOpen && (
              <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl shadow-slate-900/5 backdrop-blur-xl ring-1 ring-slate-900/5 focus:outline-none">
                <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Simulation & Analysis
                </div>
                <div className="space-y-1">
                  <Link
                    href="/player-search"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                      pathname === "/player-search"
                        ? "bg-emerald-50/80 text-emerald-950"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-100">
                      <Search className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Player search
                      </div>
                      <div className="text-xs text-slate-500">
                        Simulate points distributions & upcoming fixtures
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/team-selections"
                    onClick={closeMenus}
                    className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${
                      pathname === "/team-selections"
                        ? "bg-teal-50/80 text-teal-950"
                        : "hover:bg-slate-50 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100/70 text-teal-700 group-hover:bg-teal-100">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Team selections
                      </div>
                      <div className="text-xs text-slate-500">
                        Optimize starting squad, bench order & budget
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
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              pathname === "/about"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            About
          </Link>
        </nav>

        {/* Right Action / CTA */}
        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/player-search"
            onClick={closeMenus}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-slate-800 hover:shadow"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>Run Simulation</span>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none"
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
              className={`block rounded-lg px-3 py-2 text-base font-medium ${
                pathname === "/"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              Home
            </Link>

            <div className="pt-2">
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tools
              </div>
              <div className="mt-1 space-y-1 pl-2">
                <Link
                  href="/player-search"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === "/player-search"
                      ? "bg-emerald-50 text-emerald-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Search className="h-4 w-4 text-emerald-600" />
                  <span>Player search</span>
                </Link>

                <Link
                  href="/team-selections"
                  onClick={closeMenus}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                    pathname === "/team-selections"
                      ? "bg-teal-50 text-teal-900"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Users className="h-4 w-4 text-teal-600" />
                  <span>Team selections</span>
                </Link>
              </div>
            </div>

            <Link
              href="/about"
              onClick={closeMenus}
              className={`block rounded-lg px-3 py-2 text-base font-medium ${
                pathname === "/about"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              About
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/70">
            <Link
              href="/player-search"
              onClick={closeMenus}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Run Simulation</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
