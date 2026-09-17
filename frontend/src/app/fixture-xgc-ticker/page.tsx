import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import FixtureXgcTickerView from "@/components/FixtureXgcTickerView";

export const metadata = {
  title: "Fixture Expected Goals Against (xGC) Ticker | FPL Monte Carlo",
  description: "Ranked Premier League clubs by projected expected goals against across upcoming gameweeks. Color-coded defensive difficulty to target clean sheet runs and defensive assets.",
};

export default function FixtureXgcTickerPage() {
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
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Defensive Difficulty Ticker</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Team Expected Goals Against (xGC) Ticker
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          Target the best defensive runs and clean sheet opportunities across the Premier League.
          Each cell displays projected expected goals conceded and clean sheet probability, color-coded to highlight solid backlines with minimal concession risk.
        </p>
      </div>

      {/* Fixture xGC Ticker View */}
      <FixtureXgcTickerView />
    </div>
  );
}
