import Link from "next/link";
import {
  Search,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  Flame,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { getAllBlogPosts } from "@/data/blogPosts";
import HeroPitchGraphic from "@/components/HeroPitchGraphic";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Subtle modern background gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-tr from-orange-200/35 via-amber-100/25 to-rose-200/30 opacity-70"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 sm:pt-16 sm:pb-20 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Left-Aligned Text Content */}
          <div className="lg:col-span-6 space-y-6 text-left">

            {/* Heading */}
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
              Predict variance.{" "}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#FE5803] to-[#FF8C44] bg-clip-text text-transparent">
                Target hauls.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg leading-relaxed text-slate-600 sm:text-xl max-w-xl font-normal">
              Go beyond static expected points. Leverage advanced data science prediction models
              to quantify ceiling, floor, clean sheet probabilities, and optimal 15-man squad structures.
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <Link
                href="/player-search"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE5803] px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-orange-500/20 transition-all hover:bg-[#DE4902]"
              >
                <Search className="h-4 w-4" />
                <span>Explore Player Search</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/team-selections"
                className="group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 shadow-xs transition-all hover:border-orange-200 hover:bg-orange-50/40 hover:text-[#FE5803]"
              >
                <Users className="h-4 w-4 text-slate-500 group-hover:text-[#FE5803] transition-colors" />
                <span>Team Selections</span>
              </Link>
            </div>

            {/* Trust check note */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Free mathematical models • 10,000 simulations per gameweek</span>
            </div>
          </div>

          {/* Right Column: Stylized Optimized Pitch Graphic */}
          <div className="lg:col-span-6 relative pt-4 lg:pt-0">
            <HeroPitchGraphic />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Card 1: Player Search */}
          <Link
            href="/player-search"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-[#FE5803] ring-1 ring-orange-500/15">
                <Search className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-[#FE5803] transition-colors">
                Player Search & Prediction Models
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Look up any Premier League player, inspect fixture difficulty ratings (FDR),
                and evaluate data science prediction models across upcoming gameweeks.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-[#FE5803] group-hover:text-[#DE4902]">
              <span>Open Player Search</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Team Selections */}
          <Link
            href="/team-selections"
            className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-8 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
          >
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-600/15">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-xl font-bold text-slate-900 group-hover:text-[#FE5803] transition-colors">
                Team Selections & Lineup Optimizer
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Manage your 15-player squad, calibrate goalkeeper strategies (Premium Set-and-Forget vs Budget Pairing),
                and generate the highest projected expected points starting XI.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-2 text-sm font-semibold text-amber-700 group-hover:text-[#FE5803] transition-colors">
              <span>View Team Selections</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Tactical Highlights Section */}
        <div className="mt-16 rounded-3xl border border-slate-200/80 bg-white/70 p-8 backdrop-blur-xs sm:p-10">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Flame className="h-3.5 w-3.5 text-[#FE5803]" />
                Data Science Prediction Engine
              </div>
              <h3 className="mt-2 text-lg font-bold text-slate-900 sm:text-xl">
                Built for serious FPL managers who want the mathematical edge
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Simulates minutes, clean sheets, goals, assists, bonus points, and disciplinary variance across probabilistic prediction models.
              </p>
            </div>

            <Link
              href="/about"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition-colors hover:border-orange-300 hover:bg-orange-50/50 hover:text-[#FE5803]"
            >
              <BarChart3 className="h-4 w-4 text-slate-500 group-hover:text-[#FE5803]" />
              <span>Learn Methodology</span>
            </Link>
          </div>
        </div>

        {/* Latest from the Blog Section */}
        <div className="mt-20">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <BookOpen className="h-3.5 w-3.5 text-[#FE5803]" />
                Strategy & Guides
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Latest from the FPL Hauls Blog
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FE5803] hover:text-[#DE4902] transition-colors"
            >
              <span>View all guides</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getAllBlogPosts().map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-orange-300 hover:shadow-md transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {post.readingTime}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-[#FE5803] transition-colors leading-snug">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-3">
                    {post.description}
                  </p>
                </div>
                <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                  <span className="text-slate-400">{post.publishedAt}</span>
                  <span className="font-semibold text-[#FE5803] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Read guide <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
