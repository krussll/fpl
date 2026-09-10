import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { OptimalSquad } from "@/types/player";

export async function GET() {
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), ".fpl_cache", "optimal_squad_gw_1.json"),
      path.resolve(process.cwd(), "..", ".fpl_cache", "optimal_squad_gw_1.json"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const squad = JSON.parse(raw) as OptimalSquad;
        return NextResponse.json(squad);
      }
    }

    return NextResponse.json(
      { error: "Optimal squad cache not found" },
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
