import Link from "next/link";
import {
  Search,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle modern background gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-tr from-emerald-200/40 via-teal-100/30 to-sky-200/40 opacity-70"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
            <span>Probabilistic Fantasy Premier League Engine</span>
          </div>

          {/* Heading */}
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Simulate variance.{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Optimize decisions.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Go beyond static expected points. Run 10,000+ Monte Carlo simulations
            to quantify ceiling, floor, clean sheet probabilities, and optimal 15-man squad structures.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/player-search"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-slate-800 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              <span>Explore Player Search</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              href="/team-selections"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 sm:w-auto"
            >
              <Users className="h-4 w-4 text-slate-500" />
              <span>Team Selections</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Card 1: Player Search */}
          <Link
            href="/player-search"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/15">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Player Search & Simulations
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Look up any Premier League player, inspect fixture difficulty ratings (FDR), 
                and simulate individual performance distributions across upcoming gameweeks.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <span>Open Player Search</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Team Selections */}
          <Link
            href="/team-selections"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-600/15">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                Team Selections & Lineup Optimizer
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Manage your 15-player squad, calibrate goalkeeper strategies (Premium Set-and-Forget vs Budget Pairing), 
                and generate the highest projected expected points starting XI.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-teal-700">
              <span>View Team Selections</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Tactical Highlights Section */}
        <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white/70 p-8 backdrop-blur-sm sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Monte Carlo Simulation Engine
              </div>
              <h3 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                Built for serious FPL managers who want the mathematical edge
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Simulates minutes, clean sheets, goals, assists, bonus points, and disciplinary variance across 10,000 iterations.
              </p>
            </div>

            <Link
              href="/about"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span>Learn Methodology</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
