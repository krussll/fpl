import Link from "next/link";
import { ArrowLeft, Sparkles, CheckCircle2 } from "lucide-react";
import OptimalSquadView from "@/components/OptimalSquadView";

export const metadata = {
  title: "Optimal Team Selections | FPL Monte Carlo",
  description: "Optimal starting XI and 15-player squad selection for the upcoming Fantasy Premier League gameweek.",
};

export default function TeamSelectionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
          <Sparkles className="h-3 w-3" />
          <span>Optimal Squad Solver</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Optimal Team Selections
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          Monte Carlo optimized 15-player squad and starting XI for the upcoming gameweek.
          Formations and player selections are mathematically optimized to maximize starting points under the official £100.0m budget and 3-player-per-club limits.
        </p>
      </div>

      {/* Optimal Squad Interactive Pitch & Bench View */}
      <OptimalSquadView />

      {/* Goalkeeper Strategy Guidelines Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          Goalkeeper Pairing Strategies
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Strategy 1: Set-and-Forget Premium</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              One locked starting keeper (e.g. Raya £6.0m) paired with a £4.0m deadspot backup to maximize outfield funds.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Strategy 2: Rotating Budget Pairs</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Two starting keepers (£4.5m + £4.5m or £5.0m + £4.5m) rotated strictly by fixture difficulty (FDR).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
