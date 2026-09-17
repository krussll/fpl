import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  FixtureXgcTickerResponse,
  TeamXgcTickerRow,
  TeamFixtureXgcTickerItem,
} from "@/types/fixtureTicker";

interface FixtureRaw {
  id: number;
  event: number | null;
  finished: boolean;
  kickoff_time: string;
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
}

interface TeamRating {
  name: string;
  xGC90: number;
  xG90: number;
  def_ratio: number;
  att_ratio: number;
  gc_factor?: number;
}

interface TeamRatingsData {
  teams: Record<string | number, TeamRating>;
}

interface BootstrapTeam {
  id: number;
  name: string;
  short_name: string;
}

let cachedRatings: TeamRatingsData | null = null;
let cachedTeamsMap: Map<number, BootstrapTeam> | null = null;
let cachedFixtures: FixtureRaw[] | null = null;

function loadTeamRatings(): TeamRatingsData | null {
  if (cachedRatings) return cachedRatings;

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", "team_ratings.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "team_ratings.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        cachedRatings = JSON.parse(raw);
        return cachedRatings;
      } catch (err) {
        console.error("Failed to parse team_ratings.json:", err);
      }
    }
  }
  return null;
}

function loadTeamsMap(): Map<number, BootstrapTeam> {
  if (cachedTeamsMap) return cachedTeamsMap;

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", "bootstrap_static.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "bootstrap_static.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        const map = new Map<number, BootstrapTeam>();
        if (Array.isArray(parsed.teams)) {
          parsed.teams.forEach((t: BootstrapTeam) => map.set(t.id, t));
        }
        cachedTeamsMap = map;
        return map;
      } catch (err) {
        console.error("Failed to load bootstrap_static.json:", err);
      }
    }
  }
  return new Map();
}

function loadFixtures(): FixtureRaw[] {
  if (cachedFixtures) return cachedFixtures;

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", "future_fixtures.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "future_fixtures.json"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        cachedFixtures = JSON.parse(raw);
        return cachedFixtures || [];
      } catch (err) {
        console.error("Failed to load future_fixtures.json:", err);
      }
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const horizonParam = parseInt(searchParams.get("horizon") || "5", 10);
    const validHorizons = [3, 5, 8];
    const horizon = validHorizons.includes(horizonParam) ? horizonParam : 5;

    const fixtures = loadFixtures();
    const ratingsData = loadTeamRatings();
    const teamsMap = loadTeamsMap();

    if (!fixtures.length || !ratingsData) {
      return NextResponse.json(
        { error: "Fixture or team rating data unavailable." },
        { status: 500 }
      );
    }

    const unplayed = fixtures.filter((f) => !f.finished && f.event !== null);
    const currentGw = unplayed.length > 0 ? (unplayed[0].event as number) : 5;

    const rows: TeamXgcTickerRow[] = [];

    for (const [teamId, teamInfo] of Array.from(teamsMap.entries())) {
      const myRating = ratingsData.teams[teamId] || {
        name: teamInfo.name,
        xG90: 1.35,
        xGC90: 1.45,
        def_ratio: 1.0,
        att_ratio: 1.0,
        gc_factor: 1.0,
      };

      const teamFixtures: TeamFixtureXgcTickerItem[] = [];

      for (const f of unplayed) {
        const isHome = f.team_h === teamId;
        const isAway = f.team_a === teamId;
        if (!isHome && !isAway) continue;

        const oppId = isHome ? f.team_a : f.team_h;
        const oppRating = ratingsData.teams[oppId] || {
          name: "Opponent",
          xG90: 1.35,
          xGC90: 1.45,
          def_ratio: 1.0,
          att_ratio: 1.0,
          gc_factor: 1.0,
        };
        const oppTeamInfo = teamsMap.get(oppId);
        const oppShort = oppTeamInfo?.short_name || oppRating.name.slice(0, 3).toUpperCase();

        const myGcFactor = myRating.gc_factor ?? 1.0;

        let projXgc = 0.0;
        if (isHome) {
          // I am Home, Opponent is Away at my stadium
          const oppOffXg = oppRating.xG90 * myRating.def_ratio * 0.92;
          const myDefConceded = myRating.xGC90 * myGcFactor * oppRating.att_ratio * 0.90;
          projXgc = Math.max(0.20, Math.min(3.6, parseFloat(((oppOffXg + myDefConceded) / 2.0).toFixed(2))));
        } else {
          // I am Away, Opponent is Home at their stadium
          const oppOffXg = oppRating.xG90 * myRating.def_ratio * 1.08;
          const myDefConceded = myRating.xGC90 * myGcFactor * oppRating.att_ratio * 1.10;
          projXgc = Math.max(0.25, Math.min(3.8, parseFloat(((oppOffXg + myDefConceded) / 2.0).toFixed(2))));
        }

        const csProb = Math.round(Math.max(0.05, Math.min(0.65, Math.exp(-projXgc))) * 100);

        teamFixtures.push({
          gameweek: f.event || 0,
          fixture_id: f.id,
          opponent_id: oppId,
          opponent_name: oppRating.name,
          opponent_short: oppShort,
          is_home: isHome,
          display: `${oppShort} (${isHome ? "H" : "A"})`,
          fdr: isHome ? f.team_h_difficulty || 3 : f.team_a_difficulty || 3,
          projected_xgc: projXgc,
          clean_sheet_prob: csProb,
        });

        if (teamFixtures.length >= horizon) break;
      }

      const totalXgc = parseFloat(teamFixtures.reduce((s, fix) => s + fix.projected_xgc, 0).toFixed(2));
      const avgXgc = parseFloat((totalXgc / Math.max(1, teamFixtures.length)).toFixed(2));

      rows.push({
        team_id: teamId,
        team_name: teamInfo.name,
        short_name: teamInfo.short_name,
        base_xg90: myRating.xG90,
        base_xgc90: myRating.xGC90,
        fixtures: teamFixtures,
        total_xgc: totalXgc,
        avg_xgc: avgXgc,
      });
    }

    // Default sort: lowest total xGC first (best defensive fixture runs at the top)
    rows.sort((a, b) => a.total_xgc - b.total_xgc);

    const response: FixtureXgcTickerResponse = {
      current_gameweek: currentGw,
      horizons: validHorizons,
      selected_horizon: horizon,
      teams: rows,
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error generating defensive fixture ticker:", error);
    return NextResponse.json(
      { error: `Internal server error: ${message}` },
      { status: 500 }
    );
  }
}
