"use client";

import { useEffect, useRef, useState } from "react";
import { Player, PlayerFixture, PlayerHistoryMatch } from "@/types/player";
import { X, Clock, Target, Shield, Star } from "lucide-react";

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

export default function PlayerModal({
  player,
  gameweeks = 1,
  onClose,
}: PlayerModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Modal always displays the next 5 upcoming GW fixtures
  const fixtures =
    player.fixtures_5 && player.fixtures_5.length > 0
      ? player.fixtures_5
      : player.five_gw?.fixtures && player.five_gw.fixtures.length > 0
      ? player.five_gw.fixtures
      : player.fixtures || [];

  const gwLabel = gameweeks === 1 ? "Current GW" : `Next ${gameweeks} GWs`;

  // Player match history (last 5 gameweeks)
  const [fetchedHistory, setFetchedHistory] = useState<PlayerHistoryMatch[] | null>(null);

  useEffect(() => {
    if (player.history && player.history.length > 0) return;
    let active = true;
    fetch(`/api/player-history?id=${player.id}`)
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
  }, [player.id, player.history]);

  const history =
    player.history && player.history.length > 0
      ? player.history
      : fetchedHistory || [];

  const recentMatches = history.slice(-5);

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
  const distMap = player.distribution || {};
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
    player.median !== undefined ? player.median : player.xp;
  const floor = player.floor;
  const ceiling = player.ceiling;

  const getX = (val: number) =>
    padLeft +
    ((val - minScore) / (maxScore - minScore)) * (plotWidth - barWidth) +
    barWidth / 2;

  const p10X = getX(floor);
  const medX = getX(median);
  const p90X = getX(ceiling);

  const isDifferential = player.selected_by_percent < 5.0;

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
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${getPosBadgeClasses(
                  player.position
                )}`}
              >
                {player.position}
              </span>
              <h2
                id="modalPlayerName"
                className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
              >
                {player.full_name || player.name}
              </h2>
              <span className="text-base sm:text-lg font-bold text-emerald-700">
                £{player.price.toFixed(1)}m
              </span>
              {isDifferential ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20"
                  title="Differential player with under 5% ownership"
                >
                  <span>{player.selected_by_percent.toFixed(1)}% Own</span>
                  <span>🎯</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
                  {player.selected_by_percent.toFixed(1)}% Own
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
              <span className="font-semibold text-slate-700">{player.team}</span>
              {" • "}
              <span>Next: {fixtures?.[0]?.opponent || "TBD"}</span>
              {" • "}
              <span>Start: {player.start_prob ?? 100}%</span>
              {" • "}
              <span>Form: {player.form ?? 0.0}</span>
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
                  {player.xp.toFixed(2)}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  P10 Floor (Safe)
                </div>
                <div className="mt-1 font-mono text-xl font-extrabold text-rose-600">
                  {player.floor.toFixed(1)}
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
                  {player.ceiling.toFixed(1)}
                </div>
              </div>

              <div className="rounded-xl border border-pink-100 bg-pink-50/40 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-pink-800/80">
                  Haul Rate (≥10)
                </div>
                <div className="mt-1 text-xl font-extrabold text-pink-600">
                  {player.haul_prob.toFixed(1)}%
                </div>
              </div>

              <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-3 text-center shadow-xs">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-sky-800/80">
                  DefCon Rate (+2)
                </div>
                <div className="mt-1 text-xl font-extrabold text-sky-600">
                  {player.defcon_prob.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Probability Distribution Chart */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-200/60">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Monte Carlo Point Distribution ({gwLabel} • 10,000 Simulations)
              </span>
              <span className="text-xs font-medium text-emerald-800">
                {player.sigma !== undefined && (
                  <span>Vol: ±{player.sigma.toFixed(2)} pts | </span>
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
                    Floor {floor.toFixed(1)}
                  </text>

                  {/* Median P50 vertical line */}
                  <line
                    x1={medX}
                    y1={padTop}
                    x2={medX}
                    y2={padTop + plotHeight}
                    stroke="#059669"
                    strokeWidth={2}
                  />
                  <text
                    x={medX}
                    y={padTop - 8}
                    textAnchor="middle"
                    fill="#059669"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    Median {median.toFixed(1)}
                  </text>

                  {/* Ceiling P90 vertical line */}
                  <line
                    x1={p90X}
                    y1={padTop}
                    x2={p90X}
                    y2={padTop + plotHeight}
                    stroke="#d97706"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                  <text
                    x={p90X}
                    y={padTop - 8}
                    textAnchor="middle"
                    fill="#d97706"
                    fontSize={10}
                    fontWeight="bold"
                  >
                    Ceiling {ceiling.toFixed(1)}
                  </text>

                  {/* Frequency bars */}
                  {scores.map((s) => {
                    const prob = distMap[s] || 0;
                    const x =
                      padLeft +
                      ((s - minScore) / (maxScore - minScore)) *
                        (plotWidth - barWidth);
                    const bHeight = Math.max(
                      2,
                      (prob / maxProb) * plotHeight
                    );
                    const y = padTop + plotHeight - bHeight;

                    const isHaul = s >= 10;
                    const isSolid = s >= 5;
                    const fillColor = isHaul
                      ? "#ec4899"
                      : isSolid
                      ? "#10b981"
                      : "#94a3b8";

                    const showLabel =
                      numBins <= 25
                        ? true
                        : s % 2 === 0 || s === minScore || s === maxScore;

                    return (
                      <g key={s}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={bHeight}
                          rx={1.5}
                          fill={fillColor}
                          className="transition-opacity hover:opacity-80 cursor-pointer"
                        >
                          <title>
                            Score: {s} pts | Prob: {(prob * 100).toFixed(1)}%
                          </title>
                        </rect>
                        {showLabel && (
                          <text
                            x={x + barWidth / 2}
                            y={viewBoxHeight - 10}
                            textAnchor="middle"
                            fill="#64748b"
                            fontSize={9.5}
                          >
                            {s}
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

          {/* Recent Gameweek History (Last 5 GWs) */}
          <div>
            <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Gameweek History (Last 5 GWs)
              </h3>
              {/* Icon Legend / Key */}
              <div className="flex flex-wrap items-center gap-2.5 rounded-lg border border-slate-200/70 bg-slate-50/80 px-2.5 py-1 text-[11px] text-slate-600">
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
                {recentMatches.map((m: PlayerHistoryMatch, idx: number) => (
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
                    <div className="mt-2.5 grid grid-cols-2 gap-1.5 rounded-lg border border-slate-100 bg-slate-50/70 p-2 text-xs">
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
                      <div className="flex items-center gap-1.5" title="Defensive Contribution actions">
                        <Shield className="h-3.5 w-3.5 shrink-0 text-sky-600" />
                        <span className={`font-mono font-bold ${m.defensive_contribution >= 10 ? "text-sky-700 font-extrabold" : "text-slate-600"}`}>
                          {m.defensive_contribution}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Bonus points awarded">
                        <Star className={`h-3.5 w-3.5 shrink-0 ${m.bonus > 0 ? "text-amber-500 fill-amber-400" : "text-slate-300"}`} />
                        <span className={`font-mono font-bold ${m.bonus > 0 ? "text-amber-600 font-extrabold" : "text-slate-500"}`}>
                          {m.bonus > 0 ? `+${m.bonus}` : "0"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
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
                        {player.position !== "FWD"
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
