import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { OptimalSquad, SquadPlayer, Player, SquadCaptainInfo } from "@/types/player";

interface SimulationCacheFile {
  timestamp: number;
  simulations: number;
  fixtures_count: number;
  players_count: number;
  players: Player[];
}

const cachedSimMap: Record<number, Player[]> = {};
let cachedHistories: Record<string, any> | null = null;
let cachedSim5Map: Map<number, Player> | null = null;

function loadSimulationPlayers(horizon: number): Player[] {
  const safeH = [1, 3, 5].includes(horizon) ? horizon : 1;
  if (cachedSimMap[safeH]) return cachedSimMap[safeH];

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", `simulations_10k_fixtures_${safeH}.json`),
    path.resolve(process.cwd(), "..", ".fpl_cache", `simulations_10k_fixtures_${safeH}.json`),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw) as SimulationCacheFile;
        if (Array.isArray(parsed.players)) {
          cachedSimMap[safeH] = parsed.players;
          return parsed.players;
        }
      } catch (err) {
        console.error(`Failed to parse simulation cache for horizon ${safeH}:`, err);
      }
    }
  }
  return [];
}

function loadPlayerHistories(): Record<string, any> {
  if (cachedHistories) return cachedHistories;

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", "player_histories.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "player_histories.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        cachedHistories = JSON.parse(raw);
        return cachedHistories || {};
      } catch (err) {
        console.error("Failed to parse player_histories.json:", err);
      }
    }
  }
  return {};
}

function loadSim5Map(): Map<number, Player> {
  if (cachedSim5Map) return cachedSim5Map;

  const players5 = loadSimulationPlayers(5);
  cachedSim5Map = new Map<number, Player>();
  for (const p of players5) {
    cachedSim5Map.set(p.id, p);
  }
  return cachedSim5Map;
}

function isExpectedStartingGkp(p: Player): boolean {
  if (p.position !== "GKP") return false;
  const startProb = Number(p.start_prob || 0);
  if (startProb >= 50.0) return true;
  if ((p.minutes || 0) >= 180 && startProb >= 25.0) return true;
  return false;
}

function isValidGkpPair(g1: Player, g2: Player): boolean {
  if (!isExpectedStartingGkp(g1) && !isExpectedStartingGkp(g2)) return false;
  const prices = [Number(g1.price || 0), Number(g2.price || 0)].sort((a, b) => a - b);
  if (prices[1] > 5.0) return prices[0] <= 4.0;
  return prices[1] <= 5.0 && prices[0] <= 4.5;
}

const VALID_FORMATIONS: Array<[number, number, number, number]> = [
  [1, 3, 5, 2],
  [1, 3, 4, 3],
  [1, 4, 4, 2],
  [1, 4, 3, 3],
  [1, 4, 5, 1],
  [1, 5, 3, 2],
  [1, 5, 4, 1],
];

interface StartingXIResult {
  formation: string;
  startingXp: number;
  starters: Player[];
  bench: Player[];
}

function pickBestStartingXI(squad: Player[], scoreKey: "xp" = "xp"): StartingXIResult {
  const gkps = squad.filter((p) => p.position === "GKP").sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));
  const defs = squad.filter((p) => p.position === "DEF").sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));
  const mids = squad.filter((p) => p.position === "MID").sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));
  const fwds = squad.filter((p) => p.position === "FWD").sort((a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0));

  let bestFormation = "3-4-3";
  let bestScore = -1;
  let bestStarters: Player[] = [];
  let bestBench: Player[] = [];

  for (const [nGkp, nDef, nMid, nFwd] of VALID_FORMATIONS) {
    const starters = [
      ...gkps.slice(0, nGkp),
      ...defs.slice(0, nDef),
      ...mids.slice(0, nMid),
      ...fwds.slice(0, nFwd),
    ];
    const totalScore = starters.reduce((acc, p) => acc + (p[scoreKey] || 0), 0);
    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestFormation = `${nDef}-${nMid}-${nFwd}`;
      bestStarters = starters;
      const benchGk = gkps.slice(nGkp);
      const benchOutfield = [...defs.slice(nDef), ...mids.slice(nMid), ...fwds.slice(nFwd)].sort(
        (a, b) => (b[scoreKey] || 0) - (a[scoreKey] || 0)
      );
      bestBench = [...benchGk, ...benchOutfield];
    }
  }

  return {
    formation: bestFormation,
    startingXp: Math.round(bestScore * 100) / 100,
    starters: bestStarters,
    bench: bestBench,
  };
}

