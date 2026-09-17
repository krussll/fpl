"use client";

import { useState, useEffect } from "react";
import { OptimalSquad, SquadPlayer, Player } from "@/types/player";
import PlayerModal from "./PlayerModal";
import { getTeamKit } from "@/utils/teamColors";
import {
  Sparkles,
  Coins,
  Shield,
  Crown,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  AlertCircle,
  TrendingUp,
  Info,
  Calendar,
  Wallet,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";

function getFdrColor(fdr: number = 3): { bg: string; text: string; border: string } {
  switch (fdr) {
    case 1:
    case 2:
      return { bg: "bg-emerald-500", text: "text-white", border: "border-emerald-600" };
    case 3:
      return { bg: "bg-slate-500", text: "text-white", border: "border-slate-600" };
    case 4:
      return { bg: "bg-rose-500", text: "text-white", border: "border-rose-600" };
    case 5:
      return { bg: "bg-red-900", text: "text-white", border: "border-red-950" };
    default:
      return { bg: "bg-slate-500", text: "text-white", border: "border-slate-600" };
  }
}

// Authentic Soccer Jersey / Kit SVG matching club's outfield or goalkeeper shirt
function JerseyIcon({
  team,
  position,
  isCaptain,
  isViceCaptain,
  size = "md",
}: {
  team?: string | number;
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const isGoalkeeper = position === "GKP";
  const kit = getTeamKit(team, isGoalkeeper);

  const sizeClasses =
    size === "sm"
      ? "h-6 w-6"
      : size === "lg"
      ? "h-12 w-12 sm:h-14 sm:w-14"
      : "h-10 w-10 sm:h-12 sm:w-12";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 48 48"
        className={`${sizeClasses} drop-shadow-md transition-transform duration-200 group-hover:scale-110`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Shirt Body */}
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          fill={kit.primary}
        />

        {/* Sleeves (if contrasting secondary color) */}
        {kit.secondary !== kit.primary && (
          <>
            <path
              d="M15 10L10 17L15 22L17 17L17.2 11.2Z"
              fill={kit.secondary}
            />
            <path
              d="M33 10L38 17L33 22L31 17L30.8 11.2Z"
              fill={kit.secondary}
            />
          </>
        )}

        {/* Vertical stripes for striped clubs */}
        {kit.pattern === "striped" && (
          <g stroke={kit.patternColor || kit.secondary} strokeWidth="2.4" strokeLinecap="butt">
            <line x1="21.5" y1="14" x2="21.5" y2="38" />
            <line x1="26.5" y1="14" x2="26.5" y2="38" />
          </g>
        )}

        {/* Collar trim */}
        <path
          d="M20 13C22 14 26 14 28 13"
          stroke={kit.secondary !== kit.primary ? kit.secondary : "#ffffff"}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      {/* Captain / Vice Captain Armband Overlay */}
      {isCaptain && (
        <span
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-amber-950 shadow-md ring-1 ring-amber-500/50"
          title="Captain (2x Points)"
        >
          C
        </span>
      )}
      {isViceCaptain && (
        <span
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-[9px] font-black text-slate-800 shadow-md ring-1 ring-slate-400/50"
          title="Vice-Captain"
        >
          V
        </span>
      )}
    </div>
  );
}

// Starting Pitch Player Card
function PitchPlayerCard({
  player,
  onClick,
  horizon = 1,
}: {
  player: SquadPlayer;
  onClick: () => void;
  horizon?: number;
}) {
  const fix = player.fixtures?.[0];
  const fdrColors = getFdrColor(fix?.fdr);
  const isMultiHorizon = horizon > 1;
  const displayXp = Number(player.xp || 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center focus:outline-none"
    >
      <div className="relative mb-0.5 sm:mb-1">
        <JerseyIcon
          team={player.team_id || player.team}
          position={player.position}
          isCaptain={player.is_captain}
          isViceCaptain={player.is_vice_captain}
          size="md"
        />
      </div>

      <div className="flex w-[82px] sm:w-[94px] flex-col overflow-hidden rounded-md bg-slate-900/90 text-center shadow-md ring-1 ring-white/20 backdrop-blur-xs transition-transform duration-150 group-hover:scale-105 group-hover:ring-emerald-400">
        <div className="truncate px-1 pt-1 pb-0.5 text-[11px] sm:text-xs font-bold text-white">
          {player.name}
        </div>

        {/* Fixture pill(s) */}
        {isMultiHorizon && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="flex w-full items-center justify-between border-t border-white/10 text-[7.5px] sm:text-[8px] font-bold">
            {player.fixtures.slice(0, horizon).map((f, i) => {
              const c = getFdrColor(f.fdr);
              const shortOpp = f.opponent
                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                : `GW${f.event}`;
              return (
                <span
                  key={i}
                  title={`${f.opponent} (FDR ${f.fdr}) • GW${f.event}`}
                  className={`flex-1 py-0.5 text-center ${c.bg} text-white ${
                    i > 0 ? "border-l border-white/20" : ""
                  }`}
                >
                  {shortOpp}
                </span>
              );
            })}
          </div>
        ) : fix ? (
          <div
            className={`flex w-full items-center justify-center gap-1 border-t border-white/10 ${fdrColors.bg} px-1 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider`}
          >
            <span>{fix.opponent}</span>
          </div>
        ) : null}

        {/* Points & Price pill */}
        <div className="flex w-full items-center justify-between bg-white px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">
          <span className="text-emerald-700">
            {displayXp.toFixed(1)}{" "}
            <span className="text-[8.5px] font-normal text-slate-500">
              {isMultiHorizon ? "tot" : "xP"}
            </span>
          </span>
          <span className="text-slate-500 text-[9.5px]">£{player.price.toFixed(1)}m</span>
        </div>
      </div>
    </button>
  );
}

