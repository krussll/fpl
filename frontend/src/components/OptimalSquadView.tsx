"use client";

import { useState, useEffect } from "react";
import { OptimalSquad, SquadPlayer, Player } from "@/types/player";
import PlayerModal from "./PlayerModal";
import { getTeamKit } from "@/utils/teamColors";
import {
  Trophy,
  Crown,
  Shield,
  Coins,
  Sparkles,
  LayoutGrid,
  Table as TableIcon,
  Loader2,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Info,
  Calendar,
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

// Custom Soccer Jersey / Kit SVG matching club's authentic outfield or goalkeeper kit
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
            {/* Left sleeve */}
            <path
              d="M15 10L10 17L15 22L17 17L17.2 11.2Z"
              fill={kit.secondary}
            />
            {/* Right sleeve */}
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

        {/* Collar contour */}
        <path
          d="M20 13C22 15 26 15 28 13"
          stroke={kit.collar || "#ffffff"}
          strokeWidth="1.6"
          strokeLinecap="round"
        />

        {/* Outer border / seam stroke */}
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          stroke={kit.stroke || "#ffffff"}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Sleeve cuff accents */}
        <line
          x1="10.8"
          y1="17.8"
          x2="14.2"
          y2="21.2"
          stroke={kit.collar || kit.stroke || "#ffffff"}
          strokeWidth="1"
          strokeOpacity="0.8"
        />
        <line
          x1="37.2"
          y1="17.8"
          x2="33.8"
          y2="21.2"
          stroke={kit.collar || kit.stroke || "#ffffff"}
          strokeWidth="1"
          strokeOpacity="0.8"
        />
      </svg>

      {/* Captain / Vice Captain Badges */}
      {isCaptain && (
        <span
          title="Team Captain (Points Doubled)"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-extrabold text-[10px] text-slate-950 ring-2 ring-slate-900 shadow-md animate-pulse"
        >
          C
        </span>
      )}
      {isViceCaptain && !isCaptain && (
        <span
          title="Vice Captain"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 font-bold text-[10px] text-slate-900 ring-2 ring-slate-900 shadow-md"
        >
          V
        </span>
      )}
    </div>
  );
}

