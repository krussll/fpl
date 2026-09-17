import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | FPL Hauls",
  description: "Terms of service and usage guidelines for FPL Hauls.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#FE5803] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="border-b border-slate-200/80 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Last updated: September 2026
        </p>
      </div>

      <div className="mt-8 space-y-6 text-sm text-slate-600 leading-relaxed">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            1. Nature of the Service
          </h2>
          <p>
            FPL Hauls provides probabilistic data science modeling, predictive algorithms, and squad optimization tools for informational and entertainment purposes related to the Fantasy Premier League game.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">
            2. Intellectual Property & Disclaimer
          </h2>
          <p>
            FPL Hauls is an independent tool and is not endorsed by, directly affiliated with, maintained, or sponsored by the Football Association Premier League Limited or Fantasy Premier League. All official club names, player names, and Premier League marks are property of their respective trademark holders.
          </p>

          <h2 className="text-base font-bold text-slate-900 pt-2">
            3. No Guarantees
          </h2>
          <p>
            Statistical prediction models and data science simulations represent probabilistic projections and do not guarantee specific match outcomes, rank increases, or mini-league victories.
          </p>
        </div>
      </div>
    </div>
  );
}
