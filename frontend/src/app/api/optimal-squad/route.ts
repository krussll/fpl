import { NextResponse, NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import { OptimalSquad } from "@/types/player";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const horizonParam = searchParams.get("horizon");
    const horizon = horizonParam ? parseInt(horizonParam, 10) : 1;

    const cacheFileName =
      horizon === 5
        ? "optimal_squad_gw_5.json"
        : horizon === 3
        ? "optimal_squad_gw_3.json"
        : "optimal_squad_gw_1.json";

    const candidatePaths = [
      path.resolve(process.cwd(), ".fpl_cache", cacheFileName),
      path.resolve(process.cwd(), "..", ".fpl_cache", cacheFileName),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const squad = JSON.parse(raw) as OptimalSquad;
        return NextResponse.json(squad);
      }
    }

    return NextResponse.json(
      { error: `Optimal squad cache not found for horizon ${horizon}` },
      { status: 404 }
    );
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to load optimal squad", details },
      { status: 500 }
    );
  }
}
