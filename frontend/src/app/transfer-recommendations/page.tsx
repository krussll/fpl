import Link from "next/link";
import { ArrowLeft, ArrowRightLeft, TrendingUp, Shield, Zap } from "lucide-react";
import TransferRecommendationView from "@/components/TransferRecommendationView";

export const metadata = {
  title: "Transfer Recommendations | FPL Monte Carlo",
  description: "Live FPL team transfer optimizer. Compare points-optimized upgrades, template rank protection, and explosive haul potential on your actual pitch.",
};

export default function TransferRecommendationsPage() {
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
          <ArrowRightLeft className="h-3 w-3" />
          <span>Transfer Recommendation Tool</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          FPL Transfer Recommendations
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          Connect your official Fantasy Premier League squad to receive mathematically optimized transfer routes.
          Preview swaps directly on your pitch across 1-gameweek, 3-gameweek, and 5-gameweek horizons.
        </p>
      </div>

      {/* Main Interactive Tool View */}
      <TransferRecommendationView />

      {/* Strategy Guidance Explainer Cards */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Three Distinct Transfer Strategies
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Every FPL manager has different goals depending on rank, league position, and risk tolerance:
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Strategy 1 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp className="h-4 w-4" />
              </div>
              <span>Points Optimizer</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Targets the absolute highest expected points (xP) upgrade within your available bank balance.
              Directly elevates starting XI scoring output based on opponent defensive matchups and venue difficulty.
            </p>
          </div>

          {/* Strategy 2 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                <Shield className="h-4 w-4" />
              </div>
              <span>Template Rank Protection</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Identifies heavily owned template assets you do not own to eliminate effective ownership (EO) risk.
              Shields your overall rank from red arrows when consensus favorites deliver big gameweeks.
            </p>
          </div>

          {/* Strategy 3 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Zap className="h-4 w-4" />
              </div>
              <span>Explosive Haul Potential</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Prioritizes 90th-percentile (P90) ceiling and double-digit haul probability (10+ pts).
              The ideal strategy for chasing mini-league leaders or targeting explosive upside with differential assets.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
