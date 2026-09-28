"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Clock,
  BookOpen,
  Search,
  Filter,
  Flame,
} from "lucide-react";
import { BlogPost } from "@/data/blogPosts";

interface BlogIndexClientProps {
  posts: BlogPost[];
}

export default function BlogIndexClient({ posts }: BlogIndexClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const categories = [
    { id: "all", label: "All Guides" },
    { id: "budget-strategy", label: "Budget Strategy" },
    { id: "defensive-analysis", label: "Defensive Analysis" },
    { id: "transfer-tactics", label: "Transfer Tactics" },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      selectedCategory === "all" || post.categorySlug === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.targetKeyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.secondaryKeywords.some((k) =>
        k.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative overflow-hidden py-12 sm:py-16">
      {/* Subtle modern background gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div
          className="aspect-[1318/752] w-[82.375rem] flex-none bg-gradient-to-tr from-orange-200/30 via-amber-100/20 to-rose-200/25 opacity-70"
          style={{
            clipPath:
              "polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top Hero Section */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/90 px-3.5 py-1 text-xs font-semibold text-orange-900 shadow-xs backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#FE5803]" />
            <span>FPL Hauls Editorial & Strategy</span>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            FPL Strategy, Data Science &{" "}
            <span className="bg-gradient-to-r from-[#FE5803] to-[#FF8C44] bg-clip-text text-transparent">
              Haul Guides
            </span>
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-slate-600 sm:text-xl">
            Actionable tactics, fixture models, and mathematical frameworks
            designed to help you navigate variance, out-plan the template, and
            climb your Fantasy Premier League mini-leagues.
          </p>

          {/* Search Bar */}
          <div className="relative mx-auto mt-8 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search guides, keywords, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200/90 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-xs placeholder:text-slate-400 focus:border-[#FE5803] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-[#FE5803] text-white shadow-xs shadow-orange-500/25"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-orange-200 hover:bg-orange-50/50 hover:text-[#FE5803]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Articles Grid */}
        <div className="mt-14">
          {filteredPosts.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
              <h3 className="mt-3 text-base font-semibold text-slate-900">
                No guides found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                No articles match your current search query or filter.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-orange-50 px-3.5 py-2 text-xs font-semibold text-[#FE5803] hover:bg-orange-100 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
                >
                  <div>
                    {/* Category & Read Time */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20">
                        {post.category}
                      </span>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{post.readingTime}</span>
                      </div>
                    </div>

                    {/* Post Title */}
                    <h2 className="mt-4 text-xl font-bold leading-snug text-slate-900 transition-colors group-hover:text-[#FE5803]">
                      {post.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 line-clamp-3">
                      {post.description}
                    </p>
                  </div>

                  {/* Footer: Author & Read Link */}
                  <div className="mt-7 border-t border-slate-100 pt-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 font-bold text-xs text-[#FE5803] ring-1 ring-orange-500/20">
                        {post.author.initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-900">
                          {post.author.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {post.publishedAt}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-[#FE5803] group-hover:translate-x-1 transition-transform">
                      <span>Read guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Interactive Tool CTA Banner */}
        <div className="mt-20 rounded-3xl border border-orange-200/80 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white p-8 sm:p-12 shadow-xs">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#FE5803] ring-1 ring-orange-500/20 shadow-xs">
                <Flame className="h-3.5 w-3.5" />
                <span>Free Data Science Tools</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Put These Strategies Into Practice
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                Explore our suite of mathematical solvers: calculate optimal
                budget squads under £100m, target clean sheets with our xGC
                fixture ticker, or simulate player point distributions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <Link
                href="/budget-optimizer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#FE5803] px-5 py-3 text-xs sm:text-sm font-semibold text-white shadow-sm shadow-orange-500/25 hover:bg-[#DE4902] transition-colors"
              >
                <span>Budget Squad Optimizer</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/fixture-xgc-ticker"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:border-orange-200 hover:text-[#FE5803] hover:bg-orange-50/50 transition-colors"
              >
                <span>Fixture xGC Ticker</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