function evaluateSquadObjective(squad: Player[]): number {
  const xi = pickBestStartingXI(squad);
  const benchScore = xi.bench.reduce((acc, p) => acc + (p.xp || 0), 0);
  return xi.startingXp + 0.05 * benchScore;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const budgetParam = searchParams.get("budget");
    const horizonParam = searchParams.get("horizon");

    const parsedBudget = budgetParam ? parseFloat(budgetParam) : 100.0;
    const budget = isNaN(parsedBudget)
      ? 100.0
      : Math.max(65.0, Math.min(120.0, Math.round(parsedBudget * 10) / 10));

    const parsedHorizon = horizonParam ? parseInt(horizonParam, 10) : 1;
    const horizon = [1, 3, 5].includes(parsedHorizon) ? parsedHorizon : 1;

    const allPlayers = loadSimulationPlayers(horizon);
    if (!allPlayers || allPlayers.length === 0) {
      return NextResponse.json(
        { error: `No simulation data available for horizon ${horizon}` },
        { status: 404 }
      );
    }

    const histories = loadPlayerHistories();
    const sim5Map = loadSim5Map();

    // 1. Initial squad setup: start with cheapest viable players to guarantee budget feasibility
    const pool = allPlayers.filter((p) => p.price > 0 && p.status !== "u");
    const posTargets: Record<string, number> = { GKP: 2, DEF: 5, MID: 5, FWD: 3 };
    const teamCounts: Record<string, number> = {};
    const currentSquad: Player[] = [];
    const currentIds = new Set<number>();
    const posCounts: Record<string, number> = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };

    for (const pos of ["GKP", "DEF", "MID", "FWD"]) {
      const cheapest = pool
        .filter((p) => p.position === pos)
        .sort((a, b) => a.price - b.price || (b.xp || 0) - (a.xp || 0));

      for (const p of cheapest) {
        if (posCounts[pos] >= posTargets[pos]) break;
        const t = p.team;
        if ((teamCounts[t] || 0) >= 3) continue;
        if (pos === "GKP") {
          const existingGk = currentSquad.find((x) => x.position === "GKP");
          if (existingGk && !isValidGkpPair(existingGk, p)) continue;
        }
        currentSquad.push(p);
        currentIds.add(p.id);
        posCounts[pos]++;
        teamCounts[t] = (teamCounts[t] || 0) + 1;
      }
    }

    let totalCost = currentSquad.reduce((acc, p) => acc + p.price, 0);
    let available = pool.filter((p) => !currentIds.has(p.id));
    let currentScore = evaluateSquadObjective(currentSquad);

    // 2. Direct Starting XI local search upgrades
    for (let iter = 0; iter < 150; iter++) {
      let bestSwap: {
        i: number;
        curr: Player;
        cand: Player;
        costDiff: number;
        newScore: number;
      } | null = null;
      let bestScoreGain = 0;

      for (let i = 0; i < currentSquad.length; i++) {
        const curr = currentSquad[i];
        for (let j = 0; j < available.length; j++) {
          const cand = available[j];
          if (cand.position !== curr.position) continue;
          const candTeam = cand.team;
          const currTeam = curr.team;
          if (candTeam !== currTeam && (teamCounts[candTeam] || 0) >= 3) continue;
          if (curr.position === "GKP") {
            const otherGk = currentSquad.find((x) => x.position === "GKP" && x.id !== curr.id);
            if (otherGk && !isValidGkpPair(otherGk, cand)) continue;
          }
          const costDiff = cand.price - curr.price;
          if (totalCost + costDiff > budget + 0.001) continue;

          // Optimization prune: if candidate xP is worse or equal and cost is equal or greater, skip
          if (cand.xp <= curr.xp && costDiff >= 0) continue;

          // Tentative swap evaluation
          currentSquad[i] = cand;
          const newScore = evaluateSquadObjective(currentSquad);
          const gain = newScore - currentScore;
          currentSquad[i] = curr; // revert

          if (gain > bestScoreGain) {
            bestScoreGain = gain;
            bestSwap = { i, curr, cand, costDiff, newScore };
          }
        }
      }

      if (bestSwap && bestScoreGain > 0.005) {
        const { i, curr, cand, costDiff, newScore } = bestSwap;
        currentSquad[i] = cand;
        currentIds.delete(curr.id);
        currentIds.add(cand.id);
        available = available.filter((p) => p.id !== cand.id);
        available.push(curr);
        teamCounts[curr.team] = (teamCounts[curr.team] || 1) - 1;
        teamCounts[cand.team] = (teamCounts[cand.team] || 0) + 1;
        totalCost += costDiff;
        currentScore = newScore;
      } else {
        break;
      }
    }

    // 3. Extract Starting XI & Bench
    const xi = pickBestStartingXI(currentSquad);
    const startersRaw = xi.starters;
    const benchRaw = xi.bench;

    // 4. Captain & Vice-Captain
    const captainCandidates = [...startersRaw].sort((a, b) => {
      const aHaul = a.haul_prob || 0;
      const bHaul = b.haul_prob || 0;
      if (Math.abs(bHaul - aHaul) > 3.0) return bHaul - aHaul;
      const aCeil = a.ceiling || 0;
      const bCeil = b.ceiling || 0;
      if (Math.abs(bCeil - aCeil) > 1.0) return bCeil - aCeil;
      return (b.xp || 0) - (a.xp || 0);
    });

    const capP = captainCandidates[0] || startersRaw[0];
    const vcP = captainCandidates[1] || (startersRaw[1] ? startersRaw[1] : startersRaw[0]);

    // 5. Enrich SquadPlayer objects
    const enrichPlayer = (p: Player, isStarter: boolean, benchOrder?: number): SquadPlayer => {
      const p5 = sim5Map.get(p.id);
      const history = histories[String(p.id)] || [];
      return {
        ...p,
        fixtures_5: p5?.fixtures || p.fixtures || [],
        five_gw: p5 || p,
        history,
        is_starter: isStarter,
        bench_order: benchOrder,
        is_captain: p.id === capP.id,
        is_vice_captain: p.id === vcP.id,
      };
    };

    const starters = startersRaw.map((p) => enrichPlayer(p, true));
    const bench = benchRaw.map((p, i) => enrichPlayer(p, false, i + 1));

    const finalCost = Math.round(currentSquad.reduce((acc, p) => acc + p.price, 0) * 10) / 10;
    const bankRemaining = Math.round(Math.max(0, budget - finalCost) * 10) / 10;
    const startingXiXp = Math.round(starters.reduce((acc, p) => acc + (p.xp || 0), 0) * 100) / 100;
    const capXp = Math.round((capP.xp || 0) * 100) / 100;
    const totalMatchXp = Math.round((startingXiXp + capXp) * 100) / 100;
    const fullSquadXp = Math.round((startingXiXp + bench.reduce((acc, p) => acc + (p.xp || 0), 0)) * 100) / 100;

    const firstFixCap = capP.fixtures?.[0];
    const firstFixVc = vcP.fixtures?.[0];
    const oppCap = firstFixCap?.opponent || "Upcoming";
    const oppVc = firstFixVc?.opponent || "Upcoming";

    const captainInfo: SquadCaptainInfo = {
      id: capP.id,
      name: capP.name,
      full_name: capP.full_name,
      team: capP.team,
      position: capP.position,
      price: capP.price,
      xp: capXp,
      doubled_xp: Math.round(capXp * 2 * 100) / 100,
      selected_by_percent: capP.selected_by_percent,
      opponent: oppCap,
      fdr: firstFixCap?.fdr || 3,
    };

    const viceCaptainInfo: SquadCaptainInfo = {
      id: vcP.id,
      name: vcP.name,
      full_name: vcP.full_name,
      team: vcP.team,
      position: vcP.position,
      price: vcP.price,
      xp: Math.round((vcP.xp || 0) * 100) / 100,
      selected_by_percent: vcP.selected_by_percent,
      opponent: oppVc,
      fdr: firstFixVc?.fdr || 3,
    };

    const formationLines = {
      gkp: starters.filter((p) => p.position === "GKP"),
      def: starters.filter((p) => p.position === "DEF"),
      mid: starters.filter((p) => p.position === "MID"),
      fwd: starters.filter((p) => p.position === "FWD"),
    };

    // Detect Gameweek
    let gw = 1;
    for (const p of allPlayers) {
      if (p.fixtures && p.fixtures[0]?.event) {
        gw = p.fixtures[0].event;
        break;
      }
    }

    const title =
      horizon === 1
        ? `Custom Budget Optimal Squad: Gameweek ${gw} (£${budget.toFixed(1)}m Max Value)`
        : `Custom Budget Optimal Squad: Next ${horizon} GWs (GW ${gw}–${gw + horizon - 1}) (£${budget.toFixed(1)}m Max Value)`;

    const notes: string[] = [
      `Squad mathematically optimized under your custom £${budget.toFixed(1)}m team value limit (${finalCost.toFixed(1)}m invested, £${bankRemaining.toFixed(1)}m remaining in the bank).`,
      `${xi.formation} formation maximizing starting XI output (${startingXiXp.toFixed(2)} base xP, ${totalMatchXp.toFixed(2)} with captaincy applied).`,
      `Captaincy awarded to ${capP.name} (${capXp.toFixed(2)} xP) vs ${oppCap} with ${vcP.name} as vice-captain.`,
      `Goalkeeper pairing complies with FPL starting rules, featuring ${formationLines.gkp[0]?.name || "starting keeper"} (£${formationLines.gkp[0]?.price.toFixed(1) || "4.5"}m) with reserve cover.`,
      `Bench composed of efficient budget enablers to maximize funds in the starting XI while maintaining autosub protection.`,
    ];

    const responseData: OptimalSquad = {
      id: `custom_budget_${budget}_gw${gw}_h${horizon}`,
      gameweek: gw,
      horizon,
      title,
      formation: xi.formation,
      budget,
      total_cost: finalCost,
      bank_remaining: bankRemaining,
      starting_xi_xp: startingXiXp,
      total_match_xp: totalMatchXp,
      full_squad_xp: fullSquadXp,
      captain: captainInfo,
      vice_captain: viceCaptainInfo,
      formation_lines: formationLines,
      starters,
      bench,
      notes,
    };

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Budget optimizer error:", err);
    return NextResponse.json(
      { error: "Failed to optimize squad for custom budget", details: message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const budget = typeof body.budget === "number" ? body.budget : parseFloat(body.budget || "100.0");
    const horizon = typeof body.horizon === "number" ? body.horizon : parseInt(body.horizon || "1", 10);

    const url = new URL(req.url);
    url.searchParams.set("budget", String(budget));
    url.searchParams.set("horizon", String(horizon));

    return GET(new NextRequest(url));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Invalid JSON payload", details: message },
      { status: 400 }
    );
  }
}
