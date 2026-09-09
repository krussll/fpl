import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import PlayerTable from "@/components/PlayerTable";

export const metadata = {
  title: "Player Search | FPL Monte Carlo",
  description: "Search Fantasy Premier League players and analyze Monte Carlo expected distributions.",
};

export default function PlayerSearchPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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

      {/* Page Header */}
      <div className="mb-8 border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
          <Sparkles className="h-3 w-3" />
          <span>Simulation Engine</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Player Search
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Monte Carlo expected points distributions, fixture difficulty ratings (FDR), floor, ceiling, and haul likelihood.
        </p>
      </div>

      {/* Main Table */}
      <PlayerTable />
    </div>
  );
}
