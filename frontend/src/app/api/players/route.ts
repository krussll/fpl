import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Player, PlayerHistoryMatch } from "@/types/player";

let cached5Map: Map<number, Player> | null = null;

function get5FixturePlayersMap(): Map<number, Player> {
  if (cached5Map) return cached5Map;

  const candidate5Paths = [
    path.resolve(process.cwd(), "..", ".fpl_cache", "simulations_10k_fixtures_5.json"),
    path.resolve(process.cwd(), ".fpl_cache", "simulations_10k_fixtures_5.json"),
  ];

  for (const p of candidate5Paths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players)) {
          const map = new Map<number, Player>();
          for (const pl of parsed.players) {
            map.set(pl.id, pl);
          }
          cached5Map = map;
          return map;
        }
      } catch (err) {
        console.error("Failed to load 5-fixture cache:", err);
      }
    }
  }
  return new Map<number, Player>();
}

let cachedHistoriesMap: Map<number, PlayerHistoryMatch[]> | null = null;

function getPlayerHistoriesMap(): Map<number, PlayerHistoryMatch[]> {
  if (cachedHistoriesMap) return cachedHistoriesMap;

  const candidateHistPaths = [
    path.resolve(process.cwd(), ".fpl_cache", "player_histories.json"),
    path.resolve(process.cwd(), "..", ".fpl_cache", "player_histories.json"),
  ];

  for (const p of candidateHistPaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        const map = new Map<number, PlayerHistoryMatch[]>();
        for (const [idStr, list] of Object.entries(parsed)) {
          map.set(Number(idStr), list as PlayerHistoryMatch[]);
        }
        cachedHistoriesMap = map;
        return map;
      } catch (err) {
        console.error("Failed to load player histories cache:", err);
      }
    }
  }
  return new Map<number, PlayerHistoryMatch[]>();
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

    // Always attach 5-GW fixtures, 5-GW forecast & match history
    const map5 = get5FixturePlayersMap();
    const historiesMap = getPlayerHistoriesMap();
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
