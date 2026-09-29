import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { PlayerHistoryMatch } from "@/types/player";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json({ error: "Missing player id parameter" }, { status: 400 });
    }

    const playerId = parseInt(idParam, 10);
    const map = getPlayerHistoriesMap();
    const history = map.get(playerId) || [];

    return NextResponse.json({
      player_id: playerId,
      history,
    });
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Failed to load player history", details }, { status: 500 });
  }
}
