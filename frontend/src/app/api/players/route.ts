import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Player, PlayerHistoryMatch, PlayerEyeTest } from "@/types/player";

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
        const files = fs.readdirSync(/*turbopackIgnore: true*/ dir).filter(f => f.startsWith("eye_test_gw") && f.endsWith(".json"));
        if (files.length > 0) {
          const map = new Map<number, PlayerEyeTest>();
          for (const f of files) {
            const raw = fs.readFileSync(path.join(/*turbopackIgnore: true*/ dir, f), "utf-8");
            const data = JSON.parse(raw);
            const gw = data.gameweek || 0;
            const opp = data.opponent_name || "";
            const score = data.score || "";
            const venue = data.venue || "Home";
            const sources = data.sources || [];
            if (data.players && typeof data.players === "object") {
              for (const p of Object.values(data.players) as any[]) {
                if (p.element_id && !map.has(p.element_id)) {
                  map.set(p.element_id, {
                    rating: p.rating,
                    verdict: p.verdict,
                    tactical_role: p.tactical_role,
                    observations: p.observations || [],
                    summary: p.stats_vs_eye_test_summary || "",
                    attack_multiplier: p.suggested_attack_mult || 1.0,
                    defense_multiplier: p.suggested_defense_mult || 1.0,
                    gameweek: gw,
                    opponent: opp,
                    score: score,
                    venue: venue,
                    sources: sources
                  });
                }
              }
            }
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
