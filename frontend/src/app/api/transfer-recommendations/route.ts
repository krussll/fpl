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

    // 5. Transfer Recommendation Engine
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

    // Compute all legal single transfers
    interface CandidateTransfer {
      player_out: SquadPlayer;
      player_in: Player;
      xp_gain: number;
      ownership_gain: number;
      ceiling_gain: number;
      haul_prob_gain: number;
      cost_diff: number;
      new_bank: number;
      points_score: number;
      template_score: number;
      haul_score: number;
    }

    const legalTransfers: CandidateTransfer[] = [];
    const playerReplacementsMap: Record<number, TransferAlternative[]> = {};

    for (const pOut of allSquadPlayers) {
      const outTeam = pOut.team_id;
      const maxAffordable = parseFloat((pOut.price + bank + 0.001).toFixed(1));
      const pOutReplacements: TransferAlternative[] = [];

      for (const pIn of allCandidates) {
        if (pIn.position !== pOut.position) continue;
        if (pIn.price > maxAffordable) continue;

        // Team quota check: max 3 players per club
        const currentCount = teamCounts[pIn.team_id] || 0;
        const availableSlots = outTeam === pIn.team_id ? 3 - (currentCount - 1) : 3 - currentCount;
        if (availableSlots <= 0) continue;

        const xpGain = parseFloat((pIn.xp - pOut.xp).toFixed(2));
        const ownGain = parseFloat((pIn.selected_by_percent - pOut.selected_by_percent).toFixed(1));
        const ceilGain = parseFloat((pIn.ceiling - pOut.ceiling).toFixed(1));
        const haulGain = parseFloat(((pIn.haul_prob - pOut.haul_prob)).toFixed(1));
        const costDiff = parseFloat((pIn.price - pOut.price).toFixed(1));
        const newBank = parseFloat((bank - costDiff).toFixed(1));

        // Weighting formulas
        // Points score: Starter upgrades matter 100%, bench upgrades matter 65%. Flagged out-players get priority boost.
        const starterWeight = pOut.is_starter ? 1.0 : 0.65;
        const outStatusPenalty = ["i", "u", "s", "d"].includes(pOut.status) ? 1.8 : 0.0;
        const pointsScore = (xpGain + outStatusPenalty) * starterWeight;

        // Template score: High incoming ownership + solid xP (avoids taking template duds)
        const templateScore = ownGain * 0.7 + xpGain * 5.0;

        // Haul score: High ceiling + haul rate + xP
        const haulScore = ceilGain * 1.8 + haulGain * 1.2 + xpGain * 0.8;

        const trans: CandidateTransfer = {
          player_out: pOut,
          player_in: pIn,
          xp_gain: xpGain,
          ownership_gain: ownGain,
          ceiling_gain: ceilGain,
          haul_prob_gain: haulGain,
          cost_diff: costDiff,
          new_bank: newBank,
          points_score: pointsScore,
          template_score: templateScore,
          haul_score: haulScore,
        };

        legalTransfers.push(trans);

        pOutReplacements.push({
          player_out: pOut,
          player_in: pIn,
          xp_gain: xpGain,
          ownership_gain: ownGain,
          ceiling_gain: ceilGain,
          haul_prob_gain: haulGain,
          cost_diff: costDiff,
          new_bank: newBank,
        });
      }

      // Sort individual replacements by highest xP gain
      pOutReplacements.sort((a, b) => b.xp_gain - a.xp_gain);
      playerReplacementsMap[pOut.id] = pOutReplacements.slice(0, 4);
    }

    // A. Mode 1: Points Optimized Transfer
    const pointsSorted = [...legalTransfers].sort((a, b) => b.points_score - a.points_score);
    const bestPoints = pointsSorted[0] || null;
    const pointsAlts = pointsSorted.slice(1, 4).map((t) => ({
      player_out: t.player_out,
      player_in: t.player_in,
      xp_gain: t.xp_gain,
      ownership_gain: t.ownership_gain,
      ceiling_gain: t.ceiling_gain,
      haul_prob_gain: t.haul_prob_gain,
      cost_diff: t.cost_diff,
      new_bank: t.new_bank,
    }));

    // B. Mode 2: Template Protection Transfer
    // Filter for targets with high ownership (>= 15% or top available) that protect rank without bleeding xP
    const templateSorted = [...legalTransfers]
      .filter((t) => t.player_in.selected_by_percent >= 15.0 && t.xp_gain >= -1.2)
      .sort((a, b) => b.template_score - a.template_score);
    
    // Ensure distinct recommendation from points optimized if possible
    let bestTemplate = templateSorted.find((t) => t.player_in.id !== bestPoints?.player_in.id) || templateSorted[0] || pointsSorted[0];
    const templateAlts = templateSorted
      .filter((t) => t.player_in.id !== bestTemplate.player_in.id)
      .slice(0, 3)
      .map((t) => ({
        player_out: t.player_out,
        player_in: t.player_in,
        xp_gain: t.xp_gain,
        ownership_gain: t.ownership_gain,
        ceiling_gain: t.ceiling_gain,
        haul_prob_gain: t.haul_prob_gain,
        cost_diff: t.cost_diff,
        new_bank: t.new_bank,
      }));

    // C. Mode 3: Highest Haul Potential Transfer
    const haulSorted = [...legalTransfers]
      .filter((t) => t.ceiling_gain > 0 && t.haul_prob_gain >= 0)
      .sort((a, b) => b.haul_score - a.haul_score);

    let bestHaul =
      haulSorted.find(
        (t) => t.player_in.id !== bestPoints?.player_in.id && t.player_in.id !== bestTemplate?.player_in.id
      ) || haulSorted[0] || pointsSorted[0];
    const haulAlts = haulSorted
      .filter((t) => t.player_in.id !== bestHaul.player_in.id)
      .slice(0, 3)
      .map((t) => ({
        player_out: t.player_out,
        player_in: t.player_in,
        xp_gain: t.xp_gain,
        ownership_gain: t.ownership_gain,
        ceiling_gain: t.ceiling_gain,
        haul_prob_gain: t.haul_prob_gain,
        cost_diff: t.cost_diff,
        new_bank: t.new_bank,
      }));

    // Helper rationales
    const horizonSuffix = horizon > 1 ? ` across the next ${horizon} gameweeks` : " for the upcoming gameweek";

    const recPoints: TransferRecommendation = {
      type: "points_optimized",
      title: "Max Expected Points",
      badge: "Points Optimizer",
      description: `Upgrade ${bestPoints.player_out.name} to ${bestPoints.player_in.name} (${bestPoints.xp_gain >= 0 ? "+" : ""}${bestPoints.xp_gain} xP)`,
      player_out: bestPoints.player_out,
      player_in: bestPoints.player_in,
      xp_gain: bestPoints.xp_gain,
      ownership_gain: bestPoints.ownership_gain,
      ceiling_gain: bestPoints.ceiling_gain,
      haul_prob_gain: bestPoints.haul_prob_gain,
      cost_diff: bestPoints.cost_diff,
      new_bank: bestPoints.new_bank,
      key_stat: `${bestPoints.xp_gain >= 0 ? "+" : ""}${bestPoints.xp_gain.toFixed(2)} xP`,
      rationale: `Mathematically optimal route to points${horizonSuffix}. ${bestPoints.player_in.name} (${bestPoints.player_in.team}) projects for ${bestPoints.player_in.xp.toFixed(2)} xP, generating an immediate +${bestPoints.xp_gain.toFixed(2)} gain over ${bestPoints.player_out.name}.`,
      alternatives: pointsAlts,
    };

    const recTemplate: TransferRecommendation = {
      type: "template_protection",
      title: "Template Rank Shield",
      badge: "Rank Safety",
      description: `Bring in template powerhouse ${bestTemplate.player_in.name} (${bestTemplate.player_in.selected_by_percent.toFixed(1)}% owned)`,
      player_out: bestTemplate.player_out,
      player_in: bestTemplate.player_in,
      xp_gain: bestTemplate.xp_gain,
      ownership_gain: bestTemplate.ownership_gain,
      ceiling_gain: bestTemplate.ceiling_gain,
      haul_prob_gain: bestTemplate.haul_prob_gain,
      cost_diff: bestTemplate.cost_diff,
      new_bank: bestTemplate.new_bank,
      key_stat: `+${bestTemplate.ownership_gain.toFixed(1)}% Ownership`,
      rationale: `Protects your overall rank from effective ownership damage. ${bestTemplate.player_in.name} is owned by ${bestTemplate.player_in.selected_by_percent.toFixed(1)}% of all managers. Swapping out ${bestTemplate.player_out.name} gives your squad critical template armor against big weeks.`,
      alternatives: templateAlts,
    };

    const recHaul: TransferRecommendation = {
      type: "haul_potential",
      title: "Explosive Ceiling Target",
      badge: "Haul Potential",
      description: `Target ${bestHaul.player_in.name}'s massive ceiling (P90: ${bestHaul.player_in.ceiling.toFixed(0)} pts, ${bestHaul.player_in.haul_prob.toFixed(1)}% haul rate)`,
      player_out: bestHaul.player_out,
      player_in: bestHaul.player_in,
      xp_gain: bestHaul.xp_gain,
      ownership_gain: bestHaul.ownership_gain,
      ceiling_gain: bestHaul.ceiling_gain,
      haul_prob_gain: bestHaul.haul_prob_gain,
      cost_diff: bestHaul.cost_diff,
      new_bank: bestHaul.new_bank,
      key_stat: `P90: ${bestHaul.player_in.ceiling.toFixed(0)} pts (${bestHaul.ceiling_gain >= 0 ? "+" : ""}${bestHaul.ceiling_gain.toFixed(0)})`,
      rationale: `Maximizes upside and haul probability for mini-league gains. ${bestHaul.player_in.name} possesses a high 90th-percentile ceiling of ${bestHaul.player_in.ceiling.toFixed(0)} points and a ${bestHaul.player_in.haul_prob.toFixed(1)}% chance of scoring 10+ points.`,
      alternatives: haulAlts,
    };

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
