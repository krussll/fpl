import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  Player,
  SquadPlayer,
  SquadCaptainInfo,
  TransferRecommendation,
  TransferAlternative,
  UserTeamTransferResponse,
} from "@/types/player";

interface BootstrapElement {
  id: number;
  web_name: string;
  first_name: string;
  second_name: string;
  element_type: number;
  team: number;
  now_cost: number;
  selected_by_percent: string;
  status: string;
  minutes: number;
  ep_next?: string;
  chance_of_playing_next_round?: number | null;
}

interface BootstrapData {
  elements: BootstrapElement[];
  teams: Array<{ id: number; name: string; short_name: string }>;
}

let cachedSimMap: Record<number, Map<number, Player>> = {};
let cachedBootstrap: BootstrapData | null = null;

function loadBootstrap(): BootstrapData | null {
  if (cachedBootstrap) return cachedBootstrap;

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", "bootstrap_static.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "bootstrap_static.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        cachedBootstrap = JSON.parse(raw);
        return cachedBootstrap;
      } catch (err) {
        console.error("Failed to parse bootstrap_static.json:", err);
      }
    }
  }
  return null;
}

function loadSimulationMap(horizon: number): Map<number, Player> {
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
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players)) {
          const map = new Map<number, Player>();
          for (const pl of parsed.players) {
            map.set(pl.id, pl);
          }
          cachedSimMap[safeH] = map;
          return map;
        }
      } catch (err) {
        console.error(`Failed to load simulation cache for horizon ${safeH}:`, err);
      }
    }
  }
  return new Map<number, Player>();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamIdParam = searchParams.get("teamId") || searchParams.get("id");
    const horizonParam = parseInt(searchParams.get("horizon") || "1", 10);
    const horizon = [1, 3, 5].includes(horizonParam) ? horizonParam : 1;
    const freeTransfersParam = parseInt(
      searchParams.get("freeTransfers") || searchParams.get("transfers") || "1",
      10
    );
    const freeTransfers = Math.min(Math.max(isNaN(freeTransfersParam) ? 1 : freeTransfersParam, 1), 5);

    if (!teamIdParam) {
      return NextResponse.json(
        { error: "Missing required 'teamId' parameter. Enter your FPL team ID." },
        { status: 400 }
      );
    }

    const teamId = parseInt(teamIdParam.trim(), 10);
    if (isNaN(teamId) || teamId <= 0) {
      return NextResponse.json(
        { error: "Invalid team ID format. Team ID must be a positive integer." },
        { status: 400 }
      );
    }

    // 1. Fetch manager details from official FPL API
    const entryUrl = `https://fantasy.premierleague.com/api/entry/${teamId}/`;
    const fplHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "application/json",
    };

    let entryRes: Response;
    try {
      entryRes = await fetch(entryUrl, {
        headers: fplHeaders,
        next: { revalidate: 120 },
      });
    } catch (netErr: any) {
      return NextResponse.json(
        { error: `Network error connecting to official FPL API: ${netErr?.message || netErr}` },
        { status: 502 }
      );
    }

    if (entryRes.status === 404) {
      return NextResponse.json(
        {
          error: `FPL Team ID ${teamId} not found. Please check your team ID from your fantasy.premierleague.com team URL (e.g. /entry/${teamId}/event/...).`,
        },
        { status: 404 }
      );
    }

    if (!entryRes.ok) {
      return NextResponse.json(
        { error: `FPL API returned status ${entryRes.status} for team ID ${teamId}.` },
        { status: entryRes.status }
      );
    }

    const entryData = await entryRes.json();
    let currentEvent = entryData.current_event || 1;

    // 2. Fetch picks for the active event
    let picksUrl = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`;
    let picksRes = await fetch(picksUrl, {
      headers: fplHeaders,
      next: { revalidate: 120 },
    });

    if (!picksRes.ok && currentEvent > 1) {
      // Fallback to previous gameweek if current gameweek picks are not yet published
      currentEvent -= 1;
      picksUrl = `https://fantasy.premierleague.com/api/entry/${teamId}/event/${currentEvent}/picks/`;
      picksRes = await fetch(picksUrl, {
        headers: fplHeaders,
        next: { revalidate: 120 },
      });
    }

    if (!picksRes.ok) {
      return NextResponse.json(
        { error: `Failed to load squad picks for team ${teamId} (Gameweek ${currentEvent}).` },
        { status: picksRes.status }
      );
    }

    const picksData = await picksRes.json();
    const rawPicks: Array<{
      element: number;
      position: number;
      multiplier: number;
      is_captain: boolean;
      is_vice_captain: boolean;
    }> = picksData.picks || [];

    if (rawPicks.length < 15) {
      return NextResponse.json(
        { error: `Incomplete squad returned for team ${teamId} (${rawPicks.length} of 15 players).` },
        { status: 500 }
      );
    }

    // 3. Load simulation map and bootstrap data
    const simMap = loadSimulationMap(horizon);
    const bootstrap = loadBootstrap();
    const elementsMap = new Map<number, BootstrapElement>();
    const teamsMap = new Map<number, string>();

    if (bootstrap) {
      bootstrap.elements.forEach((el) => elementsMap.set(el.id, el));
      bootstrap.teams.forEach((t) => teamsMap.set(t.id, t.name));
    }

    const posMap: Record<number, "GKP" | "DEF" | "MID" | "FWD"> = {
      1: "GKP",
      2: "DEF",
      3: "MID",
      4: "FWD",
    };

    // 4. Transform squad picks into SquadPlayer objects
    const allSquadPlayers: SquadPlayer[] = rawPicks.map((pick) => {
      const pId = pick.element;
      const simP = simMap.get(pId);
      const bootEl = elementsMap.get(pId);
      const pos = bootEl ? posMap[bootEl.element_type] || "MID" : "MID";
      const teamName = bootEl ? teamsMap.get(bootEl.team) || "Premier League" : "Premier League";

      const isStarter = pick.position <= 11;
      const benchOrder = pick.position > 11 ? pick.position - 11 : undefined;

      if (simP) {
        return {
          ...simP,
          is_starter: isStarter,
          bench_order: benchOrder,
          is_captain: pick.is_captain,
          is_vice_captain: pick.is_vice_captain,
        };
      }

      // Fallback for players without simulation entry
      const price = bootEl ? bootEl.now_cost / 10.0 : 5.0;
      const xp = bootEl ? parseFloat(bootEl.ep_next || "2.0") || 2.0 : 2.0;
      const own = bootEl ? parseFloat(bootEl.selected_by_percent) || 1.0 : 1.0;

      return {
        id: pId,
        name: bootEl?.web_name || `Player ${pId}`,
        full_name: bootEl ? `${bootEl.first_name} ${bootEl.second_name}` : `Player ${pId}`,
        team: teamName,
        team_id: bootEl?.team || 1,
        position: pos,
        price,
        minutes: bootEl?.minutes || 0,
        status: bootEl?.status || "a",
        form: 0.0,
        selected_by_percent: own,
        xp,
        ppm: price > 0 ? parseFloat((xp / price).toFixed(2)) : 0.0,
        floor: 1.0,
        ceiling: 6.0,
        haul_prob: 2.0,
        defcon_prob: 5.0,
        is_starter: isStarter,
        bench_order: benchOrder,
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
      };
    });

    const starters = allSquadPlayers.filter((p) => p.is_starter);
    const bench = allSquadPlayers.filter((p) => !p.is_starter).sort((a, b) => (a.bench_order || 0) - (b.bench_order || 0));

    // Formation lines
    const gkpLine = starters.filter((p) => p.position === "GKP");
    const defLine = starters.filter((p) => p.position === "DEF");
    const midLine = starters.filter((p) => p.position === "MID");
    const fwdLine = starters.filter((p) => p.position === "FWD");
    const formationStr = `${defLine.length}-${midLine.length}-${fwdLine.length}`;

    // Captain & Vice Captain
    let captainPlayer = allSquadPlayers.find((p) => p.is_captain) || starters[0];
    let viceCaptainPlayer = allSquadPlayers.find((p) => p.is_vice_captain) || starters[1] || starters[0];

    const captainInfo: SquadCaptainInfo = {
      id: captainPlayer.id,
      name: captainPlayer.name,
      full_name: captainPlayer.full_name,
      team: captainPlayer.team,
      position: captainPlayer.position,
      price: captainPlayer.price,
      xp: captainPlayer.xp,
      doubled_xp: captainPlayer.xp * 2,
      selected_by_percent: captainPlayer.selected_by_percent,
      opponent: captainPlayer.fixtures?.[0]?.opponent || "Upcoming",
      fdr: captainPlayer.fixtures?.[0]?.fdr || 3,
    };

    const viceCaptainInfo: SquadCaptainInfo = {
      id: viceCaptainPlayer.id,
      name: viceCaptainPlayer.name,
      full_name: viceCaptainPlayer.full_name,
      team: viceCaptainPlayer.team,
      position: viceCaptainPlayer.position,
      price: viceCaptainPlayer.price,
      xp: viceCaptainPlayer.xp,
      selected_by_percent: viceCaptainPlayer.selected_by_percent,
      opponent: viceCaptainPlayer.fixtures?.[0]?.opponent || "Upcoming",
      fdr: viceCaptainPlayer.fixtures?.[0]?.fdr || 3,
    };

    // Squad financials & metrics
    const bank = (picksData.entry_history?.bank || 0) / 10.0;
    const squadValue = (picksData.entry_history?.value || 1000) / 10.0;
    const totalCost = parseFloat(allSquadPlayers.reduce((sum, p) => sum + p.price, 0).toFixed(1));

    // Starting XI xP (doubling captain)
    const baseXiXp = starters.reduce((sum, p) => sum + p.xp, 0);
    const startingXiXp = parseFloat((baseXiXp + captainInfo.xp).toFixed(2));
    const startingXiOwnership = parseFloat(
      (starters.reduce((sum, p) => sum + p.selected_by_percent, 0) / Math.max(1, starters.length)).toFixed(1)
    );

    // 5. Transfer Recommendation Engine (Multi-Transfer Solver up to freeTransfers)
    const squadIds = new Set(allSquadPlayers.map((p) => p.id));
    const teamCounts: Record<number, number> = {};
    allSquadPlayers.forEach((p) => {
      teamCounts[p.team_id] = (teamCounts[p.team_id] || 0) + 1;
    });

    // Pool of all available replacement players from simulation
    const allCandidates = Array.from(simMap.values()).filter((p) => {
      if (squadIds.has(p.id)) return false;
      // Filter out permanently unavailable players
      if (p.status === "u" || p.status === "i" || p.status === "s") return false;
      const el = elementsMap.get(p.id);
      if (el && el.chance_of_playing_next_round !== null && el.chance_of_playing_next_round !== undefined) {
        if (el.chance_of_playing_next_round < 50) return false;
      }
      return true;
    });

    // Helper: GK strategy check (Strategy 1: Set-and-Forget, Strategy 2: Rotating Budget)
    function isExpectedStartingGkp(p: Player | SquadPlayer): boolean {
      if (p.position !== "GKP") return false;
      const el = elementsMap.get(p.id);
      if (p.start_prob !== undefined && p.start_prob >= 50.0) return true;
      if (p.minutes >= 180 && (p.start_prob === undefined || p.start_prob >= 25.0)) return true;
      if (el && el.chance_of_playing_next_round !== null && el.chance_of_playing_next_round !== undefined) {
        if (el.chance_of_playing_next_round >= 75 && (bootElMinutes(p.id) >= 180 || p.minutes >= 180)) return true;
      }
      return false;
    }

    function bootElMinutes(id: number): number {
      const el = elementsMap.get(id);
      return el?.minutes || 0;
    }

    function isValidGkpPair(g1: Player | SquadPlayer, g2: Player | SquadPlayer): boolean {
      if (!isExpectedStartingGkp(g1) && !isExpectedStartingGkp(g2)) return false;
      const prices = [g1.price, g2.price].sort((a, b) => a - b);
      if (prices[1] > 5.0) {
        return prices[0] <= 4.0;
      }
      return prices[1] <= 5.0 && prices[0] <= 4.5;
    }

    // Build raw candidate moves per squad player
    interface CandidateMove {
      player_out: SquadPlayer;
      player_in: Player;
      cost_diff: number;
      xp_gain: number;
      ownership_gain: number;
      ceiling_gain: number;
      haul_prob_gain: number;
      points_score: number;
      template_score: number;
      haul_score: number;
    }

    const playerReplacementsMap: Record<number, TransferAlternative[]> = {};
    const allMovesByPlayer: Map<number, CandidateMove[]> = new Map();

    for (const pOut of allSquadPlayers) {
      const outTeam = pOut.team_id;
      const maxAffordableSingle = parseFloat((pOut.price + bank + 0.001).toFixed(1));
      const pOutReplacements: TransferAlternative[] = [];
      const moves: CandidateMove[] = [];

      for (const pIn of allCandidates) {
        if (pIn.position !== pOut.position) continue;

        const xpGain = parseFloat((pIn.xp - pOut.xp).toFixed(2));
        const ownGain = parseFloat((pIn.selected_by_percent - pOut.selected_by_percent).toFixed(1));
        const ceilGain = parseFloat((pIn.ceiling - pOut.ceiling).toFixed(1));
        const haulGain = parseFloat((pIn.haul_prob - pOut.haul_prob).toFixed(1));
        const costDiff = parseFloat((pIn.price - pOut.price).toFixed(1));
        const newBankSingle = parseFloat((bank - costDiff).toFixed(1));

        // Weighting formulas
        const starterWeight = pOut.is_starter ? 1.0 : 0.65;
        const outStatusPenalty = ["i", "u", "s", "d"].includes(pOut.status) ? 1.8 : 0.0;
        const pointsScore = (xpGain + outStatusPenalty) * starterWeight;
        const templateScore = ownGain * 0.7 + xpGain * 5.0;
        const haulScore = ceilGain * 1.8 + haulGain * 1.2 + xpGain * 0.8;

        const move: CandidateMove = {
          player_out: pOut,
          player_in: pIn,
          cost_diff: costDiff,
          xp_gain: xpGain,
          ownership_gain: ownGain,
          ceiling_gain: ceilGain,
          haul_prob_gain: haulGain,
          points_score: pointsScore,
          template_score: templateScore,
          haul_score: haulScore,
        };
        moves.push(move);

        // Single replacement check for quick inspection drawer
        if (pIn.price <= maxAffordableSingle) {
          const currentCount = teamCounts[pIn.team_id] || 0;
          const availableSlots = outTeam === pIn.team_id ? 3 - (currentCount - 1) : 3 - currentCount;
          if (availableSlots > 0) {
            pOutReplacements.push({
              player_out: pOut,
              player_in: pIn,
              xp_gain: xpGain,
              ownership_gain: ownGain,
              ceiling_gain: ceilGain,
              haul_prob_gain: haulGain,
              cost_diff: costDiff,
              new_bank: newBankSingle,
            });
          }
        }
      }

      pOutReplacements.sort((a, b) => b.xp_gain - a.xp_gain);
      playerReplacementsMap[pOut.id] = pOutReplacements.slice(0, 4);
      allMovesByPlayer.set(pOut.id, moves);
    }

    // Multi-Transfer Optimizer (Solves up to freeTransfers)
    interface SolvedPlan {
      moves: CandidateMove[];
      total_score: number;
      total_xp_gain: number;
      total_ownership_gain: number;
      total_ceiling_gain: number;
      total_haul_prob_gain: number;
      total_cost_diff: number;
      new_bank: number;
    }

    function solveOptimalPlan(
      strategy: "points" | "template" | "haul",
      maxAllowedTransfers: number
    ): SolvedPlan {
      const scoreKey =
        strategy === "points"
          ? "points_score"
          : strategy === "template"
          ? "template_score"
          : "haul_score";

      // Build pruned candidate move lists per player for fast search
      interface PlayerMoveEntry {
        player: SquadPlayer;
        moves: CandidateMove[];
        maxScore: number;
      }

      const playerEntries: PlayerMoveEntry[] = [];

      for (const pOut of allSquadPlayers) {
        const rawMoves = allMovesByPlayer.get(pOut.id) || [];
        let filtered = rawMoves;

        if (strategy === "template") {
          // Prioritize high ownership players
          const highOwn = rawMoves.filter((m) => m.player_in.selected_by_percent >= 12.0 && m.xp_gain >= -1.5);
          filtered = highOwn.length >= 4 ? highOwn : rawMoves;
        } else if (strategy === "haul") {
          const highHaul = rawMoves.filter((m) => m.ceiling_gain > 0 || m.haul_prob_gain > 0);
          filtered = highHaul.length >= 4 ? highHaul : rawMoves;
        }

        const sortedByScore = [...filtered].sort((a, b) => b[scoreKey] - a[scoreKey]);
        const topUpgrades = sortedByScore.slice(0, 7);
        // Cheap budget enablers to allow funding combos across multiple transfers
        const cheapestEnablers = [...rawMoves]
          .filter((m) => m.player_in.minutes >= 180 && m.cost_diff < 0)
          .sort((a, b) => a.cost_diff - b.cost_diff || b[scoreKey] - a[scoreKey])
          .slice(0, 3);

        const seenIn = new Set<number>();
        const combinedMoves: CandidateMove[] = [];
        for (const m of [...topUpgrades, ...cheapestEnablers]) {
          if (!seenIn.has(m.player_in.id)) {
            seenIn.add(m.player_in.id);
            combinedMoves.push(m);
          }
        }

        if (combinedMoves.length > 0) {
          const maxScore = Math.max(...combinedMoves.map((m) => m[scoreKey]));
          playerEntries.push({
            player: pOut,
            moves: combinedMoves,
            maxScore,
          });
        }
      }

      // Precompute suffix max scores for branch-and-bound upper bounding
      const suffixMax: number[][] = new Array(playerEntries.length + 1).fill([]);
      for (let i = playerEntries.length - 1; i >= 0; i--) {
        const remaining = playerEntries
          .slice(i)
          .map((p) => p.maxScore)
          .sort((a, b) => b - a);
        suffixMax[i] = remaining;
      }

      // Current squad goalkeepers for validation
      const squadGkps = allSquadPlayers.filter((p) => p.position === "GKP");

      // Search best plan for a specific size m
      function searchSize(m: number): SolvedPlan | null {
        let bestMoves: CandidateMove[] | null = null;
        let bestScore = -Infinity;

        // Clone current club counts
        const currentClubCounts: Record<number, number> = { ...teamCounts };

        function branch(
          entryIdx: number,
          chosen: CandidateMove[],
          currentCost: number,
          currentScore: number
        ) {
          if (chosen.length === m) {
            if (currentScore > bestScore) {
              // Verify GK rule if any GK involved
              const gkOut = chosen.filter((c) => c.player_out.position === "GKP");
              if (gkOut.length > 0) {
                let finalGk1 = squadGkps[0];
                let finalGk2 = squadGkps[1];
                if (gkOut.length === 1) {
                  const outId = gkOut[0].player_out.id;
                  const replacedIn = gkOut[0].player_in;
                  if (finalGk1.id === outId) finalGk1 = replacedIn as any;
                  else finalGk2 = replacedIn as any;
                } else if (gkOut.length === 2) {
                  finalGk1 = gkOut[0].player_in as any;
                  finalGk2 = gkOut[1].player_in as any;
                }
                if (!isValidGkpPair(finalGk1, finalGk2)) return;
              }

              bestScore = currentScore;
              bestMoves = [...chosen];
            }
            return;
          }

          const needed = m - chosen.length;
          if (playerEntries.length - entryIdx < needed) return;

          // Upper-bound pruning: even taking the absolute top remaining scores cannot beat bestScore
          const maxPossibleRemaining = (suffixMax[entryIdx] || [])
            .slice(0, needed)
            .reduce((sum, s) => sum + s, 0);
          if (currentScore + maxPossibleRemaining <= bestScore) return;

          for (let i = entryIdx; i < playerEntries.length; i++) {
            const entry = playerEntries[i];
            const pOut = entry.player;

            for (const move of entry.moves) {
              const newCost = currentCost + move.cost_diff;
              if (newCost > bank + 0.001) continue;

              const pIn = move.player_in;
              // Unique incoming player check
              if (chosen.some((c) => c.player_in.id === pIn.id)) continue;

              // Club limit check
              const outClub = pOut.team_id;
              const inClub = pIn.team_id;
              currentClubCounts[outClub] -= 1;
              const nextInClubCount = (currentClubCounts[inClub] || 0) + 1;

              if (nextInClubCount <= 3) {
                currentClubCounts[inClub] = nextInClubCount;
                chosen.push(move);

                branch(i + 1, chosen, newCost, currentScore + move[scoreKey]);

                chosen.pop();
                currentClubCounts[inClub] -= 1;
              }
              currentClubCounts[outClub] += 1;
            }
          }
        }

        branch(0, [], 0, 0);

        if (!bestMoves || (bestMoves as CandidateMove[]).length === 0) return null;

        const movesArr: CandidateMove[] = bestMoves;
        const totalXpGain = parseFloat(movesArr.reduce((s, m) => s + m.xp_gain, 0).toFixed(2));
        const totalOwnGain = parseFloat(movesArr.reduce((s, m) => s + m.ownership_gain, 0).toFixed(1));
        const totalCeilGain = parseFloat(movesArr.reduce((s, m) => s + m.ceiling_gain, 0).toFixed(1));
        const totalHaulGain = parseFloat(movesArr.reduce((s, m) => s + m.haul_prob_gain, 0).toFixed(1));
        const totalCostDiff = parseFloat(movesArr.reduce((s, m) => s + m.cost_diff, 0).toFixed(1));
        const newBank = parseFloat((bank - totalCostDiff).toFixed(1));

        return {
          moves: movesArr,
          total_score: bestScore,
          total_xp_gain: totalXpGain,
          total_ownership_gain: totalOwnGain,
          total_ceiling_gain: totalCeilGain,
          total_haul_prob_gain: totalHaulGain,
          total_cost_diff: totalCostDiff,
          new_bank: newBank,
        };
      }

      // Evaluate plan sizes from 1 up to maxAllowedTransfers
      let chosenPlan: SolvedPlan | null = null;
      for (let m = 1; m <= maxAllowedTransfers; m++) {
        const planM = searchSize(m);
        if (!planM) continue;

        if (!chosenPlan) {
          chosenPlan = planM;
        } else {
          // Only upgrade to m transfers if it strictly improves score by at least +0.15
          // (prevents burning an extra free transfer for marginal/lateral moves)
          if (planM.total_score > chosenPlan.total_score + 0.15) {
            chosenPlan = planM;
          }
        }
      }

      // Fallback: if search somehow yielded null, take top single move
      if (!chosenPlan) {
        const fallbackSingle = playerEntries[0]?.moves[0];
        if (fallbackSingle) {
          chosenPlan = {
            moves: [fallbackSingle],
            total_score: fallbackSingle[scoreKey],
            total_xp_gain: fallbackSingle.xp_gain,
            total_ownership_gain: fallbackSingle.ownership_gain,
            total_ceiling_gain: fallbackSingle.ceiling_gain,
            total_haul_prob_gain: fallbackSingle.haul_prob_gain,
            total_cost_diff: fallbackSingle.cost_diff,
            new_bank: parseFloat((bank - fallbackSingle.cost_diff).toFixed(1)),
          };
        } else {
          // Absolute dummy fallback
          const dummy = allSquadPlayers[0];
          chosenPlan = {
            moves: [],
            total_score: 0,
            total_xp_gain: 0,
            total_ownership_gain: 0,
            total_ceiling_gain: 0,
            total_haul_prob_gain: 0,
            total_cost_diff: 0,
            new_bank: bank,
          };
        }
      }

      return chosenPlan;
    }

    // Solve for each of the 3 distinct strategies
    const planPoints = solveOptimalPlan("points", freeTransfers);
    const planTemplate = solveOptimalPlan("template", freeTransfers);
    const planHaul = solveOptimalPlan("haul", freeTransfers);

    // Compute alternative single transfers for the alternatives accordion
    const flatSingleMoves: CandidateMove[] = [];
    allMovesByPlayer.forEach((moves) => {
      for (const m of moves) {
        if (m.cost_diff <= bank + 0.001) {
          flatSingleMoves.push(m);
        }
      }
    });

    const pointsAlts: TransferAlternative[] = [...flatSingleMoves]
      .sort((a, b) => b.points_score - a.points_score)
      .filter((m) => !planPoints.moves.some((pm) => pm.player_in.id === m.player_in.id))
      .slice(0, 3)
      .map((t) => ({
        player_out: t.player_out,
        player_in: t.player_in,
        xp_gain: t.xp_gain,
        ownership_gain: t.ownership_gain,
        ceiling_gain: t.ceiling_gain,
        haul_prob_gain: t.haul_prob_gain,
        cost_diff: t.cost_diff,
        new_bank: parseFloat((bank - t.cost_diff).toFixed(1)),
      }));

    const templateAlts: TransferAlternative[] = [...flatSingleMoves]
      .filter((m) => m.player_in.selected_by_percent >= 15.0)
      .sort((a, b) => b.template_score - a.template_score)
      .filter((m) => !planTemplate.moves.some((pm) => pm.player_in.id === m.player_in.id))
      .slice(0, 3)
      .map((t) => ({
        player_out: t.player_out,
        player_in: t.player_in,
        xp_gain: t.xp_gain,
        ownership_gain: t.ownership_gain,
        ceiling_gain: t.ceiling_gain,
        haul_prob_gain: t.haul_prob_gain,
        cost_diff: t.cost_diff,
        new_bank: parseFloat((bank - t.cost_diff).toFixed(1)),
      }));

    const haulAlts: TransferAlternative[] = [...flatSingleMoves]
      .filter((m) => m.ceiling_gain > 0 && m.haul_prob_gain >= 0)
      .sort((a, b) => b.haul_score - a.haul_score)
      .filter((m) => !planHaul.moves.some((pm) => pm.player_in.id === m.player_in.id))
      .slice(0, 3)
      .map((t) => ({
        player_out: t.player_out,
        player_in: t.player_in,
        xp_gain: t.xp_gain,
        ownership_gain: t.ownership_gain,
        ceiling_gain: t.ceiling_gain,
        haul_prob_gain: t.haul_prob_gain,
        cost_diff: t.cost_diff,
        new_bank: parseFloat((bank - t.cost_diff).toFixed(1)),
      }));

    const horizonSuffix = horizon > 1 ? ` across next ${horizon} gameweeks` : " for the upcoming gameweek";

    // Helper: Build user-facing recommendation object
    function buildRecommendation(
      type: "points_optimized" | "template_protection" | "haul_potential",
      plan: SolvedPlan,
      alternatives: TransferAlternative[]
    ): TransferRecommendation {
      const count = plan.moves.length;
      const firstMove = plan.moves[0] || {
        player_out: allSquadPlayers[0],
        player_in: allSquadPlayers[0] as any,
        xp_gain: 0,
        ownership_gain: 0,
        ceiling_gain: 0,
        haul_prob_gain: 0,
        cost_diff: 0,
      };

      const transferMoves = plan.moves.map((m) => ({
        player_out: m.player_out,
        player_in: m.player_in,
        xp_gain: m.xp_gain,
        ownership_gain: m.ownership_gain,
        ceiling_gain: m.ceiling_gain,
        haul_prob_gain: m.haul_prob_gain,
        cost_diff: m.cost_diff,
      }));

      const ftNote =
        count < freeTransfers
          ? ` (Saved ${freeTransfers - count} FT for future gameweeks)`
          : "";

      if (type === "points_optimized") {
        const title =
          count === 1
            ? "Max Expected Points"
            : `${count}-Transfer Points Combo`;
        const description =
          count === 1
            ? `Upgrade ${firstMove.player_out.name} to ${firstMove.player_in.name} (${firstMove.xp_gain >= 0 ? "+" : ""}${firstMove.xp_gain} xP)`
            : `Combo upgrade: ${plan.moves.map((m) => `${m.player_out.name} → ${m.player_in.name}`).join(" & ")} (+${plan.total_xp_gain.toFixed(2)} xP)`;
        const rationale =
          count === 1
            ? `Mathematically optimal route to points${horizonSuffix}. ${firstMove.player_in.name} (${firstMove.player_in.team}) projects for ${firstMove.player_in.xp.toFixed(2)} xP, generating an immediate +${firstMove.xp_gain.toFixed(2)} gain over ${firstMove.player_out.name}.${ftNote}`
            : `Multi-transfer optimization utilizing ${count} of your ${freeTransfers} free transfers${horizonSuffix}. Combined swaps generate a total net gain of +${plan.total_xp_gain.toFixed(2)} expected points while preserving squad balance and budget constraints.${ftNote}`;

        return {
          type,
          title,
          badge: count === 1 ? "Points Optimizer" : `${count}-Transfer Optimizer`,
          description,
          transfers: transferMoves,
          transfers_count: count,
          player_out: firstMove.player_out,
          player_in: firstMove.player_in,
          xp_gain: plan.total_xp_gain,
          ownership_gain: plan.total_ownership_gain,
          ceiling_gain: plan.total_ceiling_gain,
          haul_prob_gain: plan.total_haul_prob_gain,
          cost_diff: plan.total_cost_diff,
          new_bank: plan.new_bank,
          key_stat: `${plan.total_xp_gain >= 0 ? "+" : ""}${plan.total_xp_gain.toFixed(2)} xP`,
          rationale,
          alternatives,
        };
      }

      if (type === "template_protection") {
        const title =
          count === 1
            ? "Template Rank Shield"
            : `${count}-Transfer Rank Shield`;
        const description =
          count === 1
            ? `Bring in template powerhouse ${firstMove.player_in.name} (${firstMove.player_in.selected_by_percent.toFixed(1)}% owned)`
            : `Template shield: ${plan.moves.map((m) => `${m.player_out.name} → ${m.player_in.name}`).join(" & ")} (+${plan.total_ownership_gain.toFixed(1)}% EO)`;
        const rationale =
          count === 1
            ? `Protects your overall rank from effective ownership damage. ${firstMove.player_in.name} is owned by ${firstMove.player_in.selected_by_percent.toFixed(1)}% of managers. Swapping out ${firstMove.player_out.name} gives your squad critical template armor.${ftNote}`
            : `Shields your rank by addressing ${count} high-ownership template gaps using ${count} of ${freeTransfers} free transfers. Secures +${plan.total_ownership_gain.toFixed(1)}% collective ownership armor without sacrificing baseline expected points.${ftNote}`;

        return {
          type,
          title,
          badge: count === 1 ? "Rank Safety" : `${count}-Transfer Shield`,
          description,
          transfers: transferMoves,
          transfers_count: count,
          player_out: firstMove.player_out,
          player_in: firstMove.player_in,
          xp_gain: plan.total_xp_gain,
          ownership_gain: plan.total_ownership_gain,
          ceiling_gain: plan.total_ceiling_gain,
          haul_prob_gain: plan.total_haul_prob_gain,
          cost_diff: plan.total_cost_diff,
          new_bank: plan.new_bank,
          key_stat: `+${plan.total_ownership_gain.toFixed(1)}% Ownership`,
          rationale,
          alternatives,
        };
      }

      // haul_potential
      const title =
        count === 1
          ? "Explosive Ceiling Target"
          : `${count}-Transfer Haul Combo`;
      const description =
        count === 1
          ? `Target ${firstMove.player_in.name}'s massive ceiling (P90: ${firstMove.player_in.ceiling.toFixed(0)} pts, ${firstMove.player_in.haul_prob.toFixed(1)}% haul rate)`
          : `Ceiling combo: ${plan.moves.map((m) => `${m.player_out.name} → ${m.player_in.name}`).join(" & ")} (+${plan.total_ceiling_gain.toFixed(0)} ceiling pts)`;
      const rationale =
        count === 1
          ? `Maximizes upside and haul probability for mini-league gains. ${firstMove.player_in.name} possesses a high 90th-percentile ceiling of ${firstMove.player_in.ceiling.toFixed(0)} points and a ${firstMove.player_in.haul_prob.toFixed(1)}% chance of scoring 10+ points.${ftNote}`
          : `Maximizes explosive upside across ${count} players using ${count} of ${freeTransfers} free transfers. Boosts collective ceiling by +${plan.total_ceiling_gain.toFixed(0)} points and significantly raises team-wide double-digit haul frequency.${ftNote}`;

      return {
        type,
        title,
        badge: count === 1 ? "Haul Potential" : `${count}-Transfer Haul Combo`,
        description,
        transfers: transferMoves,
        transfers_count: count,
        player_out: firstMove.player_out,
        player_in: firstMove.player_in,
        xp_gain: plan.total_xp_gain,
        ownership_gain: plan.total_ownership_gain,
        ceiling_gain: plan.total_ceiling_gain,
        haul_prob_gain: plan.total_haul_prob_gain,
        cost_diff: plan.total_cost_diff,
        new_bank: plan.new_bank,
        key_stat: `+${plan.total_ceiling_gain.toFixed(0)} Ceiling pts`,
        rationale,
        alternatives,
      };
    }

    const recPoints = buildRecommendation("points_optimized", planPoints, pointsAlts);
    const recTemplate = buildRecommendation("template_protection", planTemplate, templateAlts);
    const recHaul = buildRecommendation("haul_potential", planHaul, haulAlts);

    const responseData: UserTeamTransferResponse = {
      manager: {
        id: entryData.id,
        name: `${entryData.player_first_name} ${entryData.player_last_name}`,
        team_name: entryData.name,
        overall_points: entryData.summary_overall_points || 0,
        overall_rank: entryData.summary_overall_rank || null,
        current_event: currentEvent,
        total_transfers: picksData.entry_history?.event_transfers || 0,
      },
      squad: {
        starters,
        bench,
        formation: formationStr,
        formation_lines: {
          gkp: gkpLine,
          def: defLine,
          mid: midLine,
          fwd: fwdLine,
        },
        captain: captainInfo,
        vice_captain: viceCaptainInfo,
        starting_xi_xp: startingXiXp,
        starting_xi_ownership: startingXiOwnership,
        total_cost: totalCost,
        bank,
      },
      recommendations: {
        points_optimized: recPoints,
        template_protection: recTemplate,
        haul_potential: recHaul,
      },
      player_replacements: playerReplacementsMap,
      horizon,
      free_transfers: freeTransfers,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error generating transfer recommendations:", error);
    return NextResponse.json(
      { error: `Internal server error generating transfer recommendations: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
