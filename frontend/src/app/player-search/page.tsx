import Link from "next/link";
import { Search, Sparkles, Filter, ArrowLeft, BarChart2 } from "lucide-react";

export const metadata = {
  title: "Player Search | FPL Monte Carlo",
  description: "Search Fantasy Premier League players and run Monte Carlo simulations on fixture outcomes.",
};

export default function PlayerSearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200/80 pb-8 sm:flex-row sm:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <Sparkles className="h-3 w-3" />
            <span>Simulation Tool</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Player Search
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Analyze individual player expected distributions, bonus potential, and fixture variance.
          </p>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search player name, club, or position (e.g. Saka, Haaland, Palmer)..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Filter className="h-4 w-4 text-slate-400" />
          <span>Filters</span>
        </button>
      </div>

      {/* Placeholder State */}
      <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <BarChart2 className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          Ready for Player Query
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Search for a player above or connect your backend API to view live simulation models and fixture distributions.
        </p>
      </div>
    </div>
  );
}
