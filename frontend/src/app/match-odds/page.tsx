import Link from "next/link";
import { ArrowLeft, TrendingUp, Percent, CheckCircle2 } from "lucide-react";
import MatchOddsView from "@/components/MatchOddsView";

export const metadata = {
  title: "Match Projections & Odds | FPL Hauls",
  description: "Bivariate Poisson match outcome projections, scoreline probabilities, win/draw/loss odds, and over/under 2.5 goals for upcoming Premier League fixtures.",
};

export default function MatchOddsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#FE5803] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-[#FE5803] ring-1 ring-inset ring-orange-500/20">
          <Percent className="h-3 w-3 text-[#FE5803]" />
          <span>Match Odds & Scorelines</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Premier League Match Projections
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-3xl">
          Probabilistic match outcomes derived from team expected goals (xG) and regularized team defensive ratings.
          Analyze win/draw/loss distributions, exact scoreline matrices, and over/under 2.5 goals probabilities for every fixture.
        </p>
      </div>

      {/* Main Match Odds View */}
      <MatchOddsView />
    </div>
  );
}
