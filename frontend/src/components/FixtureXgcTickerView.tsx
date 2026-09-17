"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FixtureXgcTickerResponse,
  TeamXgcTickerRow,
  TeamFixtureXgcTickerItem,
} from "@/types/fixtureTicker";
import { getTeamKit } from "@/utils/teamColors";
import {
  Shield,
  Search,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Info,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

// Team Kit SVG
function TeamKitIcon({
  team,
  size = "sm",
}: {
  team: string;
  size?: "sm" | "md";
}) {
  const kit = getTeamKit(team, false);
  const sizeClasses = size === "sm" ? "h-6 w-6" : "h-8 w-8";

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg
        viewBox="0 0 48 48"
        className={`${sizeClasses} drop-shadow-2xs`}
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

// Color coding function based on projected fixture xGC (rewarding LOW expected goals against)
function getXgcColorClasses(xgc: number): {
  bg: string;
  text: string;
  badge: string;
  border: string;
  label: string;
} {
  if (xgc <= 0.85) {
    // Prime clean sheet target (elite defensive fixture)
    return {
      bg: "bg-emerald-600",
      text: "text-white",
      badge: "bg-emerald-700/80 text-white",
      border: "border-emerald-600",
      label: "Prime Clean Sheet Target (≤ 0.85 xGC)",
    };
  } else if (xgc <= 1.15) {
    // Strong defensive matchup
    return {
      bg: "bg-emerald-100",
      text: "text-emerald-950",
      badge: "bg-emerald-200 text-emerald-900",
      border: "border-emerald-300",
      label: "Strong Defensive Matchup (0.86 – 1.15 xGC)",
    };
  } else if (xgc <= 1.45) {
    // Average fixture
    return {
      bg: "bg-slate-100",
      text: "text-slate-800",
      badge: "bg-slate-200 text-slate-700",
      border: "border-slate-200",
      label: "Average Fixture (1.16 – 1.45 xGC)",
    };
  } else if (xgc <= 1.75) {
    // High concession risk
    return {
      bg: "bg-amber-100",
      text: "text-amber-950",
      badge: "bg-amber-200 text-amber-900",
      border: "border-amber-300",
      label: "High Concession Risk (1.46 – 1.75 xGC)",
    };
  } else {
    // Difficult / Severe concession hazard
    return {
      bg: "bg-rose-500",
      text: "text-white",
      badge: "bg-rose-600 text-white",
      border: "border-rose-600",
      label: "Difficult Matchup (> 1.75 xGC)",
    };
  }
}

export default function FixtureXgcTickerView() {
  const [data, setData] = useState<FixtureXgcTickerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<3 | 5 | 8>(5);
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state: "total" | "avg" | number (gameweek index)
  // For xGC, default sort is ascending (lowest xGC first = best defensive runs)
  const [sortField, setSortField] = useState<"total" | "avg" | number>("total");
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function loadTicker(h: number) {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/fixture-xgc-ticker?horizon=${h}`);
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || `Failed to load defensive ticker for horizon ${h}`);
        }
        setData(json);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load defensive ticker.");
      } finally {
        setLoading(false);
      }
    }
    loadTicker(horizon);
  }, [horizon]);

  function handleSort(field: "total" | "avg" | number) {
    if (sortField === field) {
      setSortAsc((prev) => !prev);
    } else {
      setSortField(field);
      // For defensive ticker, default to lowest xGC first (ascending)
      setSortAsc(true);
    }
  }

  // Filter & Sort
  const processedRows = useMemo(() => {
    if (!data) return [];
    let rows = [...data.teams];

    // Filter by query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.team_name.toLowerCase().includes(q) ||
          r.short_name.toLowerCase().includes(q)
      );
    }

    // Sort
    rows.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === "total") {
        valA = a.total_xgc;
        valB = b.total_xgc;
      } else if (sortField === "avg") {
        valA = a.avg_xgc;
        valB = b.avg_xgc;
      } else if (typeof sortField === "number") {
        valA = a.fixtures[sortField]?.projected_xgc || 0;
        valB = b.fixtures[sortField]?.projected_xgc || 0;
      }

      return sortAsc ? valA - valB : valB - valA;
    });

    return rows;
  }, [data, searchQuery, sortField, sortAsc]);

  // Top 3 best defensive runs (lowest total xGC)
  const top3Runs = useMemo(() => {
    if (!data) return [];
    return [...data.teams].sort((a, b) => a.total_xgc - b.total_xgc).slice(0, 3);
  }, [data]);

  return (
    <div className="space-y-8">
      {/* Header & Controls Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <ShieldCheck className="h-3 w-3" />
              <span>Defensive Fixture Ticker</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Team Expected Goals Against (xGC) Ticker
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xl">
              Ranked Premier League clubs by projected expected goals conceded per match.
              Color-coded to reward low expected goals against so you can target clean sheet runs for defenders and goalkeepers.
            </p>
          </div>

          {/* Horizon Pills & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by club..."
                className="w-full sm:w-48 rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            {/* Horizon Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <span className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Run:
              </span>
              {[
                { label: "Next 3 GWs", val: 3 },
                { label: "Next 5 GWs", val: 5 },
                { label: "Next 8 GWs", val: 8 },
              ].map((h) => (
                <button
                  key={h.val}
                  type="button"
                  onClick={() => setHorizon(h.val as 3 | 5 | 8)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    horizon === h.val
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Color Scale Legend */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Defensive Rating Scale:</span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white shadow-2xs">
                ≤ 0.85 xGC (Prime Clean Sheet Target)
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-950 border border-emerald-300">
                0.86 – 1.15 xGC (Strong Matchup)
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-800 border border-slate-200">
                1.16 – 1.45 xGC (Average)
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2.5 py-1 text-[11px] font-medium text-amber-950 border border-amber-300">
                1.46 – 1.75 xGC (Tough Matchup)
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-black text-white shadow-2xs">
                &gt; 1.75 xGC (Difficult / High Risk)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Best Defensive Runs Highlight */}
      {top3Runs.length > 0 && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {top3Runs.map((t, idx) => {
            const bestFix = [...t.fixtures].sort(
              (a, b) => a.projected_xgc - b.projected_xgc
            )[0];
            return (
              <div
                key={t.team_id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-sm font-black text-emerald-800 ring-1 ring-emerald-200">
                    #{idx + 1}
                  </div>
                  <TeamKitIcon team={t.team_name} size="md" />
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{t.team_name}</div>
                    <div className="text-[11px] text-slate-500">
                      Best: <strong className="text-slate-800">{bestFix?.display}</strong> ({bestFix?.projected_xgc} xGC)
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-emerald-800 tracking-tight">
                    {t.total_xgc.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {t.avg_xgc.toFixed(2)}/match
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
            Calculating defensive fixture xGC across {horizon} gameweeks...
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Blending team defensive strength with opponent attack ratings and venue adjustments.
          </p>
        </div>
      )}

      {/* Fixture xGC Ticker Ranked Table */}
      {!loading && data && (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 pl-4 pr-2 w-12 text-center">Rank</th>
                  <th className="py-3.5 px-3 min-w-[160px]">Team</th>

                  {/* Total xGC Column Header */}
                  <th className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("total")}
                      className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <span>Total xGC</span>
                      {sortField === "total" ? (
                        sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>

                  {/* Avg xGC Column Header */}
                  <th className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleSort("avg")}
                      className="inline-flex items-center gap-1 font-bold text-slate-900 hover:text-emerald-700 transition-colors cursor-pointer"
                    >
                      <span>Avg xGC</span>
                      {sortField === "avg" ? (
                        sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      )}
                    </button>
                  </th>

                  {/* Individual Gameweek Columns */}
                  {Array.from({ length: horizon }).map((_, idx) => {
                    const sampleGw = data.teams[0]?.fixtures[idx]?.gameweek;
                    const label = sampleGw ? `GW${sampleGw}` : `GW+${idx + 1}`;
                    return (
                      <th key={idx} className="py-3.5 px-2.5 text-center min-w-[100px]">
                        <button
                          type="button"
                          onClick={() => handleSort(idx)}
                          className="inline-flex items-center gap-1 font-bold text-slate-800 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          <span>{label}</span>
                          {sortField === idx && (
                            sortAsc ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />
                          )}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {processedRows.map((team, rIdx) => (
                  <tr
                    key={team.team_id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3 pl-4 pr-2 text-center font-bold text-slate-400 text-xs">
                      #{rIdx + 1}
                    </td>

                    {/* Team Name with Kit */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <TeamKitIcon team={team.team_name} size="sm" />
                        <div>
                          <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-800 transition-colors">
                            {team.team_name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Base: {team.base_xgc90.toFixed(2)} xGC90
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total xGC */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-sm font-black text-slate-900">
                        {team.total_xgc.toFixed(2)}
                      </span>
                    </td>

                    {/* Avg xGC */}
                    <td className="py-3 px-3 text-right">
                      <span className="text-xs font-bold text-emerald-800">
                        {team.avg_xgc.toFixed(2)}
                      </span>
                    </td>

                    {/* Individual Gameweek Fixture Cells */}
                    {team.fixtures.map((fix, fIdx) => {
                      const colors = getXgcColorClasses(fix.projected_xgc);
                      return (
                        <td key={fIdx} className="py-2 px-1.5 text-center">
                          <div
                            title={`${team.team_name} vs ${fix.opponent_name} (${fix.is_home ? "Home" : "Away"})\nProjected: ${fix.projected_xgc} xGC • CS Prob: ~${fix.clean_sheet_prob}%\nFDR: ${fix.fdr} • Rating: ${colors.label}`}
                            className={`rounded-xl p-2 transition-transform duration-150 group-hover:scale-[1.02] shadow-2xs border ${colors.bg} ${colors.text} ${colors.border}`}
                          >
                            <div className="font-bold text-[11px] truncate leading-tight">
                              {fix.display}
                            </div>
                            <div className="mt-1 font-black text-xs tracking-tight">
                              {fix.projected_xgc.toFixed(2)}
                              <span className="text-[9px] font-normal opacity-80 ml-0.5">xGC</span>
                            </div>
                          </div>
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
