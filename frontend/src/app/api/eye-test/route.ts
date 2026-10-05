import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamParam = (searchParams.get("team") || "").trim().toLowerCase();
    const gwParam = searchParams.get("gw");
    const playerIdParam = searchParams.get("player_id");

    const candidateDirs = [
      path.resolve(process.cwd(), ".fpl_cache"),
      path.resolve(process.cwd(), "..", ".fpl_cache"),
    ];

    let foundFiles: string[] = [];
    for (const dir of candidateDirs) {
      if (fs.existsSync(/*turbopackIgnore: true*/ dir)) {
        const files = fs.readdirSync(/*turbopackIgnore: true*/ dir).filter(f => f.startsWith("eye_test_gw") && f.endsWith(".json"));
        if (files.length > 0) {
          foundFiles = files.map(f => path.join(/*turbopackIgnore: true*/ dir, f));
          break;
        }
      }
    }

    if (foundFiles.length === 0) {
      return NextResponse.json({ reports: [] });
    }

    const reports: any[] = [];
    for (const fpath of foundFiles) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ fpath, "utf-8");
        const report = JSON.parse(raw);
        reports.push(report);
      } catch {}
    }

    // Filter by player_id if requested
    if (playerIdParam) {
      const pid = parseInt(playerIdParam, 10);
      for (const rep of reports) {
        if (rep.players) {
          for (const p of Object.values(rep.players) as any[]) {
            if (p.element_id === pid) {
              return NextResponse.json({
                player: p,
                match: {
                  team_name: rep.team_name,
                  opponent_name: rep.opponent_name,
                  gameweek: rep.gameweek,
                  score: rep.score,
                  venue: rep.venue,
                  sources: rep.sources,
                  overall_tactical_summary: rep.overall_tactical_summary
                }
              });
            }
          }
        }
      }
      return NextResponse.json({ error: "No eye-test found for player" }, { status: 404 });
    }

    // Filter by team / gameweek
    let filtered = reports;
    if (teamParam) {
      filtered = filtered.filter(r => r.team_name.toLowerCase().includes(teamParam));
    }
    if (gwParam) {
      const gw = parseInt(gwParam, 10);
      filtered = filtered.filter(r => r.gameweek === gw);
    }

    return NextResponse.json({ reports: filtered });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
