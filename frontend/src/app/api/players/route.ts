import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Player, PlayerHistoryMatch, PlayerEyeTest, PlayerEyeTestHistoryMatch } from "@/types/player";

let cached5Map: Map<number, Player> | null = null;
let last5Mtime: number = 0;

function get5FixturePlayersMap(): Map<number, Player> {
  const candidate5Paths = [
    path.resolve(process.cwd(), "..", ".fpl_cache", "simulations_10k_fixtures_5.json"),
    path.resolve(process.cwd(), ".fpl_cache", "simulations_10k_fixtures_5.json"),
  ];

  for (const p of candidate5Paths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const stat = fs.statSync(/*turbopackIgnore: true*/ p);
        if (cached5Map && stat.mtimeMs <= last5Mtime) {
          return cached5Map;
        }
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players)) {
          const map = new Map<number, Player>();
          for (const pl of parsed.players) {
            map.set(pl.id, pl);
          }
          cached5Map = map;
          last5Mtime = stat.mtimeMs;
          return map;
        }
      } catch (err) {
        console.error("Failed to load 5-fixture cache:", err);
      }
    }
  }
  return cached5Map || new Map<number, Player>();
}

let cachedHistoriesMap: Map<number, PlayerHistoryMatch[]> | null = null;
let lastHistMtime: number = 0;

function getPlayerHistoriesMap(): Map<number, PlayerHistoryMatch[]> {
  const candidateHistPaths = [
    path.resolve(process.cwd(), ".fpl_cache", "player_histories.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "player_histories.json"),
  ];

  for (const p of candidateHistPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const stat = fs.statSync(/*turbopackIgnore: true*/ p);
        if (cachedHistoriesMap && stat.mtimeMs <= lastHistMtime) {
          return cachedHistoriesMap;
        }
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        const map = new Map<number, PlayerHistoryMatch[]>();
        for (const [idStr, list] of Object.entries(parsed)) {
          map.set(Number(idStr), list as PlayerHistoryMatch[]);
        }
        cachedHistoriesMap = map;
        lastHistMtime = stat.mtimeMs;
        return map;
      } catch (err) {
        console.error("Failed to load player histories cache:", err);
      }
    }
  }
  return cachedHistoriesMap || new Map<number, PlayerHistoryMatch[]>();
}

let cachedEyeTestMap: Map<number, PlayerEyeTest> | null = null;

