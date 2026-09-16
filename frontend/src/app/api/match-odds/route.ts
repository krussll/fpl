import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { MatchOddsResponse, MatchProjection, ScorelineProbability } from "@/types/matchOdds";

interface FixtureRaw {
  id: number;
  code: number;
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
  empirical_cs_rate?: number;
}

interface TeamRatingsData {
  teams: Record<string | number, TeamRating>;
  avg_xgc: number;
  avg_xg: number;
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

function poissonPmf(k: number, lambda: number): number {
  if (k < 0) return 0;
  let fact = 1;
  for (let i = 2; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const gwParam = searchParams.get("gw");

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
    const availableEvents = Array.from(new Set(unplayed.map((f) => f.event as number))).sort(
      (a, b) => a - b
    );

    const defaultGw = availableEvents.length > 0 ? availableEvents[0] : 5;
    const selectedGw = gwParam ? parseInt(gwParam, 10) : defaultGw;

    const targetFixtures = fixtures.filter(
      (f) => f.event === selectedGw && !f.finished
    );

    const matches: MatchProjection[] = [];

    for (const f of targetFixtures) {
      const hId = f.team_h;
      const aId = f.team_a;

      const hRating = ratingsData.teams[hId] || {
        name: "Home",
        xG90: 1.35,
        xGC90: 1.45,
        def_ratio: 1.0,
        att_ratio: 1.0,
        gc_factor: 1.0,
      };
      const aRating = ratingsData.teams[aId] || {
        name: "Away",
        xG90: 1.35,
        xGC90: 1.45,
        def_ratio: 1.0,
        att_ratio: 1.0,
        gc_factor: 1.0,
      };

      const hTeamInfo = teamsMap.get(hId);
      const aTeamInfo = teamsMap.get(aId);

      const hGcFactor = hRating.gc_factor ?? 1.0;
      const aGcFactor = aRating.gc_factor ?? 1.0;

      // Match Expected Goals (consensus of attack and opponent defense concession)
      const hOffXg = hRating.xG90 * aRating.def_ratio * 1.08;
      const hDefConceded = aRating.xGC90 * aGcFactor * hRating.att_ratio * 1.10;
      const hXg = Math.max(0.25, Math.min(3.6, parseFloat(((hOffXg + hDefConceded) / 2.0).toFixed(2))));

      const aOffXg = aRating.xG90 * hRating.def_ratio * 0.92;
      const aDefConceded = hRating.xGC90 * hGcFactor * aRating.att_ratio * 0.90;
      const aXg = Math.max(0.2, Math.min(3.5, parseFloat(((aOffXg + aDefConceded) / 2.0).toFixed(2))));

      // 8x8 Poisson Grid
      const scoreMatrix: number[][] = Array(5)
        .fill(0)
        .map(() => Array(5).fill(0));

      let pHomewin = 0.0;
      let pDraw = 0.0;
      let pAwaywin = 0.0;
      let pOver25 = 0.0;
      let pOver15 = 0.0;
      let pOver35 = 0.0;
      let scoreList: ScorelineProbability[] = [];

      for (let i = 0; i <= 7; i++) {
        const pI = poissonPmf(i, hXg);
        for (let j = 0; j <= 7; j++) {
          const pJ = poissonPmf(j, aXg);
          const prob = pI * pJ;

          if (i < 5 && j < 5) {
            scoreMatrix[i][j] = parseFloat((prob * 100).toFixed(1));
          }

          if (i > j) pHomewin += prob;
          else if (i === j) pDraw += prob;
          else pAwaywin += prob;

          if (i + j >= 3) pOver25 += prob;
          if (i + j >= 2) pOver15 += prob;
          if (i + j >= 4) pOver35 += prob;

          scoreList.push({
            home_goals: i,
            away_goals: j,
            score: `${i}-${j}`,
            probability: prob,
            percentage: parseFloat((prob * 100).toFixed(1)),
          });
        }
      }

      scoreList.sort((a, b) => b.probability - a.probability);
      const topScorelines = scoreList.slice(0, 5);

      // Clean sheet probabilities
      const hCsPct = parseFloat((Math.exp(-aXg) * 100).toFixed(1));
      const aCsPct = parseFloat((Math.exp(-hXg) * 100).toFixed(1));

      // Both teams to score
      const bttsYes = parseFloat(((1 - Math.exp(-hXg)) * (1 - Math.exp(-aXg)) * 100).toFixed(1));
      const bttsNo = parseFloat((100 - bttsYes).toFixed(1));

      // Normalise win/draw/loss percentages to sum cleanly to 100%
      const totalOutcomes = pHomewin + pDraw + pAwaywin;
      const homeWinPct = parseFloat(((pHomewin / totalOutcomes) * 100).toFixed(1));
      const drawPct = parseFloat(((pDraw / totalOutcomes) * 100).toFixed(1));
      const awayWinPct = parseFloat(((pAwaywin / totalOutcomes) * 100).toFixed(1));

      matches.push({
        id: f.id,
        gameweek: f.event || selectedGw,
        kickoff_time: f.kickoff_time,
        home_team: {
          id: hId,
          name: hRating.name,
          short_name: hTeamInfo?.short_name || hRating.name.slice(0, 3).toUpperCase(),
          fdr: f.team_h_difficulty || 3,
          xg: hXg,
          clean_sheet_pct: hCsPct,
          att_ratio: hRating.att_ratio,
          def_ratio: hRating.def_ratio,
        },
        away_team: {
          id: aId,
          name: aRating.name,
          short_name: aTeamInfo?.short_name || aRating.name.slice(0, 3).toUpperCase(),
          fdr: f.team_a_difficulty || 3,
          xg: aXg,
          clean_sheet_pct: aCsPct,
          att_ratio: aRating.att_ratio,
          def_ratio: aRating.def_ratio,
        },
        total_match_xg: parseFloat((hXg + aXg).toFixed(2)),
        probabilities: {
          home_win: homeWinPct,
          draw: drawPct,
          away_win: awayWinPct,
          over_25: parseFloat((pOver25 * 100).toFixed(1)),
          under_25: parseFloat(((1 - pOver25) * 100).toFixed(1)),
          over_15: parseFloat((pOver15 * 100).toFixed(1)),
          under_15: parseFloat(((1 - pOver15) * 100).toFixed(1)),
          over_35: parseFloat((pOver35 * 100).toFixed(1)),
          under_35: parseFloat(((1 - pOver35) * 100).toFixed(1)),
          btts_yes: bttsYes,
          btts_no: bttsNo,
        },
        top_scorelines: topScorelines,
        score_matrix: scoreMatrix,
      });
    }

    const response: MatchOddsResponse = {
      current_gameweek: defaultGw,
      selected_gameweek: selectedGw,
      available_gameweeks: availableEvents,
      matches,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Error computing match odds:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