// Bench Substitute Card
function BenchPlayerCard({
  player,
  slotLabel,
  onClick,
  horizon = 1,
}: {
  player: SquadPlayer;
  slotLabel: string;
  onClick: () => void;
  horizon?: number;
}) {
  const fix = player.fixtures?.[0];
  const fdrColors = getFdrColor(fix?.fdr);
  const isMultiHorizon = horizon > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center rounded-2xl border border-slate-200/90 bg-white/95 p-2 sm:p-3 shadow-xs transition-all hover:border-emerald-500 hover:shadow-md focus:outline-none"
    >
      <span className="mb-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
        {slotLabel}
      </span>

      <JerseyIcon
        team={player.team_id || player.team}
        position={player.position}
        size="sm"
      />

      <div className="mt-1 w-full text-center">
        <div className="truncate text-xs font-bold text-slate-900 group-hover:text-emerald-700">
          {player.name}
        </div>
        <div className="text-[10px] font-medium text-slate-500">
          {player.position} • {player.team}
        </div>

        {/* Fixtures pill */}
        {isMultiHorizon && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="mt-1 flex w-full items-center justify-center overflow-hidden rounded text-[7px] font-bold">
            {player.fixtures.slice(0, horizon).map((f, i) => {
              const c = getFdrColor(f.fdr);
              const shortOpp = f.opponent
                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                : `GW${f.event}`;
              return (
                <span
                  key={i}
                  title={`${f.opponent} (FDR ${f.fdr})`}
                  className={`flex-1 py-0.5 text-center ${c.bg} text-white`}
                >
                  {shortOpp}
                </span>
              );
            })}
          </div>
        ) : fix ? (
          <div
            className={`mt-1 rounded px-1.5 py-0.5 text-[9px] font-semibold ${fdrColors.bg} text-white`}
          >
            {fix.opponent}
          </div>
        ) : null}

        <div className="mt-1 flex items-center justify-between border-t border-slate-100 pt-1 text-[10px]">
          <span className="font-bold text-emerald-700">
            {player.xp.toFixed(1)} {isMultiHorizon ? "tot" : "xP"}
          </span>
          <span className="font-semibold text-slate-500">£{player.price.toFixed(1)}m</span>
        </div>
      </div>
    </button>
  );
}