// Single Pitch Player Card
function PitchPlayerCard({
  player,
  isCaptain,
  isViceCaptain,
  onClick,
  horizon = 1,
}: {
  player: SquadPlayer;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick: () => void;
  horizon?: number;
}) {
  const fix = player.fixtures && player.fixtures.length > 0 ? player.fixtures[0] : null;
  const fdrColors = getFdrColor(fix?.fdr);
  const displayXp = isCaptain ? player.xp * 2 : player.xp;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 focus:outline-none cursor-pointer"
    >
      {/* Kit */}
      <JerseyIcon
        team={player.team}
        position={player.position}
        isCaptain={isCaptain}
        isViceCaptain={isViceCaptain}
      />

      {/* Nameplate (FPL Style) */}
      <div className="mt-1 flex w-[82px] sm:w-[96px] md:w-[108px] flex-col items-center overflow-hidden rounded-md bg-slate-950/90 text-white shadow-md ring-1 ring-white/20 backdrop-blur-xs transition-colors group-hover:bg-slate-900 group-hover:ring-emerald-400">
        <span className="w-full truncate px-1.5 py-0.5 text-[11px] sm:text-xs font-bold tracking-tight">
          {player.name}
        </span>

        {/* Fixture pill(s) */}
        {horizon > 1 && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="flex w-full items-center justify-between border-t border-white/10 text-[7px] sm:text-[8px] font-bold">
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
              {horizon > 1 ? "tot" : "xP"}
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
  const fix = player.fixtures && player.fixtures.length > 0 ? player.fixtures[0] : null;
  const fdrColors = getFdrColor(fix?.fdr);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-3 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md hover:bg-slate-50/80 cursor-pointer"
    >
      <div className="flex items-center gap-3">
        {/* Slot Order Badge */}
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200 group-hover:bg-emerald-50 group-hover:text-emerald-800 group-hover:ring-emerald-300">
          {slotLabel}
        </div>

        {/* Jersey icon */}
        <div className="shrink-0">
          <JerseyIcon team={player.team} position={player.position} />
        </div>

        {/* Name & Club */}
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
            {player.name}
          </div>
          <div className="text-[11px] text-slate-500">
            {player.team} • <span className="font-semibold">{player.position}</span>
          </div>
        </div>
      </div>

      {/* Opponent & xP */}
      <div className="flex flex-col items-end gap-1 text-right">
        {horizon > 1 && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="flex items-center gap-0.5">
            {player.fixtures.slice(0, horizon).map((f, i) => {
              const c = getFdrColor(f.fdr);
              const shortOpp = f.opponent
                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                : `GW${f.event}`;
              return (
                <span
                  key={i}
                  title={`${f.opponent} (FDR ${f.fdr}) • GW${f.event}`}
                  className={`rounded px-1 py-0.5 text-[8px] font-bold ${c.bg} text-white shadow-2xs`}
                >
                  {shortOpp}
                </span>
              );
            })}
          </div>
        ) : fix ? (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${fdrColors.bg} text-white shadow-2xs`}
          >
            {fix.opponent}
          </span>
        ) : null}
        <div className="text-xs font-bold text-emerald-800">
          {player.xp.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">xP</span>
          <span className="ml-1.5 text-[11px] font-medium text-slate-500">£{player.price.toFixed(1)}m</span>
        </div>
      </div>
    </button>
  );
}

export default function OptimalSquadView() {
  const [activeHorizon, setActiveHorizon] = useState<1 | 3 | 5>(1);
  const [squadsCache, setSquadsCache] = useState<Record<number, OptimalSquad>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pitch" | "table">("pitch");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    async function loadOptimalSquad(h: number) {
      if (squadsCache[h]) {
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/optimal-squad?horizon=${h}`);
        if (!res.ok) {
          throw new Error(`Failed to load squad for horizon ${h} (status ${res.status})`);
        }
        const data = (await res.json()) as OptimalSquad;
        setSquadsCache((prev) => ({ ...prev, [h]: data }));
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load optimal squad.");
      } finally {
        setLoading(false);
      }
    }

    loadOptimalSquad(activeHorizon);
  }, [activeHorizon, squadsCache]);

  const squad = squadsCache[activeHorizon];
  const isCurrentlyLoading = loading && !squad;

  if (isCurrentlyLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white p-20 text-center shadow-xs">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        <h3 className="mt-4 text-base font-bold text-slate-800">
          Running Squad Optimization Engine...
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Solving formation lines and maximizing Starting XI points under £100.0m cap
        </p>
      </div>
    );
  }

  if (error || !squad) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-600" />
        <p className="mt-2 text-sm font-semibold text-rose-900">
          {error || "Unable to load optimal squad."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-rose-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const {
    formation,
    starting_xi_xp,
    total_match_xp,
    full_squad_xp,
    total_cost,
    bank_remaining,
    captain,
    vice_captain,
    formation_lines,
    starters,
    bench,
  } = squad;

  return (
    <div className="space-y-6">
      {/* 1. Horizon Selection Tabs & View Switcher Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xs">
        {/* Horizon Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveHorizon(1)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeHorizon === 1
                ? "bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Sparkles className={`h-3.5 w-3.5 ${activeHorizon === 1 ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Current Gameweek</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                activeHorizon === 1
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              GW 4
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHorizon(3)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeHorizon === 3
                ? "bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Calendar className={`h-3.5 w-3.5 ${activeHorizon === 3 ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Next 3 Gameweeks</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                activeHorizon === 3
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              GW 4–6
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHorizon(5)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
              activeHorizon === 5
                ? "bg-white text-emerald-950 shadow-xs ring-1 ring-slate-200/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            }`}
          >
            <Calendar className={`h-3.5 w-3.5 ${activeHorizon === 5 ? "text-emerald-600" : "text-slate-400"}`} />
            <span>Next 5 Gameweeks</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                activeHorizon === 5
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              GW 4–8
            </span>
          </button>
        </div>

        {/* View Switcher: Pitch View vs Table View */}
        <div className="flex items-center gap-1 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setViewMode("pitch")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "pitch"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Pitch View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>List / Table</span>
          </button>
        </div>
      </div>

      {/* Horizon Subtitle Callout */}
      <div className="flex items-center justify-between rounded-xl bg-emerald-50/70 border border-emerald-200/70 px-4 py-2 text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10.5px] font-extrabold text-white">
            {activeHorizon === 5
              ? "Next 5 Gameweeks"
              : activeHorizon === 3
              ? "Next 3 Gameweeks"
              : "Gameweek 4 Focus"}
          </span>
          <span className="font-semibold text-emerald-950">
            {activeHorizon === 5
              ? "Long-term transfer horizon based on 10,000 Monte Carlo simulation runs per fixture (GW 4–8)"
              : activeHorizon === 3
              ? "Medium-term squad horizon based on 10,000 Monte Carlo simulation runs per fixture (GW 4–6)"
              : "Single gameweek optimization maximizing immediate points under official £100m cap"}
          </span>
        </div>
        <span className="hidden sm:inline text-[11px] font-medium text-emerald-800">
          {activeHorizon === 5
            ? "Horizon: 5 Fixtures"
            : activeHorizon === 3
            ? "Horizon: 3 Fixtures"
            : "Horizon: 1 Fixture"}
        </span>
      </div>

      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {/* 1. Match xP (Main KPI) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              {activeHorizon > 1 ? `${activeHorizon}-GW Match xP` : "Projected Match xP"}
            </span>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold tracking-tight text-emerald-950">
              {total_match_xp.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-emerald-700">pts</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-800/80">
            {activeHorizon > 1 ? (
              <>
                Avg <strong>{(total_match_xp / activeHorizon).toFixed(1)} pts/GW</strong> • XI ({starting_xi_xp.toFixed(1)}) + C 2x (+{captain?.xp.toFixed(1)})
              </>
            ) : (
              <>Starting XI ({starting_xi_xp.toFixed(1)}) + Captain 2x (+{captain?.xp.toFixed(1)})</>
            )}
          </p>
        </div>

        {/* 2. Formation */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Formation
            </span>
            <Shield className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-slate-900">
            {formation}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            11 Starters • 4 Subs ({full_squad_xp.toFixed(1)} total xP)
          </p>
        </div>

        {/* 3. Budget / Bank */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Squad Value
            </span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              £{total_cost.toFixed(1)}m
            </span>
            <span className="text-xs text-slate-400">/ £100m</span>
          </div>
          <p className="mt-1 text-[11px] font-medium text-emerald-800">
            £{bank_remaining.toFixed(1)}m in the bank (ITB)
          </p>
        </div>

        {/* 4. Captain Highlight */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Captain (2x)
            </span>
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <JerseyIcon
              team={captain?.team}
              position={captain?.position || "FWD"}
              size="sm"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-slate-900">
                {captain?.name}
              </div>
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-emerald-700">
                  {(captain.doubled_xp || captain.xp * 2).toFixed(1)} pts
                  {activeHorizon > 1 && (
                    <span className="text-[9.5px] font-normal text-slate-400 ml-1">
                      ({((captain.doubled_xp || captain.xp * 2) / activeHorizon).toFixed(1)}/GW)
                    </span>
                  )}
                </span>{" "}
                • {captain.opponent}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Vice-Captain Highlight */}
        <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vice-Captain
            </span>
            <Sparkles className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <JerseyIcon
              team={vice_captain?.team}
              position={vice_captain?.position || "MID"}
              size="sm"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-bold text-slate-900">
                {vice_captain?.name}
              </div>
              <p className="text-[11px] text-slate-500">
                <span className="font-semibold text-emerald-700">
                  {vice_captain?.xp.toFixed(1)} pts
                  {activeHorizon > 1 && (
                    <span className="text-[9.5px] font-normal text-slate-400 ml-1">
                      ({(vice_captain.xp / activeHorizon).toFixed(1)}/GW)
                    </span>
                  )}
                </span>{" "}
                • {vice_captain?.opponent}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Display: Pitch View vs Table View */}
      {viewMode === "pitch" ? (
        <div className="space-y-6">
          {/* THE SOCCER PITCH */}
          <div className="relative mx-auto w-full overflow-hidden rounded-3xl border-4 border-emerald-900/60 bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-800 p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Pitch Field Markings (SVG overlay) */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 800 1000"
            >
              {/* Outer boundary */}
              <rect x="20" y="20" width="760" height="960" stroke="#ffffff" strokeWidth="4" />
              {/* Half-way line */}
              <line x1="20" y1="500" x2="780" y2="500" stroke="#ffffff" strokeWidth="4" />
              {/* Center circle */}
              <circle cx="400" cy="500" r="110" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="500" r="4" fill="#ffffff" />
              {/* Top Penalty Area */}
              <rect x="220" y="20" width="360" height="180" stroke="#ffffff" strokeWidth="4" />
              <rect x="300" y="20" width="200" height="70" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="140" r="4" fill="#ffffff" />
              <path d="M330 200 C360 230, 440 230, 470 200" stroke="#ffffff" strokeWidth="4" />
              {/* Bottom Penalty Area */}
              <rect x="220" y="800" width="360" height="180" stroke="#ffffff" strokeWidth="4" />
              <rect x="300" y="910" width="200" height="70" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="860" r="4" fill="#ffffff" />
              <path d="M330 800 C360 770, 440 770, 470 800" stroke="#ffffff" strokeWidth="4" />
            </svg>

            {/* Alternating grass stripes overlay */}
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_60px,rgba(0,0,0,0.04)_60px,rgba(0,0,0,0.04)_120px)]" />

            {/* Formation Rows Container */}
            <div className="relative z-10 flex min-h-[580px] sm:min-h-[660px] flex-col justify-between py-2 sm:py-4">
              {/* Row 1: Goalkeepers */}
              <div className="flex items-center justify-around">
                {formation_lines.gkp.map((p) => (
                  <PitchPlayerCard
                    key={p.id}
                    player={p}
                    isCaptain={p.id === captain?.id}
                    isViceCaptain={p.id === vice_captain?.id}
                    onClick={() => setSelectedPlayer(p)}
                    horizon={activeHorizon}
                  />
                ))}
              </div>

              {/* Row 2: Defenders */}
              <div className="flex flex-wrap items-center justify-around gap-y-2">
                {formation_lines.def.map((p) => (
                  <PitchPlayerCard
                    key={p.id}
                    player={p}
                    isCaptain={p.id === captain?.id}
                    isViceCaptain={p.id === vice_captain?.id}
                    onClick={() => setSelectedPlayer(p)}
                    horizon={activeHorizon}
                  />
                ))}
              </div>

              {/* Row 3: Midfielders */}
              <div className="flex flex-wrap items-center justify-around gap-y-2">
                {formation_lines.mid.map((p) => (
                  <PitchPlayerCard
                    key={p.id}
                    player={p}
                    isCaptain={p.id === captain?.id}
                    isViceCaptain={p.id === vice_captain?.id}
                    onClick={() => setSelectedPlayer(p)}
                    horizon={activeHorizon}
                  />
                ))}
              </div>

              {/* Row 4: Forwards */}
              <div className="flex flex-wrap items-center justify-around gap-y-2">
                {formation_lines.fwd.map((p) => (
                  <PitchPlayerCard
                    key={p.id}
                    player={p}
                    isCaptain={p.id === captain?.id}
                    isViceCaptain={p.id === vice_captain?.id}
                    onClick={() => setSelectedPlayer(p)}
                    horizon={activeHorizon}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* BENCH / DUGOUT */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Substitutes Bench (Dugout)
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  4 Players • £{(total_cost - starters.reduce((acc, p) => acc + p.price, 0)).toFixed(1)}m
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Auto-sub Priority: <span className="font-semibold text-slate-700">GKP &rarr; Sub 1 &rarr; Sub 2 &rarr; Sub 3</span>
              </div>
            </div>

            {/* Bench Cards Grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {bench.map((p, idx) => {
                const label = idx === 0 ? "GKP" : `${idx}`;
                return (
                  <BenchPlayerCard
                    key={p.id}
                    player={p}
                    slotLabel={label}
                    onClick={() => setSelectedPlayer(p)}
                    horizon={activeHorizon}
                  />
                );
              })}
            </div>

            {/* Bench & Goalkeeper Optimization Note */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-teal-200/80 bg-teal-50/60 p-3.5 text-xs text-teal-950">
              <Info className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
              <div className="leading-relaxed">
                {activeHorizon === 5 ? (
                  <>
                    <span className="font-bold text-teal-900">Next 5 Gameweeks Goalkeeper & Bench Tactic: </span>
                    Over an extended 5-gameweek horizon (GW4–8), set-and-forget premium starter David Raya (£6.0m) paired with a non-playing £4.0m keeper (Alex Cairns) maximizes available capital directly on the pitch. Outfield bench assets (John Egan £4.1m, Aurèle Amenda £4.0m, and Regan Slater £4.5m) offer dependable emergency cover while funneling £83.2m into a high-scoring starting XI featuring Erling Haaland (£15.5m), Bruno Fernandes (£12.0m), and Bryan Mbeumo (£7.9m).
                  </>
                ) : activeHorizon === 3 ? (
                  <>
                    <span className="font-bold text-teal-900">Next 3 Gameweeks Goalkeeper & Bench Tactic: </span>
                    Over a 3-gameweek horizon (GW4–6), set-and-forget premium starter David Raya (£6.0m) paired with non-playing £4.0m keeper Alex Cairns enables deploying £15.5m Erling Haaland alongside £12.0m Bruno Fernandes. Budget £4.0m–£4.5m outfield substitutes (Bobby Thomas, Leif Davis, Regan Slater) free up £99.8m of total budget directly on the pitch for high-upside starters.
                  </>
                ) : (
                  <>
                    <span className="font-bold text-teal-900">Single Gameweek Goalkeeper & Bench Tactic: </span>
                    In a single gameweek squad, you do not need a second playing goalkeeper.
                    You can bump the backup keeper down to any playing £4.5m asset or choose a non-starting £4.0m deadspot (Alex Cairns £4.0m)
                    to free up maximum funds (£7.4m in the bank) and concentrate budget directly into starting XI points.
                    Similarly, budget outfield substitutes (£4.0m–£4.5m) ensure expensive assets (such as Cole Palmer £9.6m) are deployed in the starting XI rather than sitting idle on the bench.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* TABLE / ROSTER VIEW */
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 pl-4 pr-2">Role</th>
                  <th className="px-3 py-3.5">Player</th>
                  <th className="px-3 py-3.5">Club</th>
                  <th className="px-3 py-3.5">Pos</th>
                  <th className="px-3 py-3.5">Price</th>
                  <th className="px-3 py-3.5">
                    {activeHorizon > 1 ? `Fixtures (GW 4–${activeHorizon === 5 ? 8 : 6})` : "Fixture"}
                  </th>
                  <th className="px-3 py-3.5 text-right">
                    {activeHorizon > 1 ? `${activeHorizon}-GW xP` : "Expected Pts (xP)"}
                  </th>
                  {activeHorizon > 1 && <th className="px-3 py-3.5 text-right">Avg / GW</th>}
                  <th className="px-3 py-3.5 text-right">Floor (P10)</th>
                  <th className="px-3 py-3.5 text-right">Ceiling (P90)</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Haul %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Starters Section Header */}
                <tr className="bg-emerald-50/40 text-xs font-bold text-emerald-950">
                  <td colSpan={activeHorizon > 1 ? 11 : 10} className="py-2 pl-4">
                    Starting XI ({formation} Formation • {starting_xi_xp.toFixed(2)} Base xP)
                  </td>
                </tr>
                {starters.map((p) => {
                  const isCap = p.id === captain?.id;
                  const isVc = p.id === vice_captain?.id;
                  const fix = p.fixtures && p.fixtures[0];

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="group cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                        {isCap ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-900 ring-1 ring-amber-400">
                            <Crown className="h-3 w-3 text-amber-600" /> Captain (2x)
                          </span>
                        ) : isVc ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 ring-1 ring-slate-300">
                            Vice-Captain
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-800">Starter</span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-bold text-slate-900 group-hover:text-emerald-700">
                        <div className="flex items-center gap-2">
                          <JerseyIcon team={p.team} position={p.position} size="sm" />
                          <span>{p.full_name || p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500">{p.team}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-700 bg-slate-100">
                          {p.position}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-900">
                        £{p.price.toFixed(1)}m
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {activeHorizon > 1 && p.fixtures && p.fixtures.length >= activeHorizon ? (
                          <div className="flex items-center gap-1">
                            {p.fixtures.slice(0, activeHorizon).map((f, i) => {
                              const c = getFdrColor(f.fdr);
                              const shortOpp = f.opponent
                                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                                : `GW${f.event}`;
                              return (
                                <span
                                  key={i}
                                  title={`${f.opponent} (FDR ${f.fdr}) • GW${f.event}`}
                                  className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold ${c.bg} text-white`}
                                >
                                  {shortOpp}
                                </span>
                              );
                            })}
                          </div>
                        ) : fix ? (
                          <span className="text-xs font-semibold text-slate-700">{fix.opponent}</span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-emerald-800">
                        {isCap ? (
                          <span>
                            {(p.xp * 2).toFixed(2)}{" "}
                            <span className="text-[10px] font-normal text-amber-600">(doubled)</span>
                          </span>
                        ) : (
                          p.xp.toFixed(2)
                        )}
                      </td>
                      {activeHorizon > 1 && (
                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs font-semibold text-slate-700">
                          {((isCap ? p.xp * 2 : p.xp) / activeHorizon).toFixed(1)}
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-slate-500">
                        {p.floor?.toFixed(1) || "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-xs font-semibold text-slate-800">
                        {p.ceiling?.toFixed(1) || "-"}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right text-xs font-medium text-slate-600">
                        {p.haul_prob ? `${p.haul_prob.toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}

                {/* Bench Section Header */}
                <tr className="bg-slate-100 text-xs font-bold text-slate-700">
                  <td colSpan={activeHorizon > 1 ? 11 : 10} className="py-2 pl-4">
                    Substitutes (Bench • Ordered by Autosub Priority)
                  </td>
                </tr>
                {bench.map((p, idx) => {
                  const fix = p.fixtures && p.fixtures[0];
                  const label = idx === 0 ? "Backup GKP" : `Sub ${idx}`;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedPlayer(p)}
                      className="group cursor-pointer hover:bg-slate-50 transition-colors opacity-80 hover:opacity-100"
                    >
                      <td className="py-3 pl-4 pr-2 whitespace-nowrap">
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {label}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-700 group-hover:text-emerald-700">
                        <div className="flex items-center gap-2">
                          <JerseyIcon team={p.team} position={p.position} size="sm" />
                          <span>{p.full_name || p.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-500">{p.team}</td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="rounded px-1.5 py-0.5 text-[11px] font-bold text-slate-600 bg-slate-100">
                          {p.position}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-700">
                        £{p.price.toFixed(1)}m
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-600">
                        {activeHorizon > 1 && p.fixtures && p.fixtures.length >= activeHorizon ? (
                          <div className="flex items-center gap-1">
                            {p.fixtures.slice(0, activeHorizon).map((f, i) => {
                              const c = getFdrColor(f.fdr);
                              const shortOpp = f.opponent
                                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                                : `GW${f.event}`;
                              return (
                                <span
                                  key={i}
                                  title={`${f.opponent} (FDR ${f.fdr}) • GW${f.event}`}
                                  className={`rounded px-1.5 py-0.5 text-[8.5px] font-bold ${c.bg} text-white`}
                                >
                                  {shortOpp}
                                </span>
                              );
                            })}
                          </div>
                        ) : fix ? (
                          fix.opponent
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-slate-700">
                        {p.xp.toFixed(2)}
                      </td>
                      {activeHorizon > 1 && (
                        <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-slate-500">
                          {(p.xp / activeHorizon).toFixed(1)}
                        </td>
                      )}
                      <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-slate-400">
                        {p.floor?.toFixed(1) || "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-xs text-slate-600">
                        {p.ceiling?.toFixed(1) || "-"}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right text-xs text-slate-500">
                        {p.haul_prob ? `${p.haul_prob.toFixed(1)}%` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tactical Strategy & Optimization Notes */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {activeHorizon === 5 ? (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                <span>5-GW Captaincy Anchor: Bruno Fernandes (31.54 xP)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Across Gameweeks 4–8, Bruno Fernandes commands the #1 highest simulated expected return with 31.54 points (6.31 pts/GW).
                Doubling his score yields 63.08 points. Partnered with Bryan Mbeumo (30.56 xP, VC), the duo provides a prolific attacking core
                spanning a sustained multi-week run against Manchester City, Fulham, Tottenham, Leeds, and Bournemouth.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <TrendingUp className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Premium Forward Focal Point: Erling Haaland (£15.5m)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Erling Haaland anchors the 3-4-3 attack, delivering 26.28 expected points across the 5 fixtures with an unmatched 39.0-point
                P90 ceiling. Alongside value talisman João Pedro (24.16 xP) and Everton focal point Thierno Barry (24.35 xP), the 3-forward
                line captures the highest goal involvement share in the league.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Sparkles className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Man City Midfield Inclusion: Phil Foden (£7.0m, 24.54 xP)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Over a 5-match window, Phil Foden projects at 4.91 pts/GW (24.54 xP total). His combination of creative threat and open-play
                goal conversion makes him a premier mid-priced asset alongside Ipswich talisman Julio Enciso (£5.5m, 20.76 xP), providing
                tremendous attacking depth behind the frontline.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                <span>5-Gameweek Budget Efficiency (£99.8m Invested, £0.2m ITB)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                David Raya (£6.0m) and Gabriel (£8.0m) anchor the defence with Arsenal&apos;s elite clean sheet probabilities, while budget
                enablers Nobel Mendy (£4.0m) and Bobby Thomas (£4.0m) allow deploying £83.2m directly in the Starting XI. The Starting XI delivers
                276.90 base xP (308.44 with captaincy), averaging 61.69 projected match points per gameweek.
              </p>
            </div>
          </>
        ) : activeHorizon === 3 ? (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Crown className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Captaincy & Talisman Duo: Bruno Fernandes & Bryan Mbeumo</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Bruno Fernandes commands the #1 highest simulated expected return over Gameweeks 4–6 with 19.43 projected points (6.48 pts/GW).
                Doubling his output yields 38.86 points. Partnered with Bryan Mbeumo (18.64 xP, VC), the duo provides a prolific attacking core
                across an enticing 3-match run.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <TrendingUp className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Premium Forward Focal Point: Erling Haaland (£15.5m)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Erling Haaland anchors a potent 3-4-3 attack, delivering 17.65 expected points across the 3 fixtures. Alongside
                value talisman João Pedro (12.29 xP) and Everton focal point Thierno Barry (12.44 xP), the 3-forward line maximizes high-probability
                goal involvements and explosive haul variance.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Defensive Value Engine: Arsenal + Hull City Enablers</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                David Raya (£6.0m) and Gabriel (£8.0m) lock down the defensive foundation with Arsenal&apos;s elite clean sheet probability.
                Starting alongside them are Hull City defenders Mendy (£4.0m) and Egan (£4.0m), whose budget pricing unlocks the funds needed
                to fit both Haaland and Fernandes under the £100m ceiling.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Multi-GW Budget Efficiency (£99.8m Invested, £0.2m ITB)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                By pairing set-and-forget Raya with a non-playing £4.0m backup keeper (Alex Cairns) and budget bench outlets (Thomas £4.0m,
                Davis £4.0m, Slater £4.5m), £99.8m is deployed directly on the pitch. The Starting XI delivers 169.56 base xP (188.99 with captaincy),
                averaging 63.00 projected match points per gameweek.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Tactical Defensive Stack: Arsenal Clean Sheet Play</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                The optimization engine locked an Arsenal defensive trio (Raya £6.0m, Gabriel £8.0m, and White £5.5m)
                against Sunderland away. Sunderland presents an FDR rating of 3 with an estimated 73% clean sheet probability,
                producing the highest expected floor of any defensive setup.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <TrendingUp className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Captaincy & Attack: Alexander Isak (5.91 xP)</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Alexander Isak commands the #1 highest expected points and double-digit haul probability (18.4%) across all
                simulated assets for Gameweek 4 against Fulham at Anfield. Doubling his score yields 11.82 projected points,
                with Dominik Szoboszlai (5.78 xP) securing the vice-captain armband.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Starting Midfield Rule & Cole Palmer Integration</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Official FPL rules require a minimum of 3 starting midfielders. The 4-3-3 setup starts Cole Palmer (£9.6m, 4.79 xP)
                alongside Dominik Szoboszlai (£7.0m) and Morgan Rogers (£7.6m). Rather than sitting idle on the bench, Palmer is
                deployed directly on the pitch where his returns count toward your gameweek score.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Single Gameweek Goalkeeper & Budget Bench Tactic</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                In a single gameweek selection, you do not need an expensive second playing goalkeeper.
                The backup keeper can be bumped down to any playing £4.5m asset, or for maximum money in the bank (£7.4m ITB),
                a non-starting £4.0m deadspot (Alex Cairns £4.0m) can be used to funnel every pound into the starting XI.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Modal Popup on Player Click */}
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
