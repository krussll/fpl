import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import {
  FixtureTickerResponse,
  TeamTickerRow,
  TeamFixtureTickerItem,
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

    const rows: TeamTickerRow[] = [];

    for (const [teamId, teamInfo] of Array.from(teamsMap.entries())) {
      const myRating = ratingsData.teams[teamId] || {
        name: teamInfo.name,
        xG90: 1.35,
        xGC90: 1.45,
        def_ratio: 1.0,
        att_ratio: 1.0,
        gc_factor: 1.0,
      };

      const teamFixtures: TeamFixtureTickerItem[] = [];

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
        const oppGcFactor = oppRating.gc_factor ?? 1.0;

        let projXg = 0.0;
        if (isHome) {
          const offXg = myRating.xG90 * oppRating.def_ratio * 1.08;
          const defConceded = oppRating.xGC90 * oppGcFactor * myRating.att_ratio * 1.10;
          projXg = Math.max(0.25, Math.min(3.8, parseFloat(((offXg + defConceded) / 2.0).toFixed(2))));
        } else {
          const offXg = myRating.xG90 * oppRating.def_ratio * 0.92;
          const defConceded = oppRating.xGC90 * oppGcFactor * myRating.att_ratio * 0.90;
          projXg = Math.max(0.2, Math.min(3.6, parseFloat(((offXg + defConceded) / 2.0).toFixed(2))));
        }

        teamFixtures.push({
          gameweek: f.event || 0,
          fixture_id: f.id,
          opponent_id: oppId,
          opponent_name: oppRating.name,
          opponent_short: oppShort,
          is_home: isHome,
          display: `${oppShort} (${isHome ? "H" : "A"})`,
          fdr: isHome ? f.team_h_difficulty || 3 : f.team_a_difficulty || 3,
          projected_xg: projXg,
        });

        if (teamFixtures.length >= horizon) break;
      }

      const totalXg = parseFloat(teamFixtures.reduce((s, fix) => s + fix.projected_xg, 0).toFixed(2));
      const avgXg = parseFloat((totalXg / Math.max(1, teamFixtures.length)).toFixed(2));

      rows.push({
        team_id: teamId,
        team_name: teamInfo.name,
        short_name: teamInfo.short_name,
        base_xg90: myRating.xG90,
        base_xgc90: myRating.xGC90,
        fixtures: teamFixtures,
        total_xg: totalXg,
        avg_xg: avgXg,
      });
    }

    // Default sort: highest total xG descending
    rows.sort((a, b) => b.total_xg - a.total_xg);

    const response: FixtureTickerResponse = {
      current_gameweek: currentGw,
      horizons: validHorizons,
      selected_horizon: horizon,
      teams: rows,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error generating fixture ticker:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
