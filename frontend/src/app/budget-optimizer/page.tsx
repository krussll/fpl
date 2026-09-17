import Link from "next/link";
import { ArrowLeft, Wallet, ShieldCheck, CheckCircle2 } from "lucide-react";
import BudgetOptimizerView from "@/components/BudgetOptimizerView";

export const metadata = {
  title: "Budget Squad Optimizer | FPL Monte Carlo",
  description:
    "Solve the optimal FPL starting XI and 15-player squad tailored to your exact team value (including sub-£100m squads) across 1, 3, or 5 gameweek horizons.",
};

export default function BudgetOptimizerPage() {
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
          <Wallet className="h-3 w-3" />
          <span>Custom Team Value Solver</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Budget Squad Optimizer
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          Solve for the optimal starting XI and 15-player squad tailored to your exact FPL team value.
          Especially designed for managers whose team value is below £100.0m (e.g. £95m–£99m) or who have accumulated team value, complying with all official FPL rules and starting goalkeeper requirements.
        </p>
      </div>

      {/* Interactive Budget Squad Optimizer View */}
      <BudgetOptimizerView />

      {/* Strategy Guidance Cards */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">
          How the Budget Optimizer Handles Sub-£100m Squads
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Protects Premium Talismans</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Preserves high-upside captaincy assets (e.g. Haaland, Saka) by finding high-efficiency budget starters (£4.0m–£5.0m) rather than downgrading your best captain picks.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>Starting Goalkeeper Guaranteed</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Enforces the rule that at least 1 goalkeeper in your squad must be an expected regular starter for their Premier League club, paired with an economical reserve backup.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-600" />
              <span>Full FPL Rules Compliance</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Strictly adheres to 2 GKP, 5 DEF, 5 MID, 3 FWD quotas, maximum 3 players per Premier League team, and valid starting formations (e.g. 3-4-3, 3-5-2, 4-4-2, 4-3-3).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
