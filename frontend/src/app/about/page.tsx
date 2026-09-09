import Link from "next/link";
import { ArrowLeft, Cpu, Target } from "lucide-react";

export const metadata = {
  title: "About | FPL Monte Carlo",
  description: "About FPL Monte Carlo and our probabilistic simulation methodology.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
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

      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          About FPL Monte Carlo
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Transforming Fantasy Premier League decision making through probabilistic simulation and mathematical optimization.
        </p>
      </div>

      <div className="mt-8 space-y-8 text-slate-600 leading-relaxed">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
            <Cpu className="h-5 w-5 text-emerald-600" />
            <span>The Monte Carlo Approach</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Fantasy Premier League outcomes are inherently high variance. A player with 5.5 expected points might score 2 points 40% of the time, or hit a 15-point haul 12% of the time. Traditional static xP models flatten this distribution into a single average.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            FPL Monte Carlo executes tens of thousands of fixture simulations taking into account minutes reliability, fixture strength ratings (FDR), underlying attacking/defensive data, bonus point systems (BPS), and card probability to produce realistic probability densities.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 text-slate-900 font-bold text-lg">
            <Target className="h-5 w-5 text-teal-600" />
            <span>Key Objectives</span>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
              <span>
                <strong>Downside & Upside Quantification:</strong> Understand the 10th percentile floor versus the 90th percentile ceiling before making captaincy or transfer decisions.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
              <span>
                <strong>Combinatorial Squad Optimization:</strong> Solve for optimal starting lineups, bench ordering, and goalkeeper pair rotation schedules.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
              <span>
                <strong>Transparent Statistics:</strong> Provide uncompromised statistical rigor with zero black-box bias.
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