const BUDGET_PRESETS = [94.0, 96.0, 97.5, 99.0, 100.0, 102.0, 104.0];

export default function BudgetOptimizerView() {
  const [budgetInput, setBudgetInput] = useState<number>(97.5);
  const [activeHorizon, setActiveHorizon] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"pitch" | "table">("pitch");

  const [squad, setSquad] = useState<OptimalSquad | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchOptimalSquad = async (b: number, h: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/budget-optimizer?budget=${b}&horizon=${h}`);
      if (!res.ok) {
        throw new Error(`Optimization failed with status ${res.status}`);
      }
      const data = (await res.json()) as OptimalSquad;
      setSquad(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to solve optimal squad.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptimalSquad(budgetInput, activeHorizon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeHorizon]);

  const handleApplyBudget = (newBudget: number) => {
    const clamped = Math.max(70.0, Math.min(115.0, Math.round(newBudget * 10) / 10));
    setBudgetInput(clamped);
    fetchOptimalSquad(clamped, activeHorizon);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOptimalSquad(budgetInput, activeHorizon);
  };

  const isMultiHorizon = activeHorizon > 1;

  return (
    <div className="space-y-8">
      {/* Interactive Controls Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            {/* Budget Input & Slider */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="budget-input"
                  className="flex items-center gap-2 text-sm font-bold text-slate-900"
                >
                  <Wallet className="h-4 w-4 text-[#FE5803]" />
                  <span>Max Team Value / Budget</span>
                </label>
                <span className="text-xs text-slate-500">
                  Range: £70.0m – £115.0m
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative w-36 shrink-0">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 font-bold">
                    £
                  </div>
                  <input
                    id="budget-input"
                    type="number"
                    step="0.1"
                    min="70.0"
                    max="115.0"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(parseFloat(e.target.value) || 100.0)}
                    className="block w-full rounded-xl border border-slate-300 py-2.5 pl-7 pr-8 text-base font-bold text-slate-900 shadow-inner focus:border-[#FE5803] focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 font-bold text-xs">
                    m
                  </div>
                </div>

                <div className="flex-1">
                  <input
                    type="range"
                    min="80.0"
                    max="108.0"
                    step="0.1"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#FE5803]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>£80.0m</span>
                    <span>£95.0m (Sub-100m)</span>
                    <span>£100.0m</span>
                    <span>£108.0m</span>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Presets:
                </span>
                {BUDGET_PRESETS.map((p) => {
                  const isSelected = Math.abs(budgetInput - p) < 0.05;
                  const isSub100 = p < 100.0;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleApplyBudget(p)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#FE5803] text-white shadow-xs"
                          : isSub100
                          ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      £{p.toFixed(1)}m
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horizon Tabs & Submit Button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex rounded-xl bg-slate-100 p-1">
                {[
                  { h: 1, label: "Next 1 GW" },
                  { h: 3, label: "Next 3 GWs" },
                  { h: 5, label: "Next 5 GWs" },
                ].map((tab) => {
                  const isActive = activeHorizon === tab.h;
                  return (
                    <button
                      key={tab.h}
                      type="button"
                      onClick={() => setActiveHorizon(tab.h)}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-white text-[#FE5803] shadow-xs font-extrabold"
                          : "text-slate-600 hover:text-[#FE5803]"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FE5803] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-500/20 hover:bg-[#DE4902] transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Solving...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Optimize Squad</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading state */}
      {loading && !squad && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-20 text-center shadow-xs">
          <Loader2 className="h-9 w-9 animate-spin text-[#FE5803]" />
          <h3 className="mt-4 text-base font-bold text-slate-800">
            Solving Optimal Squad for £{budgetInput.toFixed(1)}m...
          </h3>
          <p className="mt-1 text-xs text-slate-400">
            Evaluating 7 FPL formations and optimizing starting XI points under team & goalkeeper constraints
          </p>
        </div>
      )}

      {/* Error state */}
      {error && !squad && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
          <p className="mt-2 text-sm font-semibold text-rose-900">{error}</p>
          <button
            type="button"
            onClick={() => fetchOptimalSquad(budgetInput, activeHorizon)}
            className="mt-4 inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Squad Results View */}
      {squad && (
        <div className="space-y-6">
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                <span>Max Budget</span>
              </div>
              <div className="mt-1.5 text-xl font-black text-slate-900">
                £{squad.budget.toFixed(1)}m
              </div>
              <div className="text-[11px] text-slate-400 font-medium">User limit</div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Coins className="h-3.5 w-3.5 text-teal-600" />
                <span>Squad Cost</span>
              </div>
              <div className="mt-1.5 text-xl font-black text-slate-900">
                £{squad.total_cost.toFixed(1)}m
              </div>
              <div className="text-[11px] font-semibold text-emerald-700">
                £{squad.bank_remaining.toFixed(1)}m in bank
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <span>Starting XI xP</span>
              </div>
              <div className="mt-1.5 text-xl font-black text-emerald-600">
                {squad.starting_xi_xp.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                {isMultiHorizon ? `avg ${(squad.starting_xi_xp / activeHorizon).toFixed(1)}/GW` : "base points"}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>With Captain (2x)</span>
              </div>
              <div className="mt-1.5 text-xl font-black text-amber-600">
                {squad.total_match_xp.toFixed(1)}
              </div>
              <div className="text-[11px] text-slate-500 font-medium">
                +{squad.captain?.xp.toFixed(1)} bonus
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <LayoutGrid className="h-3.5 w-3.5 text-indigo-600" />
                <span>Formation</span>
              </div>
              <div className="mt-1.5 text-xl font-black text-slate-900">
                {squad.formation}
              </div>
              <div className="text-[11px] text-slate-400 font-medium">FPL valid</div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <Crown className="h-3.5 w-3.5 text-amber-500" />
                <span>Talisman (C)</span>
              </div>
              <div className="mt-1.5 truncate text-sm font-black text-slate-900">
                {squad.captain?.name}
              </div>
              <div className="truncate text-[11px] text-slate-500 font-medium">
                vs {squad.captain?.opponent}
              </div>
            </div>
          </div>

          {/* View Toggle Bar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{squad.title}</h2>
              <p className="text-xs text-slate-500">
                Click any player card to inspect historical match performance, fixtures, and simulation distribution.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setViewMode("pitch")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "pitch"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Pitch</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Pitch & Bench View */}
          {viewMode === "pitch" ? (
            <div className="space-y-6">
              {/* Pitch Canvas */}
              <div className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-700/80 bg-emerald-800 shadow-xl shadow-emerald-950/20">
                {/* Authentic Grass Stripes Pattern */}
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, #ffffff, #ffffff 40px, transparent 40px, transparent 80px)",
                  }}
                />

                {/* Pitch Lines (Penalty boxes, center circle, half line) */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Half-way line */}
                  <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
                  {/* Top penalty box */}
                  <div className="absolute top-0 left-1/2 h-20 w-44 -translate-x-1/2 border-b border-x border-white/20 rounded-b-lg" />
                  {/* Bottom penalty box */}
                  <div className="absolute bottom-0 left-1/2 h-20 w-44 -translate-x-1/2 border-t border-x border-white/20 rounded-t-lg" />
                </div>

                {/* Starters Arranged By Line */}
                <div className="relative z-10 flex flex-col justify-between gap-6 px-3 py-8 sm:py-10">
                  {/* Goalkeeper Line */}
                  <div className="flex justify-center">
                    {squad.formation_lines.gkp.map((p) => (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        onClick={() => setSelectedPlayer(p)}
                        horizon={activeHorizon}
                      />
                    ))}
                  </div>

                  {/* Defender Line */}
                  <div className="flex flex-wrap items-center justify-around gap-2 sm:gap-4">
                    {squad.formation_lines.def.map((p) => (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        onClick={() => setSelectedPlayer(p)}
                        horizon={activeHorizon}
                      />
                    ))}
                  </div>

                  {/* Midfielder Line */}
                  <div className="flex flex-wrap items-center justify-around gap-2 sm:gap-4">
                    {squad.formation_lines.mid.map((p) => (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        onClick={() => setSelectedPlayer(p)}
                        horizon={activeHorizon}
                      />
                    ))}
                  </div>

                  {/* Forward Line */}
                  <div className="flex flex-wrap items-center justify-around gap-4 sm:gap-8">
                    {squad.formation_lines.fwd.map((p) => (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        onClick={() => setSelectedPlayer(p)}
                        horizon={activeHorizon}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Bench Lineup Section */}
              <div className="rounded-3xl border border-slate-200/90 bg-slate-50/70 p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Bench Lineup (Budget Enablers & Autosubs)
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Ordered by Autosub Priority
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {squad.bench.map((p, idx) => {
                    const slot =
                      p.position === "GKP" ? "GK Sub" : `Sub ${idx}`;
                    return (
                      <BenchPlayerCard
                        key={p.id}
                        player={p}
                        slotLabel={slot}
                        onClick={() => setSelectedPlayer(p)}
                        horizon={activeHorizon}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                    <tr>
                      <th className="py-3 pl-4 pr-2 font-semibold">Status</th>
                      <th className="px-2 py-3 font-semibold">Pos</th>
                      <th className="px-3 py-3 font-semibold">Player</th>
                      <th className="px-3 py-3 font-semibold">Club</th>
                      <th className="px-3 py-3 font-semibold text-right">Price</th>
                      <th className="px-3 py-3 font-semibold text-right">
                        {isMultiHorizon ? `${activeHorizon}-GW xP` : "xP"}
                      </th>
                      <th className="px-3 py-3 font-semibold text-right">PPM</th>
                      <th className="px-3 py-3 font-semibold text-right">Own%</th>
                      <th className="py-3 pl-3 pr-4 font-semibold">Upcoming Fixtures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[...squad.starters, ...squad.bench].map((p, i) => {
                      const isStarter = p.is_starter;
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedPlayer(p)}
                          className="cursor-pointer transition-colors hover:bg-slate-50"
                        >
                          <td className="py-3 pl-4 pr-2">
                            {isStarter ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                Starter
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                Bench ({p.bench_order || i - 10})
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-3 font-bold text-slate-900">{p.position}</td>
                          <td className="px-3 py-3 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {p.is_captain && (
                                <span className="rounded bg-amber-400 px-1 py-0.2 text-[9px] font-black text-amber-950">
                                  C
                                </span>
                              )}
                              {p.is_vice_captain && (
                                <span className="rounded bg-slate-200 px-1 py-0.2 text-[9px] font-black text-slate-800">
                                  VC
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-500">{p.team}</td>
                          <td className="px-3 py-3 text-right font-semibold text-slate-900">
                            £{p.price.toFixed(1)}m
                          </td>
                          <td className="px-3 py-3 text-right font-black text-emerald-600">
                            {p.xp.toFixed(1)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500">
                            {p.ppm.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-right text-slate-500">
                            {p.selected_by_percent?.toFixed(1)}%
                          </td>
                          <td className="py-3 pl-3 pr-4">
                            <div className="flex items-center gap-1">
                              {p.fixtures?.slice(0, activeHorizon).map((f, fIdx) => {
                                const c = getFdrColor(f.fdr);
                                return (
                                  <span
                                    key={fIdx}
                                    title={`${f.opponent} (FDR ${f.fdr})`}
                                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${c.bg}`}
                                  >
                                    {f.opponent}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Solver Notes & Strategy Card */}
          {squad.notes && squad.notes.length > 0 && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Optimization Insights (£{squad.budget.toFixed(1)}m Cap)
                </h3>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc text-xs leading-relaxed text-slate-600">
                {squad.notes.map((n, idx) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          gameweeks={activeHorizon}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
