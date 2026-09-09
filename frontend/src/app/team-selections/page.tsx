import Link from "next/link";
import { Users, ArrowLeft, Shield, SlidersHorizontal, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Team Selections | FPL Monte Carlo",
  description: "Squad selection and starting XI optimization for Fantasy Premier League.",
};

export default function TeamSelectionsPage() {
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
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-inset ring-teal-600/20">
            <Users className="h-3 w-3" />
            <span>Optimization Tool</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Team Selections & Squad Optimizer
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure your 15-player roster, apply tactical constraints, and maximize gameweek expectation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span>Constraints</span>
          </button>
        </div>
      </div>

      {/* Goalkeeper Strategy Guidelines Card */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">
          Goalkeeper Pairing Strategies
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Strategy 1: Set-and-Forget Premium</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              One locked starting keeper (e.g. Raya £6.0m) paired with a £4.0m deadspot backup to maximize outfield funds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
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

      {/* Squad Placeholder */}
      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Shield className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-900">
          Squad Builder Interface
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
          Load your current FPL squad ID or build a custom 15-player team to run combinatorial optimization.
        </p>
      </div>
    </div>
  );
}
