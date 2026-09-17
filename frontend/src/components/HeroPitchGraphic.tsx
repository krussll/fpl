"use client";

import { getTeamKit } from "@/utils/teamColors";
import { Sparkles, Trophy, Flame, Shield, CheckCircle2 } from "lucide-react";

interface PitchHeroPlayer {
  name: string;
  team: string;
  position: "GKP" | "DEF" | "MID" | "FWD";
  xp: number;
  price: number;
  opp: string;
  fdr: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

const HERO_SQUAD: {
  gkp: PitchHeroPlayer[];
  def: PitchHeroPlayer[];
  mid: PitchHeroPlayer[];
  fwd: PitchHeroPlayer[];
} = {
  gkp: [
    {
      name: "Raya",
      team: "Arsenal",
      position: "GKP",
      xp: 4.9,
      price: 5.6,
      opp: "WOL (H)",
      fdr: 2,
    },
  ],
  def: [
    {
      name: "Gabriel",
      team: "Arsenal",
      position: "DEF",
      xp: 5.2,
      price: 6.2,
      opp: "WOL (H)",
      fdr: 2,
    },
    {
      name: "Gvardiol",
      team: "Man City",
      position: "DEF",
      xp: 4.8,
      price: 6.0,
      opp: "IPS (H)",
      fdr: 2,
    },
    {
      name: "Alexander-Arnold",
      team: "Liverpool",
      position: "DEF",
      xp: 5.5,
      price: 7.1,
      opp: "BOU (H)",
      fdr: 2,
    },
  ],
  mid: [
    {
      name: "Palmer",
      team: "Chelsea",
      position: "MID",
      xp: 7.6,
      price: 10.8,
      opp: "WHU (A)",
      fdr: 2,
    },
    {
      name: "Saka",
      team: "Arsenal",
      position: "MID",
      xp: 7.1,
      price: 10.1,
      opp: "WOL (H)",
      fdr: 2,
      isViceCaptain: true,
    },
    {
      name: "Mbeumo",
      team: "Brentford",
      position: "MID",
      xp: 6.4,
      price: 7.6,
      opp: "SOU (H)",
      fdr: 2,
    },
    {
      name: "Rogers",
      team: "Aston Villa",
      position: "MID",
      xp: 4.9,
      price: 5.4,
      opp: "EVE (H)",
      fdr: 2,
    },
  ],
  fwd: [
    {
      name: "Haaland",
      team: "Man City",
      position: "FWD",
      xp: 15.6,
      price: 15.2,
      opp: "IPS (H)",
      fdr: 2,
      isCaptain: true,
    },
    {
      name: "Watkins",
      team: "Aston Villa",
      position: "FWD",
      xp: 6.3,
      price: 9.0,
      opp: "EVE (H)",
      fdr: 2,
    },
    {
      name: "Isak",
      team: "Newcastle",
      position: "FWD",
      xp: 6.2,
      price: 8.5,
      opp: "FUL (A)",
      fdr: 3,
    },
  ],
};

function HeroJerseyIcon({
  team,
  position,
  isCaptain,
  isViceCaptain,
}: {
  team: string;
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}) {
  const isGoalkeeper = position === "GKP";
  const kit = getTeamKit(team, isGoalkeeper);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        viewBox="0 0 48 48"
        className="h-8 w-8 sm:h-9 sm:w-9 drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Base Shirt Body */}
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          fill={kit.primary}
        />

        {/* Sleeves (if contrasting) */}
        {kit.secondary !== kit.primary && (
          <>
            <path d="M15 10L10 17L15 22L17 17L17.2 11.2Z" fill={kit.secondary} />
            <path d="M33 10L38 17L33 22L31 17L30.8 11.2Z" fill={kit.secondary} />
          </>
        )}

        {/* Stripes */}
        {kit.pattern === "striped" && (
          <g stroke={kit.patternColor || kit.secondary} strokeWidth="2.2" strokeLinecap="butt">
            <line x1="21.5" y1="14" x2="21.5" y2="38" />
            <line x1="26.5" y1="14" x2="26.5" y2="38" />
          </g>
        )}

        {/* Collar contour */}
        <path
          d="M20 13C22 15 26 15 28 13"
          stroke={kit.collar || "#ffffff"}
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Outer border / seam stroke */}
        <path
          d="M15 10L10 17L15 22L17 17V38H31V17L33 22L38 17L33 10L28 13C26 14 22 14 20 13L15 10Z"
          stroke={kit.stroke || "#ffffff"}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>

      {isCaptain && (
        <span
          title="Captain (Double points)"
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 font-extrabold text-[9px] text-slate-950 ring-1.5 ring-slate-950 shadow-sm"
        >
          C
        </span>
      )}
      {isViceCaptain && (
        <span
          title="Vice-Captain"
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 font-bold text-[9px] text-slate-900 ring-1.5 ring-slate-950 shadow-sm"
        >
          V
        </span>
      )}
    </div>
  );
}

