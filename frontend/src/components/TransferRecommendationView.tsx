"use client";

import { useState, useEffect, useRef } from "react";
import {
  UserTeamTransferResponse,
  TransferRecommendation,
  TransferAlternative,
  SquadPlayer,
  Player,
} from "@/types/player";
import PlayerModal from "./PlayerModal";
import { getTeamKit } from "@/utils/teamColors";
import {
  ArrowRightLeft,
  TrendingUp,
  Shield,
  Zap,
  Sparkles,
  Coins,
  Crown,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Eye,
  RotateCcw,
  Users,
  ChevronDown,
  Info,
  Calendar,
  Layers,
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

// Soccer Jersey SVG
function JerseyIcon({
  team,
  position,
  isCaptain,
  isViceCaptain,
  size = "md",
  badge,
}: {
  team?: string | number;
  position: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  size?: "sm" | "md" | "lg";
  badge?: "OUT" | "IN" | null;
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

      {/* Transfer Badges (OUT / IN) */}
      {badge === "OUT" && (
        <span
          title="Transfer Out Target"
          className="absolute -top-1.5 -left-1.5 flex items-center justify-center rounded-md bg-rose-600 px-1.5 py-0.5 font-black text-[9px] text-white shadow-md ring-1 ring-white animate-pulse"
        >
          OUT
        </span>
      )}
      {badge === "IN" && (
        <span
          title="Transfer In Upgrade"
          className="absolute -top-1.5 -left-1.5 flex items-center justify-center rounded-md bg-emerald-600 px-1.5 py-0.5 font-black text-[9px] text-white shadow-md ring-1 ring-white animate-bounce"
        >
          IN
        </span>
      )}

      {/* Captain / Vice Captain */}
      {isCaptain && (
        <span
          title="Team Captain (Points Doubled)"
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 font-extrabold text-[10px] text-slate-950 ring-2 ring-slate-900 shadow-md"
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
  badge,
}: {
  player: SquadPlayer;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  onClick: () => void;
  horizon?: number;
  badge?: "OUT" | "IN" | null;
}) {
  const fix = player.fixtures && player.fixtures.length > 0 ? player.fixtures[0] : null;
  const fdrColors = getFdrColor(fix?.fdr);
  const displayXp = isCaptain ? player.xp * 2 : player.xp;
  const isMultiHorizon = horizon > 1;

  const ringClass =
    badge === "OUT"
      ? "ring-2 ring-rose-500 shadow-rose-500/30"
      : badge === "IN"
      ? "ring-2 ring-emerald-400 shadow-emerald-400/30"
      : "group-hover:ring-emerald-400";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center text-center transition-all duration-200 hover:-translate-y-1 focus:outline-none cursor-pointer"
    >
      <JerseyIcon
        team={player.team}
        position={player.position}
        isCaptain={isCaptain}
        isViceCaptain={isViceCaptain}
        badge={badge}
      />

      <div
        className={`mt-1 flex w-[84px] sm:w-[98px] md:w-[108px] flex-col items-center overflow-hidden rounded-md bg-slate-950/90 text-white shadow-md ring-1 ring-white/20 backdrop-blur-xs transition-all ${ringClass}`}
      >
        <span className="w-full truncate px-1.5 py-0.5 text-[11px] sm:text-xs font-bold tracking-tight">
          {player.name}
        </span>

        {isMultiHorizon && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="flex w-full items-center justify-center gap-0.5 bg-slate-900/95 px-1 py-0.5 border-t border-white/10">
            {player.fixtures.slice(0, horizon).map((f, i) => {
              const c = getFdrColor(f.fdr);
              const shortOpp = f.opponent
                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                : `GW${f.event}`;
              return (
                <span
                  key={i}
                  title={`${f.opponent} (FDR ${f.fdr})`}
                  className={`rounded px-1 py-0.2 text-[8px] font-extrabold ${c.bg} text-white`}
                >
                  {shortOpp}
                </span>
              );
            })}
          </div>
        ) : fix ? (
          <div
            className={`w-full py-0.5 text-[10px] font-semibold text-center ${fdrColors.bg} text-white`}
          >
            {fix.opponent}
          </div>
        ) : null}

        <div className="flex w-full items-center justify-between bg-white px-1.5 py-0.5 text-[10px] text-slate-900 font-medium">
          <span className="font-bold text-emerald-800">
            {displayXp.toFixed(isMultiHorizon ? 1 : 2)}
            <span className="text-[9px] font-normal text-slate-500 ml-0.5">xP</span>
          </span>
          <span className="text-slate-600">£{player.price.toFixed(1)}m</span>
        </div>
      </div>
    </button>
  );
}

// Bench Player Card
function BenchPlayerCard({
  player,
  slotLabel,
  onClick,
  horizon = 1,
  badge,
}: {
  player: SquadPlayer;
  slotLabel: string;
  onClick: () => void;
  horizon?: number;
  badge?: "OUT" | "IN" | null;
}) {
  const fix = player.fixtures && player.fixtures.length > 0 ? player.fixtures[0] : null;
  const fdrColors = getFdrColor(fix?.fdr);
  const isMultiHorizon = horizon > 1;

  const borderClass =
    badge === "OUT"
      ? "border-rose-400 bg-rose-50/50"
      : badge === "IN"
      ? "border-emerald-400 bg-emerald-50/50"
      : "border-slate-200/90 bg-white hover:border-emerald-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex items-center justify-between rounded-xl border p-3 shadow-xs transition-all hover:shadow-md cursor-pointer ${borderClass}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
          {slotLabel}
        </div>
        <div className="shrink-0">
          <JerseyIcon team={player.team} position={player.position} badge={badge} />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
            {player.name}
          </div>
          <div className="text-[11px] text-slate-500">
            {player.team} • <span className="font-semibold">{player.position}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1 text-right">
        {isMultiHorizon && player.fixtures && player.fixtures.length >= horizon ? (
          <div className="flex items-center gap-0.5">
            {player.fixtures.slice(0, horizon).map((f, i) => {
              const c = getFdrColor(f.fdr);
              const shortOpp = f.opponent
                ? f.opponent.split(" ")[0].slice(0, 3).toUpperCase()
                : `GW${f.event}`;
              return (
                <span
                  key={i}
                  title={`${f.opponent} (FDR ${f.fdr})`}
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
          {player.xp.toFixed(isMultiHorizon ? 1 : 2)}{" "}
          <span className="text-[10px] font-normal text-slate-400">xP</span>
          <span className="ml-1.5 text-[11px] font-medium text-slate-500">
            £{player.price.toFixed(1)}m
          </span>
        </div>
      </div>
    </button>
  );
}

export default function TransferRecommendationView() {
  const [teamIdInput, setTeamIdInput] = useState("");
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [horizon, setHorizon] = useState<1 | 3 | 5>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamData, setTeamData] = useState<UserTeamTransferResponse | null>(null);

  // Active recommended strategy: "points_optimized" | "template_protection" | "haul_potential"
  const [activeStrategy, setActiveStrategy] = useState<
    "points_optimized" | "template_protection" | "haul_potential"
  >("points_optimized");

  // Pitch display mode: "current" (actual squad) vs "preview" (squad with selected transfer applied)
  const [previewTransfer, setPreviewTransfer] = useState(true);

  // Selected player for modal inspection
  const [modalPlayer, setModalPlayer] = useState<Player | null>(null);

  // Custom player replacement drawer
  const [replacementTarget, setReplacementTarget] = useState<SquadPlayer | null>(null);

  // Show alternatives accordion
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Load saved team ID from localStorage on mount
  useEffect(() => {
    const savedId = localStorage.getItem("fpl_team_id");
    if (savedId) {
      setTeamIdInput(savedId);
      fetchTeam(savedId, horizon);
    }
  }, []);

  // Fetch when horizon changes
  useEffect(() => {
    if (activeTeamId) {
      fetchTeam(activeTeamId, horizon);
    }
  }, [horizon]);

  async function fetchTeam(id: string, h: 1 | 3 | 5) {
    if (!id.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/transfer-recommendations?teamId=${id.trim()}&horizon=${h}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to fetch squad for Team ID ${id}`);
      }
      setTeamData(data);
      setActiveTeamId(id.trim());
      localStorage.setItem("fpl_team_id", id.trim());
    } catch (err: any) {
      setError(err?.message || "Failed to load squad from FPL API.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamIdInput.trim()) return;
    fetchTeam(teamIdInput.trim(), horizon);
  }

  function handleDemoClick() {
    setTeamIdInput("1");
    fetchTeam("1", horizon);
  }

  // Determine active recommendation
  const activeRec: TransferRecommendation | null = teamData
    ? teamData.recommendations[activeStrategy]
    : null;

  // Render squad for pitch (either original or with active transfer applied)
  const squadToDisplay = teamData
    ? previewTransfer && activeRec
      ? {
          starters: teamData.squad.starters.map((p) =>
            p.id === activeRec.player_out.id
              ? ({
                  ...activeRec.player_in,
                  is_starter: true,
                  is_captain: p.is_captain,
                  is_vice_captain: p.is_vice_captain,
                } as SquadPlayer)
              : p
          ),
          bench: teamData.squad.bench.map((p) =>
            p.id === activeRec.player_out.id
              ? ({
                  ...activeRec.player_in,
                  is_starter: false,
                  bench_order: p.bench_order,
                } as SquadPlayer)
              : p
          ),
        }
      : teamData.squad
    : null;

  // Formation lines for displayed squad
  const displayedFormationLines = squadToDisplay
    ? {
        gkp: squadToDisplay.starters.filter((p) => p.position === "GKP"),
        def: squadToDisplay.starters.filter((p) => p.position === "DEF"),
        mid: squadToDisplay.starters.filter((p) => p.position === "MID"),
        fwd: squadToDisplay.starters.filter((p) => p.position === "FWD"),
      }
    : null;

  // Financial & xP difference when previewing
  const displayedStartingXp = teamData
    ? previewTransfer && activeRec
      ? activeRec.player_out.is_starter
        ? parseFloat(
            (
              teamData.squad.starting_xi_xp +
              activeRec.xp_gain * (activeRec.player_out.is_captain ? 2 : 1)
            ).toFixed(2)
          )
        : teamData.squad.starting_xi_xp
      : teamData.squad.starting_xi_xp
    : 0;

  const displayedBank = teamData
    ? previewTransfer && activeRec
      ? activeRec.new_bank
      : teamData.squad.bank
    : 0;

  return (
    <div className="space-y-8">
      {/* 1. Team ID Input & Demo Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
              <ArrowRightLeft className="h-3 w-3" />
              <span>Live FPL Squad Connector</span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Enter Your FPL Team ID
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">
              We pull your official starting XI, bench, and remaining bank balance directly from the FPL API.
              Our 10,000-run Monte Carlo engine then calculates your optimal transfers.
            </p>
          </div>

          {/* Form */}
          <div className="w-full lg:max-w-md">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={teamIdInput}
                  onChange={(e) => setTeamIdInput(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !teamIdInput.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span>Load Team</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo & Help */}
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <button
                type="button"
                onClick={handleDemoClick}
                className="inline-flex items-center gap-1 font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Try Demo Team (Solio Moose • ID: 1)</span>
              </button>

              <div className="group relative flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-help">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Where is my ID?</span>
                <div className="absolute right-0 bottom-full mb-2 hidden w-64 rounded-xl border border-slate-200 bg-slate-900 p-3 text-[11px] text-white shadow-xl group-hover:block z-50">
                  Log in to fantasy.premierleague.com, click <strong>"Points"</strong>, and look at your browser address bar:
                  <code className="mt-1 block rounded bg-slate-800 p-1 text-emerald-400">
                    /entry/<strong>123456</strong>/event/...
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold">Unable to load FPL squad:</strong> {error}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/90 bg-white p-16 shadow-xs text-center">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
          <h3 className="mt-4 text-base font-bold text-slate-900">
            Pulling live squad from Fantasy Premier League...
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Mapping your 15 players against our 10,000-run Monte Carlo probability engine and solving for highest-gain transfer combinations.
          </p>
        </div>
      )}

      {/* Main Squad & Recommendations Section */}
      {teamData && !loading && (
        <div className="space-y-6">
          {/* Horizon Selector & Manager Bar */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            {/* Manager info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">{teamData.manager.team_name}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  GW{teamData.manager.current_event}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manager: <span className="font-medium text-slate-700">{teamData.manager.name}</span> • Overall Rank:{" "}
                <span className="font-semibold text-slate-800">
                  {teamData.manager.overall_rank
                    ? teamData.manager.overall_rank.toLocaleString()
                    : "Unranked"}
                </span>{" "}
                • Total Points: <span className="font-semibold text-slate-800">{teamData.manager.overall_points}</span>
              </p>
            </div>

            {/* Horizon Filter Tabs */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-slate-100 p-1">
              <span className="px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Horizon:
              </span>
              {[
                { label: "Next GW", val: 1 },
                { label: "3 GWs", val: 3 },
                { label: "5 GWs", val: 5 },
              ].map((h) => (
                <button
                  key={h.val}
                  type="button"
                  onClick={() => setHorizon(h.val as 1 | 3 | 5)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Quick Squad Metric Badges */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Starting XI xP
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-emerald-800">
                  {displayedStartingXp.toFixed(horizon > 1 ? 1 : 2)}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">pts</span>
                {previewTransfer && activeRec && activeRec.xp_gain !== 0 && activeRec.player_out.is_starter && (
                  <span className="text-[11px] font-bold text-emerald-700">
                    (+{activeRec.xp_gain.toFixed(horizon > 1 ? 1 : 2)})
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Bank Remaining
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-slate-900">£{displayedBank.toFixed(1)}m</span>
                <span className="text-[11px] text-slate-400">ITB</span>
                {previewTransfer && activeRec && activeRec.cost_diff !== 0 && (
                  <span
                    className={`text-[11px] font-semibold ${
                      activeRec.cost_diff > 0 ? "text-amber-600" : "text-emerald-700"
                    }`}
                  >
                    ({activeRec.cost_diff > 0 ? `-£${activeRec.cost_diff}m` : `+£${Math.abs(activeRec.cost_diff)}m`})
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Formation
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">{teamData.squad.formation}</div>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Squad Value
              </div>
              <div className="mt-1 text-xl font-bold text-slate-900">£{teamData.squad.total_cost.toFixed(1)}m</div>
            </div>
          </div>

          {/* 3 Transfer Recommendation Strategy Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Recommended Transfers (Select to preview on pitch)
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Pitch preview:</span>
                <button
                  type="button"
                  onClick={() => setPreviewTransfer((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    previewTransfer
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>{previewTransfer ? "Previewing Transfer" : "Showing Original Squad"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Card 1: Points Optimizer */}
              {teamData.recommendations.points_optimized && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStrategy("points_optimized");
                    setPreviewTransfer(true);
                  }}
                  className={`group relative rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    activeStrategy === "points_optimized"
                      ? "border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                      <TrendingUp className="h-3 w-3" />
                      Points Optimizer
                    </span>
                    <span className="text-sm font-black text-emerald-800">
                      {teamData.recommendations.points_optimized.key_stat}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    {teamData.recommendations.points_optimized.title}
                  </h4>

                  {/* Transfer Visual: OUT -> IN */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/90 p-2.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">
                        OUT
                      </span>
                      <div className="truncate text-xs font-bold text-slate-900">
                        {teamData.recommendations.points_optimized.player_out.name}
                      </div>
                    </div>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-2" />
                    <div className="flex items-center gap-2 min-w-0 text-right">
                      <div className="truncate text-xs font-bold text-emerald-800">
                        {teamData.recommendations.points_optimized.player_in.name}
                      </div>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                        IN
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {teamData.recommendations.points_optimized.rationale}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>
                      Cost: £{teamData.recommendations.points_optimized.cost_diff > 0 ? "+" : ""}
                      {teamData.recommendations.points_optimized.cost_diff}m
                    </span>
                    <span>New Bank: £{teamData.recommendations.points_optimized.new_bank}m</span>
                  </div>
                </button>
              )}

              {/* Card 2: Template Protection */}
              {teamData.recommendations.template_protection && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStrategy("template_protection");
                    setPreviewTransfer(true);
                  }}
                  className={`group relative rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    activeStrategy === "template_protection"
                      ? "border-teal-500 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-teal-900">
                      <Shield className="h-3 w-3" />
                      Rank Safety
                    </span>
                    <span className="text-sm font-black text-teal-800">
                      {teamData.recommendations.template_protection.key_stat}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    {teamData.recommendations.template_protection.title}
                  </h4>

                  {/* Transfer Visual: OUT -> IN */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/90 p-2.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">
                        OUT
                      </span>
                      <div className="truncate text-xs font-bold text-slate-900">
                        {teamData.recommendations.template_protection.player_out.name}
                      </div>
                    </div>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-2" />
                    <div className="flex items-center gap-2 min-w-0 text-right">
                      <div className="truncate text-xs font-bold text-teal-800">
                        {teamData.recommendations.template_protection.player_in.name}
                      </div>
                      <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">
                        IN
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {teamData.recommendations.template_protection.rationale}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>
                      xP Diff: {teamData.recommendations.template_protection.xp_gain >= 0 ? "+" : ""}
                      {teamData.recommendations.template_protection.xp_gain}
                    </span>
                    <span>New Bank: £{teamData.recommendations.template_protection.new_bank}m</span>
                  </div>
                </button>
              )}

              {/* Card 3: Haul Potential */}
              {teamData.recommendations.haul_potential && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStrategy("haul_potential");
                    setPreviewTransfer(true);
                  }}
                  className={`group relative rounded-2xl border p-5 text-left transition-all cursor-pointer ${
                    activeStrategy === "haul_potential"
                      ? "border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20"
                      : "border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                      <Zap className="h-3 w-3" />
                      Haul Potential
                    </span>
                    <span className="text-sm font-black text-amber-800">
                      {teamData.recommendations.haul_potential.key_stat}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-bold text-slate-900">
                    {teamData.recommendations.haul_potential.title}
                  </h4>

                  {/* Transfer Visual: OUT -> IN */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-white/90 p-2.5 border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-800">
                        OUT
                      </span>
                      <div className="truncate text-xs font-bold text-slate-900">
                        {teamData.recommendations.haul_potential.player_out.name}
                      </div>
                    </div>
                    <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400 shrink-0 mx-2" />
                    <div className="flex items-center gap-2 min-w-0 text-right">
                      <div className="truncate text-xs font-bold text-amber-800">
                        {teamData.recommendations.haul_potential.player_in.name}
                      </div>
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                        IN
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-600 line-clamp-2">
                    {teamData.recommendations.haul_potential.rationale}
                  </p>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                    <span>
                      Haul Chance: {teamData.recommendations.haul_potential.player_in.haul_prob.toFixed(1)}%
                    </span>
                    <span>New Bank: £{teamData.recommendations.haul_potential.new_bank}m</span>
                  </div>
                </button>
              )}
            </div>

            {/* Active Transfer Banner */}
            {activeRec && (
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200/90 bg-slate-900 text-white px-4 py-3 shadow-xs gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    ACTIVE PREVIEW
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Transferring <strong>{activeRec.player_out.name}</strong> out for{" "}
                    <strong>{activeRec.player_in.name}</strong> ({activeRec.key_stat})
                  </span>
                </div>

                {activeRec.alternatives && activeRec.alternatives.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAlternatives((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>
                      {showAlternatives
                        ? "Hide alternative targets"
                        : `View ${activeRec.alternatives.length} alternatives`}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Alternatives Drawer / Accordion */}
            {showAlternatives && activeRec && activeRec.alternatives && activeRec.alternatives.length > 0 && (
              <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Alternative Targets for {activeRec.title}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {activeRec.alternatives.map((alt, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs text-xs"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{alt.player_in.name}</span>
                        <span className="text-emerald-700">
                          {alt.xp_gain >= 0 ? "+" : ""}
                          {alt.xp_gain} xP
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {alt.player_in.team} • £{alt.player_in.price}m
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                        <span>Replacing: {alt.player_out.name}</span>
                        <span>Bank: £{alt.new_bank}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* THE SOCCER PITCH */}
          <div className="relative mx-auto w-full overflow-hidden rounded-3xl border-4 border-emerald-900/60 bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-800 p-4 sm:p-6 md:p-8 shadow-2xl">
            {/* Field Markings */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              preserveAspectRatio="none"
              viewBox="0 0 800 1000"
            >
              <rect x="20" y="20" width="760" height="960" stroke="#ffffff" strokeWidth="4" />
              <line x1="20" y1="500" x2="780" y2="500" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="500" r="110" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="500" r="4" fill="#ffffff" />
              <rect x="220" y="20" width="360" height="180" stroke="#ffffff" strokeWidth="4" />
              <rect x="300" y="20" width="200" height="70" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="140" r="4" fill="#ffffff" />
              <path d="M330 200 C360 230, 440 230, 470 200" stroke="#ffffff" strokeWidth="4" />
              <rect x="220" y="800" width="360" height="180" stroke="#ffffff" strokeWidth="4" />
              <rect x="300" y="910" width="200" height="70" stroke="#ffffff" strokeWidth="4" />
              <circle cx="400" cy="860" r="4" fill="#ffffff" />
              <path d="M330 800 C360 770, 440 770, 470 800" stroke="#ffffff" strokeWidth="4" />
            </svg>

            {/* Grass stripes */}
            <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_60px,rgba(0,0,0,0.04)_60px,rgba(0,0,0,0.04)_120px)]" />

            {/* Pitch Rows */}
            {displayedFormationLines && (
              <div className="relative z-10 flex min-h-[580px] sm:min-h-[660px] flex-col justify-between py-2 sm:py-4">
                {/* Row 1: Goalkeepers */}
                <div className="flex items-center justify-around">
                  {displayedFormationLines.gkp.map((p) => {
                    const isOut = activeRec?.player_out.id === p.id;
                    const isIn = previewTransfer && activeRec?.player_in.id === p.id;
                    return (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        isCaptain={p.id === teamData.squad.captain?.id}
                        isViceCaptain={p.id === teamData.squad.vice_captain?.id}
                        badge={isIn ? "IN" : isOut ? "OUT" : null}
                        onClick={() => setReplacementTarget(p)}
                        horizon={horizon}
                      />
                    );
                  })}
                </div>

                {/* Row 2: Defenders */}
                <div className="flex flex-wrap items-center justify-around gap-y-2">
                  {displayedFormationLines.def.map((p) => {
                    const isOut = activeRec?.player_out.id === p.id;
                    const isIn = previewTransfer && activeRec?.player_in.id === p.id;
                    return (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        isCaptain={p.id === teamData.squad.captain?.id}
                        isViceCaptain={p.id === teamData.squad.vice_captain?.id}
                        badge={isIn ? "IN" : isOut ? "OUT" : null}
                        onClick={() => setReplacementTarget(p)}
                        horizon={horizon}
                      />
                    );
                  })}
                </div>

                {/* Row 3: Midfielders */}
                <div className="flex flex-wrap items-center justify-around gap-y-2">
                  {displayedFormationLines.mid.map((p) => {
                    const isOut = activeRec?.player_out.id === p.id;
                    const isIn = previewTransfer && activeRec?.player_in.id === p.id;
                    return (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        isCaptain={p.id === teamData.squad.captain?.id}
                        isViceCaptain={p.id === teamData.squad.vice_captain?.id}
                        badge={isIn ? "IN" : isOut ? "OUT" : null}
                        onClick={() => setReplacementTarget(p)}
                        horizon={horizon}
                      />
                    );
                  })}
                </div>

                {/* Row 4: Forwards */}
                <div className="flex flex-wrap items-center justify-around gap-y-2">
                  {displayedFormationLines.fwd.map((p) => {
                    const isOut = activeRec?.player_out.id === p.id;
                    const isIn = previewTransfer && activeRec?.player_in.id === p.id;
                    return (
                      <PitchPlayerCard
                        key={p.id}
                        player={p}
                        isCaptain={p.id === teamData.squad.captain?.id}
                        isViceCaptain={p.id === teamData.squad.vice_captain?.id}
                        badge={isIn ? "IN" : isOut ? "OUT" : null}
                        onClick={() => setReplacementTarget(p)}
                        horizon={horizon}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bench Section */}
          {squadToDisplay && (
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Substitutes & Bench Order</h3>
                  <p className="text-xs text-slate-500">
                    Official FPL priority order (Backup Goalkeeper + Outfield Subs 1, 2, 3)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {squadToDisplay.bench.map((p, idx) => {
                  const label = idx === 0 ? "GK" : `Sub ${idx}`;
                  const isOut = activeRec?.player_out.id === p.id;
                  const isIn = previewTransfer && activeRec?.player_in.id === p.id;
                  return (
                    <BenchPlayerCard
                      key={p.id}
                      player={p}
                      slotLabel={label}
                      badge={isIn ? "IN" : isOut ? "OUT" : null}
                      onClick={() => setReplacementTarget(p)}
                      horizon={horizon}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over / Modal: Custom Replacements for Clicked Player */}
      {replacementTarget && teamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  Custom Replacement Finder
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Replace {replacementTarget.name} ({replacementTarget.position})
                </h3>
                <p className="text-xs text-slate-500">
                  Current: £{replacementTarget.price}m • {replacementTarget.xp} xP • Available Budget:{" "}
                  <strong>£{(replacementTarget.price + teamData.squad.bank).toFixed(1)}m</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setReplacementTarget(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Top Affordable Replacements ({replacementTarget.position})
              </div>

              {teamData.player_replacements[replacementTarget.id]?.length > 0 ? (
                teamData.player_replacements[replacementTarget.id].map((rep, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 hover:bg-emerald-50/50 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0">
                        <JerseyIcon team={rep.player_in.team} position={rep.player_in.position} size="sm" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{rep.player_in.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {rep.player_in.team} • £{rep.player_in.price}m • {rep.player_in.selected_by_percent}% own
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-bold ${
                          rep.xp_gain >= 0 ? "text-emerald-800" : "text-slate-600"
                        }`}
                      >
                        {rep.xp_gain >= 0 ? "+" : ""}
                        {rep.xp_gain} xP
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rep.cost_diff > 0 ? `+£${rep.cost_diff}m` : `-£${Math.abs(rep.cost_diff)}m`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No direct upgrades found within available bank.
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setModalPlayer(replacementTarget);
                  setReplacementTarget(null);
                }}
                className="text-emerald-700 font-semibold hover:underline cursor-pointer"
              >
                Inspect {replacementTarget.name} Full Simulation Profile →
              </button>

              <button
                type="button"
                onClick={() => setReplacementTarget(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deep Dive Player Modal */}
      {modalPlayer && (
        <PlayerModal
          player={modalPlayer}
          gameweeks={horizon}
          onClose={() => setModalPlayer(null)}
        />
      )}
    </div>
  );
}
