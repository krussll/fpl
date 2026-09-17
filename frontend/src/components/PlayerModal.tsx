"use client";

import { useEffect, useRef, useState } from "react";
import {
  Player,
  PlayerFixture,
  PlayerHistoryMatch,
  PlayerAlternativesData,
  PlayerAlternativeOption,
} from "@/types/player";
import {
  X,
  Clock,
  Target,
  Shield,
  ShieldCheck,
  Star,
  BarChart3,
  ChevronDown,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Loader2,
  ArrowLeft,
} from "lucide-react";

interface PlayerModalProps {
  player: Player;
  gameweeks?: number;
  onClose: () => void;
}

function getPosBadgeClasses(position: string) {
  switch (position) {
    case "GKP":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "DEF":
      return "bg-sky-50 text-sky-700 border-sky-200/80";
    case "MID":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    case "FWD":
      return "bg-rose-50 text-rose-700 border-rose-200/80";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getFdrClasses(fdr: number) {
  switch (fdr) {
    case 1:
    case 2:
      return "bg-emerald-50 text-emerald-700 border-emerald-200/90";
    case 3:
      return "bg-slate-100 text-slate-700 border-slate-200";
    case 4:
      return "bg-rose-50 text-rose-700 border-rose-200/90";
    case 5:
      return "bg-red-950/10 text-red-900 border-red-300 font-bold";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getCleanSheetPoints(
  position: string,
  cleanSheets: number,
  minutes: number
): number {
  if (cleanSheets <= 0 || minutes < 60) return 0;
  if (position === "GKP" || position === "DEF") return 4;
  if (position === "MID") return 1;
  return 0; // FWDs receive 0 clean sheet points in FPL rules
}

export default function PlayerModal({
  player: initialPlayer,
  gameweeks = 1,
  onClose,
}: PlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Active player in modal (allows switching when clicking an alternative recommendation)
  const [activePlayer, setActivePlayer] = useState<Player>(initialPlayer);

  useEffect(() => {
    setActivePlayer(initialPlayer);
  }, [initialPlayer]);

  // Modal always displays the next 5 upcoming GW fixtures
  const fixtures =
    activePlayer.fixtures_5 && activePlayer.fixtures_5.length > 0
      ? activePlayer.fixtures_5
      : activePlayer.five_gw?.fixtures && activePlayer.five_gw.fixtures.length > 0
      ? activePlayer.five_gw.fixtures
      : activePlayer.fixtures || [];

  const gwLabel = gameweeks === 1 ? "Current GW" : `Next ${gameweeks} GWs`;

  // Player match history (last 5 gameweeks)
  const [fetchedHistory, setFetchedHistory] = useState<PlayerHistoryMatch[] | null>(null);

  useEffect(() => {
    if (activePlayer.history && activePlayer.history.length > 0) {
      setFetchedHistory(null);
      return;
    }
    let active = true;
    fetch(`/api/player-history?id=${activePlayer.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && Array.isArray(data.history)) {
          setFetchedHistory(data.history);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [activePlayer.id, activePlayer.history]);

  const history =
    activePlayer.history && activePlayer.history.length > 0
      ? activePlayer.history
      : fetchedHistory || [];

  const recentMatches = history.slice(-5);

  // Distribution chart visibility toggle (hidden by default)
  const [showDistribution, setShowDistribution] = useState<boolean>(false);

  // Similar Price Alternatives State
  const [alternativesData, setAlternativesData] = useState<PlayerAlternativesData | null>(null);
  const [loadingAlternatives, setLoadingAlternatives] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoadingAlternatives(true);

    fetch(`/api/player-alternatives?id=${activePlayer.id}&horizon=${gameweeks}`)
      .then((res) => res.json())
      .then((data: PlayerAlternativesData) => {
        if (active && !("error" in data)) {
          setAlternativesData(data);
        }
      })
      .catch((err) => {
        console.error("Failed to load player alternatives:", err);
      })
      .finally(() => {
        if (active) setLoadingAlternatives(false);
      });

    return () => {
      active = false;
    };
  }, [activePlayer.id, gameweeks]);

  // Close on Escape & lock body scrolling
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Distribution Chart Math (matches the selected gameweek horizon)
  const distMap = activePlayer.distribution || {};
  const scores = Object.keys(distMap)
    .map(Number)
    .sort((a, b) => a - b);

  const hasDistribution = scores.length > 0;
  const minScore = hasDistribution ? Math.min(0, scores[0]) : 0;
  const maxScore = hasDistribution
    ? Math.max(16, scores[scores.length - 1])
    : 16;
  const numBins = maxScore - minScore + 1;

  const viewBoxWidth = 700;
  const viewBoxHeight = 220;
  const padLeft = 40;
  const padRight = 25;
  const padTop = 30;
  const padBottom = 30;
  const plotWidth = viewBoxWidth - padLeft - padRight;
  const plotHeight = viewBoxHeight - padTop - padBottom;

  const maxProb = hasDistribution
    ? Math.max(...Object.values(distMap), 0.05)
    : 0.1;
  const barWidth = Math.max(4, plotWidth / numBins - 2.5);

  const median =
    activePlayer.median !== undefined ? activePlayer.median : activePlayer.xp;
  const floor = activePlayer.floor;
  const ceiling = activePlayer.ceiling;

  const getX = (val: number) =>
    padLeft +
    ((val - minScore) / (maxScore - minScore)) * (plotWidth - barWidth) +
    barWidth / 2;

  const p10X = getX(floor);
  const medX = getX(median);
  const p90X = getX(ceiling);

  const isDifferential = activePlayer.selected_by_percent < 5.0;
  const hasSwitchedPlayer = activePlayer.id !== initialPlayer.id;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modalPlayerName"
    >
      <div
        ref={modalRef}
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-150 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6 bg-slate-50/50">
          <div>
            {hasSwitchedPlayer && (
              <button
                type="button"
                onClick={() => setActivePlayer(initialPlayer)}
                className="mb-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-700 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>Back to {initialPlayer.name}</span>
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getPosBadgeClasses(
                  activePlayer.position
                )}`}
              >
                {activePlayer.position}
              </span>
              <h2
                id="modalPlayerName"
                className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
              >
                {activePlayer.full_name || activePlayer.name}
              </h2>
              <span className="text-base sm:text-lg font-bold text-emerald-700">
                £{activePlayer.price.toFixed(1)}m
              </span>
              {isDifferential ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20"
                  title="Differential player with under 5% ownership"
                >
                  <span>{activePlayer.selected_by_percent.toFixed(1)}% Own</span>
                  <span>🎯</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                  {activePlayer.selected_by_percent.toFixed(1)}% Own
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{activePlayer.team}</span>
              {" • "}
              <span>Next: {fixtures?.[0]?.opponent || "TBD"}</span>
              {" • "}
              <span>Start: {activePlayer.start_prob ?? 100}%</span>
              {" • "}
              <span>Form: {activePlayer.form ?? 0.0}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Key Projections Grid */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Key Monte Carlo Projections ({gwLabel})
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/80">
                  Expected Pts
                </div>
                <div className="mt-1 text-xl font-extrabold text-emerald-700">
                  {activePlayer.xp.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  P10 Floor (Safe)
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold text-rose-600">
                  {activePlayer.floor.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  P50 Median
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold text-slate-800">
                  {median.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  P90 Ceiling
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold text-amber-600">
                  {activePlayer.ceiling.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-pink-800/80">
                  Haul Rate (≥10)
                </div>
                <div className="mt-1 text-xl font-extrabold text-pink-600">
                  {activePlayer.haul_prob.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-800/80">
                  DefCon Rate (+2)
                </div>
                <div className="mt-1 text-xl font-extrabold text-sky-600">
                  {activePlayer.defcon_prob.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Probability Distribution Chart Toggle & Container */}
          <div>
            <button
              type="button"
              onClick={() => setShowDistribution((prev) => !prev)}
              className="group flex w-full items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/70 px-4 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
              aria-expanded={showDistribution}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>
                  {showDistribution ? "Hide" : "Show"} Monte Carlo Point Distribution ({gwLabel} • 10,000 Simulations)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-normal text-slate-400 group-hover:text-slate-600 transition-colors">
                <span>{showDistribution ? "Click to collapse" : "Click to view chart"}</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    showDistribution ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {showDistribution && (
              <div className="mt-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 shadow-xs animate-in fade-in duration-150">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Monte Carlo Point Distribution ({gwLabel} • 10,000 Simulations)
                  </span>
                  <span className="text-xs font-medium text-emerald-800">
                    {activePlayer.sigma !== undefined && (
                      <span>Vol: ±{activePlayer.sigma.toFixed(2)} pts | </span>
                    )}
                    <span>
                      Range: {minScore} - {maxScore} pts (10,000 simulations)
                    </span>
                  </span>
                </div>

                {hasDistribution ? (
                  <div className="mt-3 w-full overflow-hidden">
                    <svg
                      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
                      className="w-full h-auto select-none"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* Baseline axis */}
                      <line
                        x1={padLeft}
                        y1={padTop + plotHeight}
                        x2={viewBoxWidth - padRight}
                        y2={padTop + plotHeight}
                        stroke="#cbd5e1"
                        strokeWidth={1}
                      />

                      {/* Floor P10 vertical line */}
                      <line
                        x1={p10X}
                        y1={padTop}
                        x2={p10X}
                        y2={padTop + plotHeight}
                        stroke="#f43f5e"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                      />
                      <text
                        x={p10X}
                        y={padTop - 8}
                        textAnchor="middle"
                        fill="#f43f5e"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        P10 Floor: {floor.toFixed(1)}
                      </text>

                      {/* Median P50 vertical line */}
                      <line
                        x1={medX}
                        y1={padTop}
                        x2={medX}
                        y2={padTop + plotHeight}
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                      <text
                        x={medX}
                        y={padTop - 8}
                        textAnchor="middle"
                        fill="#047857"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        Median: {median.toFixed(1)}
                      </text>

                      {/* Ceiling P90 vertical line */}
                      <line
                        x1={p90X}
                        y1={padTop}
                        x2={p90X}
                        y2={padTop + plotHeight}
                        stroke="#f59e0b"
                        strokeDasharray="3 3"
                        strokeWidth={1.5}
                      />
                      <text
                        x={p90X}
                        y={padTop - 8}
                        textAnchor="middle"
                        fill="#b45309"
                        fontSize={10}
                        fontWeight="bold"
                      >
                        P90 Ceiling: {ceiling.toFixed(1)}
                      </text>

                      {/* Probability Bars */}
                      {scores.map((score) => {
                        const prob = distMap[score] || 0;
                        const barHeight = (prob / maxProb) * plotHeight;
                        const x =
                          padLeft +
                          ((score - minScore) / (maxScore - minScore)) *
                            (plotWidth - barWidth);
                        const y = padTop + plotHeight - barHeight;

                        const isFloor = Math.abs(score - floor) < 0.5;
                        const isMed = Math.abs(score - median) < 0.5;
                        const isCeil = Math.abs(score - ceiling) < 0.5;

                        let fill = "#34d399";
                        if (isFloor) fill = "#fb7185";
                        else if (isCeil) fill = "#fbbf24";
                        else if (isMed) fill = "#059669";

                        return (
                          <g key={score} className="group">
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={Math.max(2, barHeight)}
                              fill={fill}
                              rx={1.5}
                              className="transition-opacity hover:opacity-80"
                            >
                              <title>{`Score ${score} pts: ${(
                                prob * 100
                              ).toFixed(1)}%`}</title>
                            </rect>
                            <text
                              x={x + barWidth / 2}
                              y={padTop + plotHeight + 14}
                              textAnchor="middle"
                              fill="#64748b"
                              fontSize={9}
                            >
                              {score}
                            </text>
                            {prob > maxProb * 0.25 && (
                              <text
                                x={x + barWidth / 2}
                                y={y - 4}
                                textAnchor="middle"
                                fill="#475569"
                                fontSize={8}
                                fontWeight="bold"
                              >
                                {(prob * 100).toFixed(0)}%
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Distribution data not available for this player.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Similar Price Point Alternatives (±£0.5m) */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Similar Price Alternatives
                  </h3>
                  {alternativesData?.bracket_label && (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200/80">
                      {alternativesData.bracket_label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alternative {activePlayer.position}s at a similar price point. Compare safe template, high upside haul, and balanced optimized picks. Click any card to inspect.
                </p>
              </div>

              {loadingAlternatives && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                  <span>Loading...</span>
                </div>
              )}
            </div>

            {alternativesData && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* 1. Safe "Template" Pick */}
                {alternativesData.template && (
                  <button
                    type="button"
                    onClick={() => setActivePlayer(alternativesData.template!.player)}
                    className="group flex flex-col justify-between rounded-xl border border-blue-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-blue-500 hover:shadow-md cursor-pointer text-left focus:outline-none"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 border border-blue-200">
                          <Users className="h-3 w-3" />
                          Safe &quot;Template&quot;
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          £{alternativesData.template.player.price.toFixed(1)}m{" "}
                          <span className="text-[10px] text-slate-400">
                            ({alternativesData.template.cost_diff > 0 ? `+£${alternativesData.template.cost_diff}m` : alternativesData.template.cost_diff < 0 ? `-£${Math.abs(alternativesData.template.cost_diff)}m` : "Same"})
                          </span>
                        </span>
                      </div>

                      <div className="mt-2.5 font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                        {alternativesData.template.player.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {alternativesData.template.player.position} • {alternativesData.template.player.team}
                      </div>

                      <div className="mt-2.5 rounded-lg bg-blue-50/60 p-2 border border-blue-100 text-xs">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-blue-600">
                          {alternativesData.template.badge}
                        </div>
                        <div className="font-bold text-blue-950 mt-0.5">
                          {alternativesData.template.key_stat}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-emerald-700">
                          {alternativesData.template.player.xp.toFixed(1)} xP
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({alternativesData.template.xp_diff >= 0 ? `+${alternativesData.template.xp_diff}` : alternativesData.template.xp_diff} vs cur)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                )}

                {/* 2. High Upside "Haul" Potential */}
                {alternativesData.haul && (
                  <button
                    type="button"
                    onClick={() => setActivePlayer(alternativesData.haul!.player)}
                    className="group flex flex-col justify-between rounded-xl border border-purple-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-purple-500 hover:shadow-md cursor-pointer text-left focus:outline-none"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-700 border border-purple-200">
                          <Zap className="h-3 w-3" />
                          High Upside &quot;Haul&quot;
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          £{alternativesData.haul.player.price.toFixed(1)}m{" "}
                          <span className="text-[10px] text-slate-400">
                            ({alternativesData.haul.cost_diff > 0 ? `+£${alternativesData.haul.cost_diff}m` : alternativesData.haul.cost_diff < 0 ? `-£${Math.abs(alternativesData.haul.cost_diff)}m` : "Same"})
                          </span>
                        </span>
                      </div>

                      <div className="mt-2.5 font-bold text-sm text-slate-900 group-hover:text-purple-600 transition-colors">
                        {alternativesData.haul.player.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {alternativesData.haul.player.position} • {alternativesData.haul.player.team}
                      </div>

                      <div className="mt-2.5 rounded-lg bg-purple-50/60 p-2 border border-purple-100 text-xs">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-purple-600">
                          {alternativesData.haul.badge}
                        </div>
                        <div className="font-bold text-purple-950 mt-0.5">
                          {alternativesData.haul.key_stat}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-emerald-700">
                          {alternativesData.haul.player.xp.toFixed(1)} xP
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({alternativesData.haul.xp_diff >= 0 ? `+${alternativesData.haul.xp_diff}` : alternativesData.haul.xp_diff} vs cur)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                )}

                {/* 3. Balanced "Optimized" Pick */}
                {alternativesData.optimized && (
                  <button
                    type="button"
                    onClick={() => setActivePlayer(alternativesData.optimized!.player)}
                    className="group flex flex-col justify-between rounded-xl border border-emerald-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-emerald-500 hover:shadow-md cursor-pointer text-left focus:outline-none"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 border border-emerald-200">
                          <TrendingUp className="h-3 w-3" />
                          Balanced &quot;Optimized&quot;
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          £{alternativesData.optimized.player.price.toFixed(1)}m{" "}
                          <span className="text-[10px] text-slate-400">
                            ({alternativesData.optimized.cost_diff > 0 ? `+£${alternativesData.optimized.cost_diff}m` : alternativesData.optimized.cost_diff < 0 ? `-£${Math.abs(alternativesData.optimized.cost_diff)}m` : "Same"})
                          </span>
                        </span>
                      </div>

                      <div className="mt-2.5 font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {alternativesData.optimized.player.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {alternativesData.optimized.player.position} • {alternativesData.optimized.player.team}
                      </div>

                      <div className="mt-2.5 rounded-lg bg-emerald-50/60 p-2 border border-emerald-100 text-xs">
                        <div className="text-[9.5px] font-bold uppercase tracking-wider text-emerald-700">
                          {alternativesData.optimized.badge}
                        </div>
                        <div className="font-bold text-emerald-950 mt-0.5">
                          {alternativesData.optimized.key_stat}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-black text-emerald-700">
                          {alternativesData.optimized.player.xp.toFixed(1)} xP
                        </span>
                        <span className="ml-1 text-[10px] text-slate-400">
                          ({alternativesData.optimized.xp_diff >= 0 ? `+${alternativesData.optimized.xp_diff}` : alternativesData.optimized.xp_diff} vs cur)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 group-hover:translate-x-0.5 transition-transform">
                        <span>Inspect</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Gameweek History (Last 5 GWs) */}
          <div>
            <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Gameweek History (Last 5 GWs)
              </h3>
              {/* Icon Legend / Key */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1 text-[11px] text-slate-600">
                <span className="font-bold uppercase tracking-wider text-slate-400">Key:</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Clock className="h-3 w-3 text-slate-400" /> Mins
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Target className="h-3 w-3 text-emerald-600" /> Goals
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <ShieldCheck className="h-3 w-3 text-indigo-600" /> CS Pts
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Shield className="h-3 w-3 text-sky-600" /> DefCon
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-400" /> Bonus
                </span>
              </div>
            </div>

            {recentMatches && recentMatches.length > 0 ? (
              <div
                className={`grid gap-2.5 ${
                  recentMatches.length <= 3
                    ? "grid-cols-1 sm:grid-cols-3"
                    : recentMatches.length === 4
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5"
                }`}
              >
                {recentMatches.map((m: PlayerHistoryMatch, idx: number) => {
                  const csPoints = getCleanSheetPoints(
                    activePlayer.position,
                    m.clean_sheets,
                    m.minutes
                  );

                  return (
                    <div
                      key={idx}
                      className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs"
                    >
                      <div>
                        {/* Card Header: GW + Opponent & Total Points */}
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                              GW{m.round}
                            </span>
                            <span
                              title={`${m.opponent_name} (${m.was_home ? "Home" : "Away"})`}
                              className="truncate rounded border border-slate-200/80 bg-slate-50 px-1.5 py-0.5 text-xs font-semibold text-slate-700"
                            >
                              {m.opponent_short} ({m.was_home ? "H" : "A"})
                            </span>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-extrabold ${
                              m.total_points >= 8
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300/80"
                                : m.total_points >= 4
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : m.total_points > 1
                                ? "bg-slate-100 text-slate-700 border border-slate-200"
                                : "bg-slate-50 text-slate-500 border border-slate-200"
                            }`}
                          >
                            {m.total_points} pts
                          </span>
                        </div>

                        {/* Match Score (if recorded) */}
                        {m.team_h_score !== null && m.team_a_score !== null && (
                          <div className="mt-1 text-[11px] text-slate-400">
                            Match: {m.was_home ? `${m.team_h_score} - ${m.team_a_score}` : `${m.team_a_score} - ${m.team_h_score}`}
                          </div>
                        )}
                      </div>

                      {/* Stat Metrics Grid with Icons */}
                      <div className="mt-2.5 grid grid-cols-2 gap-x-2 gap-y-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
                        <div className="flex items-center gap-1.5" title="Minutes played">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="font-mono font-bold text-slate-700">{m.minutes}&apos;</span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Goals scored">
                          <Target className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span className={`font-mono font-bold ${m.goals_scored > 0 ? "text-emerald-700 font-extrabold" : "text-slate-600"}`}>
                            {m.goals_scored}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1.5"
                          title={
                            activePlayer.position === "FWD"
                              ? "Clean sheets award 0 pts to forwards"
                              : `Clean Sheet: +${csPoints} pts (${m.clean_sheets ? "clean sheet kept" : "no clean sheet"})`
                          }
                        >
                          <ShieldCheck className={`h-3.5 w-3.5 shrink-0 ${csPoints > 0 ? "text-indigo-600" : "text-slate-300"}`} />
                          <span className={`font-mono font-bold ${csPoints > 0 ? "text-indigo-700 font-extrabold" : "text-slate-400"}`}>
                            {csPoints > 0 ? `+${csPoints} CS` : activePlayer.position === "FWD" ? "- CS" : "0 CS"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5" title="Defensive Contribution actions">
                          <Shield className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                          <span className={`font-mono font-bold ${m.defensive_contribution >= 10 ? "text-sky-700 font-extrabold" : "text-slate-600"}`}>
                            {m.defensive_contribution}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-between border-t border-slate-200/50 pt-1" title="Bonus points awarded">
                          <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <Star className={`h-3.5 w-3.5 shrink-0 ${m.bonus > 0 ? "text-amber-500 fill-amber-400" : "text-slate-300"}`} />
                            Bonus:
                          </span>
                          <span className={`font-mono font-bold ${m.bonus > 0 ? "text-amber-600 font-extrabold" : "text-slate-400"}`}>
                            {m.bonus > 0 ? `+${m.bonus} pts` : "0 pts"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No match appearances recorded in the last 5 gameweeks.
              </div>
            )}
          </div>

          {/* Upcoming Fixture Schedule */}
          <div>
            <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Upcoming Fixture Schedule (Next 5 GWs)
            </h3>
            {fixtures && fixtures.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {fixtures.map((f: PlayerFixture, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        title={`GW${f.event || ""}: ${f.opponent_name} (FDR ${f.fdr})`}
                        className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold leading-none ${getFdrClasses(
                          f.fdr
                        )}`}
                      >
                        {f.opponent}
                      </span>
                      <span className="text-xs font-bold text-emerald-700">
                        {f.match_xp.toFixed(1)} xP
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {activePlayer.position !== "FWD"
                          ? `CS: ${f.cs_prob}%`
                          : "CS: N/A (0 pts)"}
                      </span>
                      <span>DefCon: {f.defcon_prob}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400">
                No upcoming fixtures scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 sm:px-6 bg-slate-50/50">
          <div className="text-[11px] text-slate-400">
            Click outside or press <kbd className="rounded border border-slate-200 bg-white px-1 py-0.5 font-mono text-[10px] text-slate-600">Esc</kbd> to close
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