function getEyeTestMap(): Map<number, PlayerEyeTest> {
  const candidateDirs = [
    path.resolve(process.cwd(), ".fpl_cache"),
    path.resolve(process.cwd(), "..", ".fpl_cache"),
  ];

  for (const dir of candidateDirs) {
    if (fs.existsSync(/*turbopackIgnore: true*/ dir)) {
      try {
        const files = fs
          .readdirSync(/*turbopackIgnore: true*/ dir)
          .filter((f) => f.startsWith("eye_test_gw") && f.endsWith(".json"));

        if (files.length > 0) {
          const playerMatches = new Map<number, PlayerEyeTestHistoryMatch[]>();

          for (const f of files) {
            try {
              const raw = fs.readFileSync(path.join(/*turbopackIgnore: true*/ dir, f), "utf-8");
              const data = JSON.parse(raw);
              const gw = data.gameweek || 0;
              const opp = data.opponent_name || "";
              const score = data.score || "";
              const venue = data.venue || "Home";
              const sources = data.sources || [];

              if (data.players && typeof data.players === "object") {
                for (const p of Object.values(data.players) as any[]) {
                  if (p.element_id) {
                    if (!playerMatches.has(p.element_id)) {
                      playerMatches.set(p.element_id, []);
                    }
                    playerMatches.get(p.element_id)!.push({
                      gameweek: gw,
                      opponent_name: opp,
                      venue: venue,
                      score: score,
                      rating: Number(p.rating) || 6.0,
                      verdict: p.verdict || "Eye-Test Evaluated",
                      tactical_role: p.tactical_role || "",
                      observations: p.observations || [],
                      summary: p.stats_vs_eye_test_summary || "",
                      attack_mult: Number(p.suggested_attack_mult) || 1.0,
                      defense_mult: Number(p.suggested_defense_mult) || 1.0,
                      sources: sources,
                    });
                  }
                }
              }
            } catch {}
          }

          const map = new Map<number, PlayerEyeTest>();
          for (const [elId, appearances] of playerMatches.entries()) {
            // Sort chronologically ascending
            appearances.sort((a, b) => a.gameweek - b.gameweek);
            const recent = appearances.slice(-3);
            const K = recent.length;
            if (K === 0) continue;

            const weights =
              K === 1
                ? [1.0]
                : K === 2
                ? [0.35, 0.65]
                : [0.2, 0.3, 0.5];

            const ratings = recent.map((m) => m.rating);
            const gameweeks = recent.map((m) => m.gameweek);
            const weightedRating =
              Math.round(
                recent.reduce((acc, m, i) => acc + m.rating * weights[i], 0) *
                  100
              ) / 100;
            const unweightedMean =
              Math.round((ratings.reduce((a, b) => a + b, 0) / K) * 100) / 100;

            const trendDelta =
              K >= 2 ? Math.round((ratings[K - 1] - ratings[0]) * 10) / 10 : 0.0;
            let trend: "RISING" | "FALLING" | "STEADY" | "VOLATILE" = "STEADY";
            if (K >= 2) {
              if (trendDelta >= 0.75) trend = "RISING";
              else if (trendDelta <= -0.75) trend = "FALLING";
              else if (K >= 3) {
                const variance =
                  ratings.reduce(
                    (acc, r) => acc + Math.pow(r - unweightedMean, 2),
                    0
                  ) / K;
                if (Math.sqrt(variance) >= 1.25) trend = "VOLATILE";
              }
            }

            const effAtt =
              Math.round(
                recent.reduce(
                  (acc, m, i) => acc + m.attack_mult * weights[i],
                  0
                ) * 100
              ) / 100;
            const effDef =
              Math.round(
                recent.reduce(
                  (acc, m, i) => acc + m.defense_mult * weights[i],
                  0
                ) * 100
              ) / 100;

            const latest = recent[recent.length - 1];
            const gwSeq = recent
              .map((m) => `GW${m.gameweek} (${m.rating.toFixed(1)})`)
              .join(" → ");
            const trendDesc =
              trend === "RISING"
                ? "trending strongly upward with rising match influence"
                : trend === "FALLING"
                ? "showing a drop in tactical involvement"
                : trend === "VOLATILE"
                ? "exhibiting high match-to-match variance"
                : "maintaining consistent tactical output";

            const rollingSummary = `${weightedRating.toFixed(
              1
            )}/10 rolling eye-test rating over ${K} matches (${gwSeq}), ${trendDesc}. Latest scouting notes vs ${
              latest.opponent_name
            }: "${latest.summary}"`;

            map.set(elId, {
              rating: weightedRating,
              weighted_rating: weightedRating,
              unweighted_mean: unweightedMean,
              trend: trend,
              trend_delta: trendDelta,
              horizon: 3,
              matches_evaluated: K,
              gameweeks: gameweeks,
              ratings_history: ratings,
              verdict: latest.verdict,
              tactical_role: latest.tactical_role,
              observations: latest.observations,
              summary: rollingSummary,
              rolling_tactical_summary: rollingSummary,
              attack_multiplier: effAtt,
              defense_multiplier: effDef,
              gameweek: latest.gameweek,
              opponent: latest.opponent_name,
              score: latest.score,
              venue: latest.venue,
              sources: latest.sources || [],
              history: recent,
            });
          }

          cachedEyeTestMap = map;
          return map;
        }
      } catch (err) {
        console.error("Failed to load eye-test cache:", err);
      }
    }
  }
  return cachedEyeTestMap || new Map<number, PlayerEyeTest>();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fixtures = searchParams.get("fixtures") || "1";
    const posParam = (searchParams.get("position") || "ALL").toUpperCase();
    const teamParam = searchParams.get("team") || searchParams.get("teams") || "";
    const query = (searchParams.get("query") || "").trim().toLowerCase();
    const maxPrice = parseFloat(searchParams.get("max_price") || "20.0");

    // Check potential cache paths
    const candidatePaths = [
      path.resolve(process.cwd(), "..", ".fpl_cache", `simulations_10k_fixtures_${fixtures}.json`),
      path.resolve(process.cwd(), ".fpl_cache", `simulations_10k_fixtures_${fixtures}.json`),
    ];

    let playersData: Player[] = [];

    for (const p of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players)) {
          playersData = parsed.players;
          break;
        }
      }
    }

    // If local cache wasn't found, try local FastAPI server or live Render backend fallback
    if (!playersData.length) {
      try {
        const backendUrl =
          process.env.BACKEND_API_URL || "https://fpl-4fo2.onrender.com";
        const res = await fetch(`${backendUrl}/api/players?fixtures=${fixtures}`, {
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.players)) {
            playersData = json.players;
          }
        }
      } catch {
        // Backend not reachable
      }
    }

    // Always attach 5-GW fixtures, 5-GW forecast, match history & eye test
    const map5 = get5FixturePlayersMap();
    const historiesMap = getPlayerHistoriesMap();
    const eyeTestMap = getEyeTestMap();
    for (const player of playersData) {
      const p5 = map5.get(player.id);
      if (p5) {
        player.fixtures_5 = p5.fixtures;
        player.five_gw = p5;
      }
      const hist = historiesMap.get(player.id);
      if (hist) {
        player.history = hist;
      }
      const eye = eyeTestMap.get(player.id);
      if (eye) {
        player.eye_test = eye;
      }
    }

    // Apply filtering
    let filtered = playersData;

    // Multi-position filtering support (e.g. position=MID,FWD)
    if (posParam !== "ALL") {
      const allowedPositions = posParam
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      if (allowedPositions.length > 0) {
        filtered = filtered.filter((p) => allowedPositions.includes(p.position));
      }
    }

    // Multi-team filtering support (e.g. team=Arsenal,Liverpool)
    if (teamParam && teamParam.toUpperCase() !== "ALL") {
      const allowedTeams = teamParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
      if (allowedTeams.length > 0) {
        filtered = filtered.filter(
          (p) => p.team && allowedTeams.includes(p.team.toLowerCase())
        );
      }
    }

    if (!isNaN(maxPrice)) {
      filtered = filtered.filter((p) => p.price <= maxPrice);
    }

    if (query) {
      filtered = filtered.filter((p) => {
        const nameMatch =
          (p.name && p.name.toLowerCase().includes(query)) ||
          (p.full_name && p.full_name.toLowerCase().includes(query));
        const teamMatch = p.team && p.team.toLowerCase().includes(query);
        return nameMatch || teamMatch;
      });
    }

    // Sort by expected points descending by default
    filtered.sort((a, b) => (b.xp || 0) - (a.xp || 0));

    return NextResponse.json({
      total: filtered.length,
      fixtures: parseInt(fixtures, 10),
      simulations: 10000,
      players: filtered,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load player simulation data", details },
      { status: 500 }
    );
  }
}
