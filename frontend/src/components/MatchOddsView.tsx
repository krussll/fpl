"use client";

import { useState, useEffect } from "react";
import { MatchOddsResponse, MatchProjection, ScorelineProbability } from "@/types/matchOdds";
import { getTeamKit } from "@/utils/teamColors";
import {
  TrendingUp,
  Percent,
  Calendar,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Shield,
  Zap,
  Info,
  Clock,
} from "lucide-react";

// Team Kit SVG
function TeamKitIcon({
  team,
  size = "md",
}: {
  team: string;
  size?: "sm" | "md" | "lg";
}) {
  const kit = getTeamKit(team, false);
  const sizeClasses =
    size === "sm"
      ? "h-6 w-6"
      : size === "lg"
      ? "h-11 w-11 sm:h-12 sm:w-12"
      : "h-8 w-8 sm:h-9 sm:w-9";

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 48 48"
        className={`${sizeClasses} drop-shadow-xs`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          fill={kit.primary}
        />
        {kit.secondary !== kit.primary && (
          <>
            <path d="M15 10L10 17L15 22L17 17L17.2 11.2Z" fill={kit.secondary} />
            <path d="M33 10L38 17L33 22L31 17L30.8 11.2Z" fill={kit.secondary} />
          </>
        )}
        {kit.pattern === "striped" && (
          <g stroke={kit.patternColor || kit.secondary} strokeWidth="2.4" strokeLinecap="butt">
            <line x1="21.5" y1="14" x2="21.5" y2="38" />
            <line x1="26.5" y1="14" x2="26.5" y2="38" />
          </g>
        )}
        <path
          d="M20 13C22 15 26 15 28 13"
          stroke={kit.collar || "#ffffff"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          stroke={kit.stroke || "#ffffff"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// Single Match Card
function MatchCard({ match }: { match: MatchProjection }) {
  const [showMatrix, setShowMatrix] = useState(false);

  const homeWin = match.probabilities.home_win;
  const draw = match.probabilities.draw;
  const awayWin = match.probabilities.away_win;

  const totalXg = match.total_match_xg;
  const homeShare = totalXg > 0 ? (match.home_team.xg / totalXg) * 100 : 50;

  const formattedDate = match.kickoff_time
    ? new Date(match.kickoff_time).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBD";

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all">
      {/* Match Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
            Total xG: <strong className="text-slate-900">{match.total_match_xg}</strong>
          </span>
        </div>
      </div>

      {/* Teams & Projected Expected Goals */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-7 items-center gap-4">
        {/* Home Team */}
        <div className="md:col-span-3 flex items-center gap-3">
          <TeamKitIcon team={match.home_team.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-base font-bold text-slate-900">
                {match.home_team.name}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                H
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Clean Sheet: <strong className="text-slate-800">{match.home_team.clean_sheet_pct}%</strong>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
              {match.home_team.xg.toFixed(2)}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Exp Goals
            </span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
            VS
          </span>
        </div>

        {/* Away Team */}
        <div className="md:col-span-3 flex items-center justify-end gap-3 text-right">
          <div className="text-left">
            <div className="text-xl sm:text-2xl font-black text-teal-800 tracking-tight">
              {match.away_team.xg.toFixed(2)}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
              Exp Goals
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-end gap-1.5">
              <span className="truncate text-base font-bold text-slate-900">
                {match.away_team.name}
              </span>
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                A
              </span>
            </div>
            <div className="text-xs text-slate-500">
              Clean Sheet: <strong className="text-slate-800">{match.away_team.clean_sheet_pct}%</strong>
            </div>
          </div>
          <TeamKitIcon team={match.away_team.name} size="lg" />
        </div>
      </div>

      {/* 1. Win / Draw / Loss Probabilities */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="text-emerald-900">
            {match.home_team.name} Win: {homeWin}%
          </span>
          <span className="text-slate-600">Draw: {draw}%</span>
          <span className="text-teal-900">
            {match.away_team.name} Win: {awayWin}%
          </span>
        </div>

        {/* Segmented Win Probability Bar */}
        <div className="relative flex h-3 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200">
          <div
            style={{ width: `${homeWin}%` }}
            title={`${match.home_team.name} Win (${homeWin}%)`}
            className="bg-emerald-500 transition-all duration-300 hover:opacity-90"
          />
          <div
            style={{ width: `${draw}%` }}
            title={`Draw (${draw}%)`}
            className="bg-slate-400 transition-all duration-300 hover:opacity-90"
          />
          <div
            style={{ width: `${awayWin}%` }}
            title={`${match.away_team.name} Win (${awayWin}%)`}
            className="bg-teal-500 transition-all duration-300 hover:opacity-90"
          />
        </div>
      </div>

      {/* 2. Key Markets: Over/Under 2.5 & BTTS */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-3 border-t border-slate-100">
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Over 2.5 Goals
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {match.probabilities.over_25}%
          </div>
          <div className="text-[10px] text-slate-500">Under: {match.probabilities.under_25}%</div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Both Teams Score
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {match.probabilities.btts_yes}%
          </div>
          <div className="text-[10px] text-slate-500">No: {match.probabilities.btts_no}%</div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Over 1.5 Goals
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {match.probabilities.over_15}%
          </div>
          <div className="text-[10px] text-slate-500">Under: {match.probabilities.under_15}%</div>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Over 3.5 Goals
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {match.probabilities.over_35}%
          </div>
          <div className="text-[10px] text-slate-500">Under: {match.probabilities.under_35}%</div>
        </div>
      </div>

      {/* 3. Most Probable Exact Scorelines */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-700 mr-1">Top Scorelines:</span>
          {match.top_scorelines.slice(0, 4).map((sc, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900 ring-1 ring-slate-200"
            >
              <strong className="text-emerald-700 mr-1">{sc.score}</strong>
              <span className="text-[10.5px] font-medium text-slate-500">({sc.percentage}%)</span>
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setShowMatrix((prev) => !prev)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          <span>{showMatrix ? "Hide Matrix" : "Full Scoreline Matrix"}</span>
          {showMatrix ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expandable Poisson Scoreline Heatmap Matrix */}
      {showMatrix && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-bold text-slate-900">
              Poisson Exact Scoreline Probabilities (%)
            </span>
            <span className="text-slate-500">
              Rows: {match.home_team.short_name} (H) • Cols: {match.away_team.short_name} (A)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] text-slate-400 font-semibold">
                  <th className="py-1 px-2 text-left font-bold text-slate-600">H \ A</th>
                  {[0, 1, 2, 3, 4].map((g) => (
                    <th key={g} className="py-1 px-2 font-bold text-slate-700">
                      {g} {match.away_team.short_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[0, 1, 2, 3, 4].map((hGoals) => (
                  <tr key={hGoals} className="border-b border-slate-100/80">
                    <td className="py-2 px-2 text-left font-bold text-slate-700 bg-slate-100/60 rounded-l">
                      {hGoals} {match.home_team.short_name}
                    </td>
                    {[0, 1, 2, 3, 4].map((aGoals) => {
                      const pct = match.score_matrix[hGoals]?.[aGoals] || 0;
                      // Heatmap color scaling
                      const bgIntensity =
                        pct >= 10
                          ? "bg-emerald-500 text-white font-black"
                          : pct >= 7
                          ? "bg-emerald-200 text-emerald-950 font-bold"
                          : pct >= 4
                          ? "bg-emerald-100 text-emerald-900 font-medium"
                          : pct >= 2
                          ? "bg-slate-100 text-slate-700"
                          : "bg-white text-slate-400";

                      return (
                        <td key={aGoals} className={`py-2 px-2 rounded-xs ${bgIntensity}`}>
                          {pct > 0 ? `${pct.toFixed(1)}%` : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchOddsView() {
  const [data, setData] = useState<MatchOddsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGw, setSelectedGw] = useState<number>(5);

  useEffect(() => {
    async function loadOdds(gw: number) {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/match-odds?gw=${gw}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `Failed to load match odds for GW${gw}`);
        }
        setData(json);
        setSelectedGw(json.selected_gameweek);
      } catch (err: any) {
        setError(err?.message || "Failed to load fixture projections.");
      } finally {
        setLoading(false);
      }
    }
    loadOdds(selectedGw);
  }, [selectedGw]);

  // Aggregate stats across the gameweek
  const totalGwGoals = data
    ? parseFloat(data.matches.reduce((sum, m) => sum + m.total_match_xg, 0).toFixed(1))
    : 0;
  const avgGwGoals = data && data.matches.length > 0 ? (totalGwGoals / data.matches.length).toFixed(2) : "0.0";
  const highestGoalMatch = data
    ? [...data.matches].sort((a, b) => b.total_match_xg - a.total_match_xg)[0]
    : null;

  return (
    <div className="space-y-8">
      {/* Gameweek Selector Header Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <TrendingUp className="h-3 w-3" />
              <span>Bivariate Poisson Match Engine</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Premier League Gameweek Projections
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              Mathematically modelled match scorelines, win/draw/loss odds, and over/under 2.5 goals probabilities derived from team attacking and defensive expected goals.
            </p>
          </div>

          {/* Gameweek Pills */}
          {data && data.available_gameweeks && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5">
              <span className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gameweek:
              </span>
              {data.available_gameweeks.slice(0, 6).map((gw) => (
                <button
                  key={gw}
                  type="button"
                  onClick={() => setSelectedGw(gw)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    selectedGw === gw
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  GW{gw}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Aggregate Stats */}
        {data && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-6 border-t border-slate-100">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Scheduled Matches
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">{data.matches.length} Matches</div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Total Projected Goals
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-800">
                {totalGwGoals} <span className="text-xs font-normal text-slate-500">({avgGwGoals}/match)</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Highest xG Clash
              </div>
              <div className="mt-1 truncate text-sm font-bold text-slate-900">
                {highestGoalMatch ? `${highestGoalMatch.home_team.short_name} vs ${highestGoalMatch.away_team.short_name}` : "-"}
              </div>
              <div className="text-[11px] text-emerald-800 font-semibold">
                {highestGoalMatch?.total_match_xg} total xG
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Data Model
              </div>
              <div className="mt-1 text-sm font-bold text-slate-900">Poisson Bivariate</div>
              <div className="text-[11px] text-slate-500">Defense regularized</div>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-xs text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Calculating Poisson scoreline grids for Gameweek {selectedGw}...
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Generating win/draw/loss odds, over/under probabilities, and exact scorelines.
          </p>
        </div>
      )}

      {/* Match Cards List */}
      {!loading && data && (
        <div className="grid grid-cols-1 gap-6">
          {data.matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
