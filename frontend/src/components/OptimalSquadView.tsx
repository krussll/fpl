"use client";

import { useState, useEffect } from "react";
import { OptimalSquad, SquadPlayer, Player } from "@/types/player";
import PlayerModal from "./PlayerModal";
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

function getPositionColor(pos: string): string {
  switch (pos) {
    case "GKP":
      return "#f59e0b"; // amber
    case "DEF":
      return "#0284c7"; // sky
    case "MID":
      return "#10b981"; // emerald
    case "FWD":
      return "#f43f5e"; // rose
    default:
      return "#64748b";
  }
}

// Custom Soccer Jersey / Kit SVG
function JerseyIcon({
  position,
  isCaptain,
  isViceCaptain,
}: {
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}) {
  const primaryColor = getPositionColor(position);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 48 48"
        className="h-10 w-10 sm:h-12 sm:w-12 drop-shadow-md transition-transform duration-200 group-hover:scale-110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shirt body */}
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          fill={primaryColor}
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Collar contour */}
        <path
          d="M20 13C22 15 26 15 28 13"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Center stripe */}
        <line
          x1="24"
          y1="15"
          x2="24"
          y2="38"
          stroke="#ffffff"
          strokeWidth="1"
          strokeOpacity="0.4"
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
}: {
  player: SquadPlayer;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick: () => void;
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
        position={player.position}
        isCaptain={isCaptain}
        isViceCaptain={isViceCaptain}
      />

      {/* Nameplate (FPL Style) */}
      <div className="mt-1 flex w-[82px] sm:w-[96px] md:w-[108px] flex-col items-center overflow-hidden rounded-md bg-slate-950/90 text-white shadow-md ring-1 ring-white/20 backdrop-blur-xs transition-colors group-hover:bg-slate-900 group-hover:ring-emerald-400">
        <span className="w-full truncate px-1.5 py-0.5 text-[11px] sm:text-xs font-bold tracking-tight">
          {player.name}
        </span>

        {/* Fixture pill */}
        {fix && (
          <div
            className={`flex w-full items-center justify-center gap-1 border-t border-white/10 ${fdrColors.bg} px-1 py-0.5 text-[9px] sm:text-[10px] font-semibold tracking-wider`}
          >
            <span>{fix.opponent}</span>
          </div>
        )}

        {/* Points & Price pill */}
        <div className="flex w-full items-center justify-between bg-white px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-900">
          <span className="text-emerald-700">
            {displayXp.toFixed(1)} <span className="text-[8.5px] font-normal text-slate-500">xP</span>
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
}: {
  player: SquadPlayer;
  slotLabel: string;
  onClick: () => void;
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
          <JerseyIcon position={player.position} />
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
        {fix && (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${fdrColors.bg} text-white shadow-2xs`}
          >
            {fix.opponent}
          </span>
        )}
        <div className="text-xs font-bold text-emerald-800">
          {player.xp.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">xP</span>
          <span className="ml-1.5 text-[11px] font-medium text-slate-500">£{player.price.toFixed(1)}m</span>
        </div>
      </div>
    </button>
  );
}

export default function OptimalSquadView() {
  const [squad, setSquad] = useState<OptimalSquad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"pitch" | "table">("pitch");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    async function loadOptimalSquad() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/optimal-squad");
        if (!res.ok) {
          throw new Error(`Failed to load squad (status ${res.status})`);
        }
        const data = await res.json();
        setSquad(data);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Failed to load optimal squad.");
      } finally {
        setLoading(false);
      }
    }

    loadOptimalSquad();
  }, []);

  if (loading) {
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
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {/* 1. Match xP (Main KPI) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Projected Match xP
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
            Starting XI ({starting_xi_xp.toFixed(1)}) + Captain 2x (+{captain?.xp.toFixed(1)})
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
          <div className="mt-2 truncate text-base font-bold text-slate-900">
            {captain?.name}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">
              {(captain.doubled_xp || captain.xp * 2).toFixed(1)} pts
            </span>{" "}
            • {captain.opponent}
          </p>
        </div>

        {/* 5. Vice-Captain Highlight */}
        <div className="hidden lg:block rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vice-Captain
            </span>
            <Sparkles className="h-4 w-4 text-teal-600" />
          </div>
          <div className="mt-2 truncate text-base font-bold text-slate-900">
            {vice_captain?.name}
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            <span className="font-semibold text-emerald-700">{vice_captain?.xp.toFixed(1)} pts</span> •{" "}
            {vice_captain?.opponent}
          </p>
        </div>
      </div>

      {/* View Switcher & Gameweek Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
        <div className="flex items-center gap-2 pl-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            Gameweek {squad.gameweek}
          </span>
          <span className="text-xs font-semibold text-slate-700">
            Optimal Starting Lineup (Single Gameweek Focus)
          </span>
        </div>

        <div className="flex items-center gap-1 self-end sm:self-center">
          <button
            type="button"
            onClick={() => setViewMode("pitch")}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
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
                  />
                );
              })}
            </div>

            {/* Single Gameweek Bench & Goalkeeper Optimization Note */}
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-teal-200/80 bg-teal-50/60 p-3.5 text-xs text-teal-950">
              <Info className="h-4 w-4 shrink-0 text-teal-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold text-teal-900">Single Gameweek Goalkeeper & Bench Tactic: </span>
                In a single gameweek squad, you do not need a second playing goalkeeper.
                You can bump the backup keeper down to any playing £4.5m asset or choose a non-starting £4.0m deadspot (Alex Cairns £4.0m)
                to free up maximum funds (£7.4m in the bank) and concentrate budget directly into starting XI points.
                Similarly, budget outfield substitutes (£4.0m–£4.5m) ensure expensive assets (such as Cole Palmer £9.6m) are deployed in the starting XI rather than sitting idle on the bench.
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
                  <th className="px-3 py-3.5">Fixture</th>
                  <th className="px-3 py-3.5 text-right">Expected Pts (xP)</th>
                  <th className="px-3 py-3.5 text-right">Floor (P10)</th>
                  <th className="px-3 py-3.5 text-right">Ceiling (P90)</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Haul %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Starters Section Header */}
                <tr className="bg-emerald-50/40 text-xs font-bold text-emerald-950">
                  <td colSpan={10} className="py-2 pl-4">
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
                        {p.full_name || p.name}
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
                        {fix ? (
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
                  <td colSpan={10} className="py-2 pl-4">
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
                        {p.full_name || p.name}
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
                        {fix ? fix.opponent : "-"}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right font-bold text-slate-700">
                        {p.xp.toFixed(2)}
                      </td>
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
      </div>

      {/* Modal Popup on Player Click */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