function HeroPlayerCard({ player }: { player: PitchHeroPlayer }) {
  const isFdr2 = player.fdr <= 2;
  return (
    <div className="group flex flex-col items-center justify-center text-center">
      <HeroJerseyIcon
        team={player.team}
        position={player.position}
        isCaptain={player.isCaptain}
        isViceCaptain={player.isViceCaptain}
      />

      <div className="mt-1 flex w-[68px] sm:w-[78px] flex-col items-center overflow-hidden rounded-md bg-slate-950/90 text-white shadow-xs ring-1 ring-white/20 backdrop-blur-xs transition-colors group-hover:ring-orange-400">
        <span className="w-full truncate px-1 py-0.5 text-[9.5px] sm:text-[10px] font-bold tracking-tight">
          {player.name}
        </span>

        {/* Opponent & FDR */}
        <div
          className={`flex w-full items-center justify-center border-t border-white/10 px-1 py-0.5 text-[8px] font-semibold tracking-wider ${
            isFdr2 ? "bg-emerald-600 text-white" : "bg-slate-600 text-white"
          }`}
        >
          <span>{player.opp}</span>
        </div>

        {/* Points & Price */}
        <div className="flex w-full items-center justify-between bg-white px-1 py-0.5 text-[9px] font-bold text-slate-900">
          <span className="text-[#FE5803]">{player.xp.toFixed(1)}</span>
          <span className="text-slate-400 font-normal text-[8px]">
            £{player.price.toFixed(1)}m
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HeroPitchGraphic() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Ambient background glow and gradient blur */}
      <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-tr from-orange-400/25 via-amber-300/20 to-emerald-400/25 blur-2xl -z-10 opacity-70" />

      {/* Floating Top KPI Card (NowNext-style floating element) */}
      <div className="absolute -top-4 -left-2 sm:-top-5 sm:-left-5 z-20 transition-transform duration-300 hover:scale-105">
        <div className="flex items-center gap-3 rounded-2xl border border-orange-200/90 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-[#FE5803] ring-1 ring-orange-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Projected Haul
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                74.5 pts
              </span>
              <span className="text-[11px] font-bold text-emerald-600">
                +19.2 vs avg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Right Optimization Pill */}
      <div className="absolute -top-3 -right-2 sm:-top-4 sm:-right-4 z-20 transition-transform duration-300 hover:scale-105 hidden sm:block">
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200/90 bg-white/95 px-3 py-2 shadow-xl shadow-slate-900/5 backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">
            Optimal Squad Value: <strong className="text-emerald-700">£99.4m</strong>
          </span>
        </div>
      </div>

      {/* The Main Pitch Device / Window Card */}
      <div className="relative z-10 overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-900/95 p-2 sm:p-2.5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl ring-1 ring-white/10 transition-transform hover:-translate-y-0.5">
        {/* Window Top Controls Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 px-3 py-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-semibold text-slate-300">
              OPTIMAL STARTING XI
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SOLVER ACTIVE
            </span>
            <span className="hidden sm:inline text-slate-500">•</span>
            <span className="hidden sm:inline text-slate-400 font-sans font-semibold">
              3-4-3 Formation
            </span>
          </div>
        </div>

        {/* The Pitch Canvas */}
        <div className="relative overflow-hidden rounded-b-2xl bg-gradient-to-b from-emerald-850 via-emerald-750 to-emerald-900 p-3 sm:p-5">
          {/* Soccer pitch vector line markings */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 600 700"
          >
            {/* Outer boundary */}
            <rect x="15" y="15" width="570" height="670" stroke="#ffffff" strokeWidth="2.5" />
            {/* Halfway line */}
            <line x1="15" y1="350" x2="585" y2="350" stroke="#ffffff" strokeWidth="2.5" />
            {/* Center circle */}
            <circle cx="300" cy="350" r="70" stroke="#ffffff" strokeWidth="2.5" />
            <circle cx="300" cy="350" r="3" fill="#ffffff" />
            {/* Top penalty area */}
            <rect x="180" y="15" width="240" height="110" stroke="#ffffff" strokeWidth="2" />
            <rect x="230" y="15" width="140" height="45" stroke="#ffffff" strokeWidth="1.5" />
            {/* Bottom penalty area */}
            <rect x="180" y="575" width="240" height="110" stroke="#ffffff" strokeWidth="2" />
            <rect x="230" y="640" width="140" height="45" stroke="#ffffff" strokeWidth="1.5" />
          </svg>

          {/* Squad Rows */}
          <div className="relative z-10 flex flex-col justify-between gap-3 sm:gap-4 py-1 sm:py-2">
            {/* GKP Row */}
            <div className="flex justify-center">
              {HERO_SQUAD.gkp.map((p) => (
                <HeroPlayerCard key={p.name} player={p} />
              ))}
            </div>

            {/* DEF Row */}
            <div className="flex justify-around sm:justify-center sm:gap-8">
              {HERO_SQUAD.def.map((p) => (
                <HeroPlayerCard key={p.name} player={p} />
              ))}
            </div>

            {/* MID Row */}
            <div className="flex justify-around sm:justify-center sm:gap-4">
              {HERO_SQUAD.mid.map((p) => (
                <HeroPlayerCard key={p.name} player={p} />
              ))}
            </div>

            {/* FWD Row */}
            <div className="flex justify-around sm:justify-center sm:gap-7">
              {HERO_SQUAD.fwd.map((p) => (
                <HeroPlayerCard key={p.name} player={p} />
              ))}
            </div>
          </div>

          {/* Subtle Bottom-To-Top Gradient Fade Mask for natural flow */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
        </div>
      </div>

      {/* Floating Bottom Trust Chip */}
      <div className="absolute -bottom-3.5 right-4 sm:right-6 z-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-[#FE5803]" />
          <span>Haaland (C) 15.6 xP • Highest Ceiling</span>
        </div>
      </div>
    </div>
  );
}
