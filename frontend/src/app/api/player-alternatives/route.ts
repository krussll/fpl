import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { Player, PlayerAlternativesData, PlayerAlternativeOption } from "@/types/player";

const cachedSimMap: Record<number, Player[]> = {};

function loadSimulationPlayers(horizon: number): Player[] {
  const safeH = [1, 3, 5].includes(horizon) ? horizon : 1;
  if (cachedSimMap[safeH]) return cachedSimMap[safeH];

  const candidatePaths = [
    path.resolve(process.cwd(), ".fpl_cache", `simulations_10k_fixtures_${safeH}.json`),
    path.resolve(process.cwd(), "..", ".fpl_cache", `simulations_10k_fixtures_${safeH}.json`),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
      try {
        const raw = fs.readFileSync(/*turbopackIgnore: true*/ p, "utf-8");
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.players)) {
          cachedSimMap[safeH] = parsed.players;
          return parsed.players;
        }
      } catch (err) {
        console.error(`Failed to parse simulation cache for horizon ${safeH}:`, err);
      }
    }
  }
  return [];
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const horizonParam = parseInt(searchParams.get("horizon") || "1", 10);
    const horizon = [1, 3, 5].includes(horizonParam) ? horizonParam : 1;

    if (!idParam) {
      return NextResponse.json({ error: "Missing required 'id' parameter" }, { status: 400 });
    }

    const playerId = parseInt(idParam, 10);
    const allPlayers = loadSimulationPlayers(horizon);

    const player = allPlayers.find((p) => p.id === playerId);
    if (!player) {
      return NextResponse.json({ error: `Player with id ${playerId} not found` }, { status: 404 });
    }

    // 1. Filter candidates at similar price point (±£0.5m) in same position
    let delta = 0.5;
    let pool = allPlayers.filter(
      (p) =>
        p.position === player.position &&
        p.id !== player.id &&
        p.price >= player.price - delta - 0.001 &&
        p.price <= player.price + delta + 0.001 &&
        p.status !== "u"
    );

    let bracketLabel = `±£0.5m (£${Math.max(3.5, player.price - delta).toFixed(1)}m – £${(
      player.price + delta
    ).toFixed(1)}m)`;

    // Graceful expansion for outliers (e.g. Haaland or Gabriel where no other player is in ±£0.5m)
    if (pool.length === 0) {
      delta = 1.5;
      pool = allPlayers.filter(
        (p) =>
          p.position === player.position &&
          p.id !== player.id &&
          p.price >= player.price - delta - 0.001 &&
          p.price <= player.price + delta + 0.001 &&
          p.status !== "u"
      );

      if (pool.length > 0) {
        bracketLabel = `Nearest bracket ±£1.5m (£${Math.max(3.5, player.price - delta).toFixed(
          1
        )}m – £${(player.price + delta).toFixed(1)}m)`;
      } else {
        // Extreme outlier fallback
        pool = allPlayers
          .filter((p) => p.position === player.position && p.id !== player.id && p.status !== "u")
          .sort((a, b) => b.price - a.price)
          .slice(0, 10);
        bracketLabel = `Top premium ${player.position} alternatives`;
      }
    }

    if (pool.length === 0) {
      return NextResponse.json<PlayerAlternativesData>({
        bracket_label: bracketLabel,
        is_viewed_player_rank1: true,
        template: null,
        haul: null,
        optimized: null,
      });
    }

    // 2. Determine if viewed player is rank #1 by xP in the original price bracket
    const fullBracket = allPlayers
      .filter(
        (p) =>
          p.position === player.position &&
          p.price >= player.price - 0.5 - 0.001 &&
          p.price <= player.price + 0.5 + 0.001 &&
          p.status !== "u"
      )
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));

    const isViewedPlayerRank1 = fullBracket.length > 0 && fullBracket[0].id === player.id;

    // 3. Balanced "Optimized" Pick (highest xP in candidate pool)
    // If the viewed player is the most optimal pick at that price, pool[0] is automatically the next optimal player!
    const poolByXp = [...pool].sort((a, b) => (b.xp || 0) - (a.xp || 0));
    const optPlayer = poolByXp[0];

    // 4. Safe "Template" Pick (highest FPL ownership %, distinct from optimized if pool >= 2)
    const poolForTemplate = pool.filter((p) => p.id !== optPlayer.id);
    const templatePool = poolForTemplate.length > 0 ? poolForTemplate : pool;
    const tmplPlayer = [...templatePool].sort(
      (a, b) => (b.selected_by_percent || 0) - (a.selected_by_percent || 0)
    )[0];

    // 5. High Upside "Haul" Potential (highest haul_prob and ceiling, distinct if pool >= 3)
    const poolForHaul = pool.filter((p) => p.id !== optPlayer.id && p.id !== tmplPlayer.id);
    const haulPool =
      poolForHaul.length > 0
        ? poolForHaul
        : pool.filter((p) => p.id !== optPlayer.id).length > 0
        ? pool.filter((p) => p.id !== optPlayer.id)
        : pool;
    const haulPlayer = [...haulPool].sort(
      (a, b) =>
        (b.haul_prob || 0) - (a.haul_prob || 0) || (b.ceiling || 0) - (a.ceiling || 0)
    )[0];

    const makeOption = (
      p: Player,
      strategy: "template" | "haul" | "optimized"
    ): PlayerAlternativeOption => {
      const xpDiff = Number((p.xp - player.xp).toFixed(2));
      const costDiff = Number((p.price - player.price).toFixed(1));

      if (strategy === "template") {
        return {
          strategy: "template",
          title: 'Safe "Template" Pick',
          badge: "Rank Protection",
          player: p,
          key_stat: `${p.selected_by_percent.toFixed(1)}% ownership`,
          xp_diff: xpDiff,
          cost_diff: costDiff,
          rationale: `Highest-owned ${player.position} in this price bracket to minimize rank volatility.`,
        };
      }

      if (strategy === "haul") {
        return {
          strategy: "haul",
          title: 'High Upside "Haul" Potential',
          badge: "Haul Contender",
          player: p,
          key_stat: `${p.haul_prob.toFixed(1)}% haul rate • ${p.ceiling.toFixed(1)} ceiling`,
          xp_diff: xpDiff,
          cost_diff: costDiff,
          rationale: `Top ceiling outcome and explosive multi-return potential in simulated fixtures.`,
        };
      }

      // optimized
      return {
        strategy: "optimized",
        title: 'Balanced "Optimized" Pick',
        badge: isViewedPlayerRank1 ? "Next Best at Price" : "Points Upgrade",
        player: p,
        key_stat: `${p.xp.toFixed(1)} projected xP`,
        xp_diff: xpDiff,
        cost_diff: costDiff,
        is_next_best: isViewedPlayerRank1,
        rationale: isViewedPlayerRank1
          ? `${player.name} is the #1 optimal pick at this price. Recommending ${p.name} as the next best optimal alternative.`
          : `${p.name} provides the highest mathematical points projection in this price tier (+${xpDiff} xP).`,
      };
    };

    const responseData: PlayerAlternativesData = {
      bracket_label: bracketLabel,
      is_viewed_player_rank1: isViewedPlayerRank1,
      template: tmplPlayer ? makeOption(tmplPlayer, "template") : null,
      haul: haulPlayer ? makeOption(haulPlayer, "haul") : null,
      optimized: optPlayer ? makeOption(optPlayer, "optimized") : null,
    };

    return NextResponse.json(responseData);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Player alternatives error:", err);
    return NextResponse.json(
      { error: "Failed to generate player alternatives", details: msg },
      { status: 500 }
    );
  }
}
