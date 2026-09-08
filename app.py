"""
FastAPI Web Application for FPL Monte Carlo Simulation and Team Selection.
Serves an interactive dashboard to search, filter, compare players, and optimize squads.
"""

import os
import json
import math
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from fpl_api import FPLApiClient
from simulator import FPLMonteCarloSimulator
from optimizer import solve_optimal_squad, pick_best_starting_xi

app = FastAPI(title="FPL Monte Carlo Explorer", version="1.0.0")

# Ensure static folder exists
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

client = FPLApiClient()
simulator = FPLMonteCarloSimulator()

_CACHE_MEMORY: Dict[int, Dict[int, Dict[str, Any]]] = {}

def get_fixture_cache(fixtures: int) -> Optional[Dict[int, Dict[str, Any]]]:
    """Returns in-memory map of player_id -> player_data for precomputed 10k simulations."""
    if fixtures in _CACHE_MEMORY:
        return _CACHE_MEMORY[fixtures]
    cache_file = Path(__file__).resolve().parent / ".fpl_cache" / f"simulations_10k_fixtures_{fixtures}.json"
    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            players_map = {p["id"]: p for p in data.get("players", [])}
            _CACHE_MEMORY[fixtures] = players_map
            return players_map
        except Exception as e:
            print(f"[!] Error loading cache for fixtures {fixtures}: {e}")
    return None


class OptimizeRequest(BaseModel):
    budget: float = 100.0
    locked_ids: List[int] = []
    excluded_ids: List[int] = []
    objective: str = "xp"
    fixtures: int = 1


def calculate_player_projections(raw_player: Dict[str, Any], fixtures_count: int = 1) -> Dict[str, Any]:
    """
    Calculates reliable projected metrics for a player across 'fixtures_count' upcoming matches.
    Applies empirical Bayesian shrinkage for low-minute samples to prevent distortion.
    """
    raw = raw_player
    p_id = raw["id"]
    t_id = raw["team"]
    pos_map = client.get_positions_map()
    teams_map = client.get_teams_map()
    pos = pos_map.get(raw["element_type"], "MID")
    team_name = teams_map.get(t_id, "Team")
    price = round(float(raw.get("now_cost") or 0) / 10.0, 1)
    mins = raw.get("minutes", 0)

    # Underlying metrics
    raw_npxg = float(raw.get("expected_goals_per_90") or 0.0)
    raw_xa = float(raw.get("expected_assists_per_90") or 0.0)
    raw_def_contrib = float(raw.get("defensive_contribution_per_90") or 0.0)
    raw_saves = float(raw.get("saves_per_90") or 0.0)

    # Bayesian shrinkage for low minutes (< 360 mins for attacking, < 450 mins for defensive)
    shrinkage = min(1.0, mins / 360.0)
    def_shrinkage = min(1.0, mins / 450.0)
    pos_baseline_xg = {"FWD": 0.35, "MID": 0.15, "DEF": 0.05, "GKP": 0.00}.get(pos, 0.15)
    pos_baseline_xa = {"FWD": 0.15, "MID": 0.15, "DEF": 0.08, "GKP": 0.00}.get(pos, 0.12)
    pos_baseline_def = {"DEF": 7.6, "MID": 8.2, "FWD": 4.5, "GKP": 0.0}.get(pos, 7.6)

    npxg90 = (raw_npxg * shrinkage) + (pos_baseline_xg * (1.0 - shrinkage))
    xa90 = (raw_xa * shrinkage) + (pos_baseline_xa * (1.0 - shrinkage))
    def_contrib90 = (raw_def_contrib * def_shrinkage) + (pos_baseline_def * (1.0 - def_shrinkage)) if pos != "GKP" else 0.0

    # Playing probability (granular tiers)
    status = raw.get("status", "a")
    if status in ["u", "i", "s"]:
        start_prob = 0.0
    elif status == "d":
        chance = raw.get("chance_of_playing_next_round")
        start_prob = (chance / 100.0 * 0.85) if chance is not None else 0.40
    elif mins >= 270:
        start_prob = 0.92
    elif mins >= 180:
        start_prob = 0.82
    elif mins >= 60:
        start_prob = 0.50
    elif mins >= 15:
        start_prob = 0.20
    elif mins > 0:
        start_prob = 0.05
    else:
        start_prob = 0.02

    expected_mins = (84.0 if mins >= 270 else (80.0 if mins >= 180 else 60.0)) * start_prob

    # Upcoming fixtures
    upcoming = client.get_upcoming_fixtures(t_id, count=max(1, min(fixtures_count, 5)))
    ratings = client.get_team_ratings()["teams"]
    my_team_rating = ratings.get(t_id, {"def_ratio": 1.0, "att_ratio": 1.0, "xGC90": 1.35})

    total_xp = 0.0
    fixtures_info = []

    goal_multiplier = 6 if pos in ["GKP", "DEF"] else (5 if pos == "MID" else 4)
    cs_pts = 4 if pos in ["GKP", "DEF"] else (1 if pos == "MID" else 0)

    for fix in upcoming:
        opp_id = fix["opponent_id"]
        is_home = fix["is_home"]
        opp_rating = ratings.get(opp_id, {"def_ratio": 1.0, "att_ratio": 1.0, "xGC90": 1.45, "xG90": 1.35})

        opp_def_ratio = max(0.45, min(1.65, opp_rating.get("def_ratio", 1.0)))
        opp_att_ratio = max(0.45, min(1.65, opp_rating.get("att_ratio", 1.0)))

        venue_att = 1.08 if is_home else 0.92
        venue_def = 0.90 if is_home else 1.10

        match_att_scale = opp_def_ratio * venue_att
        match_def_scale = opp_att_ratio * venue_def

        # Clean sheet prob
        base_xgc = my_team_rating.get("xGC90", 1.25)
        match_xgc = max(0.3, base_xgc * match_def_scale)
        cs_prob = math.exp(-match_xgc)

        # Saves prob
        saves_rate = (raw_saves if mins >= 180 else 3.2) * opp_att_ratio if pos == "GKP" else 0.0

        # DefCon prob: Poisson >= threshold
        thresh = 10 if pos == "DEF" else 12
        def_lambda = def_contrib90 * (expected_mins / 90.0) * (0.85 + 0.15 * opp_att_ratio)
        # Poisson survival approx
        defcon_prob = 0.0
        if def_lambda > 0 and pos in ["DEF", "MID", "FWD"]:
            # Sum of Poisson(k) for k < thresh
            p_less = sum((def_lambda ** k * math.exp(-def_lambda)) / math.factorial(k) for k in range(thresh))
            defcon_prob = max(0.0, min(1.0, 1.0 - p_less))

        # Expected Points for match
        is_pen = raw.get("penalties_order") == 1
        pen_xg = (0.13 * 0.80) if is_pen else 0.0
        match_npxg = npxg90 * match_att_scale
        match_xa = xa90 * match_att_scale

        match_xp = (
            (expected_mins / 90.0) * (
                2.0 +
                ((match_npxg + pen_xg) * goal_multiplier) +
                (match_xa * 3.0) +
                (saves_rate / 3.0)
            ) +
            (cs_pts * cs_prob * (1.0 if expected_mins >= 60 else 0.0)) -
            ((match_xgc / 2.0) if pos in ["GKP", "DEF"] and expected_mins >= 60 else 0.0) +
            (2.0 * defcon_prob) -
            0.10  # cards
        )
        # Bonus factor
        bonus_est = 0.20 * match_npxg + 0.15 * match_xa + 0.10 * (cs_prob if pos in ["DEF", "GKP"] else 0)
        match_xp += bonus_est
        match_xp = max(0.0, match_xp)
        total_xp += match_xp

        fixtures_info.append({
            "event": fix.get("event"),
            "opponent": fix["display"],
            "opponent_name": fix["opponent_name"],
            "is_home": is_home,
            "fdr": fix.get("fdr", 3),
            "match_xp": round(match_xp, 2),
            "cs_prob": round(cs_prob * 100, 1),
            "defcon_prob": round(defcon_prob * 100, 1)
        })

    total_xp = round(total_xp, 2)
    ppm = round(total_xp / price, 2) if price > 0 else 0.0

    # Volatility and percentiles approximation
    pos_sigma_single = {"FWD": 3.5, "MID": 3.2, "DEF": 2.8, "GKP": 2.4}.get(pos, 3.0)
    sigma = round(pos_sigma_single * math.sqrt(fixtures_count), 2)
    floor = round(max(0.0, total_xp - 1.28 * sigma), 1)
    ceiling = round(total_xp + 1.28 * sigma, 1)

    # Haul rate (>= 10 pts in single match or >= 8*K in multi)
    target_haul = 10.0 if fixtures_count == 1 else (8.0 * fixtures_count)
    z_haul = (target_haul - total_xp) / max(0.5, sigma)
    # Approx CDF
    haul_prob = round(max(0.01, min(0.95, 0.5 * (1.0 - math.erf(z_haul / 1.4142)))), 3)

    return {
        "id": p_id,
        "name": raw["web_name"],
        "full_name": f"{raw['first_name']} {raw['second_name']}",
        "team": team_name,
        "team_id": t_id,
        "position": pos,
        "price": price,
        "minutes": mins,
        "status": status,
        "form": float(raw.get("form") or 0.0),
        "selected_by_percent": float(raw.get("selected_by_percent") or 0.0),
        "npxg90": round(npxg90, 2),
        "xa90": round(xa90, 2),
        "def_contrib90": round(def_contrib90, 1),
        "saves90": round(raw_saves, 1),
        "start_prob": round(start_prob * 100, 0),
        "xp": total_xp,
        "ppm": ppm,
        "sigma": sigma,
        "floor": floor,
        "ceiling": ceiling,
        "haul_prob": round(haul_prob * 100, 1),
        "defcon_prob": round(fixtures_info[0]["defcon_prob"], 1) if fixtures_info else 0.0,
        "cs_prob": round(fixtures_info[0]["cs_prob"], 1) if (fixtures_info and pos != "FWD") else 0.0,
        "fixtures": fixtures_info
    }


@app.get("/")
def serve_index():
    return FileResponse("static/index.html")


@app.get("/styles.css")
def serve_styles():
    return FileResponse("static/styles.css")


@app.get("/app.js")
def serve_js():
    return FileResponse("static/app.js")


@app.get("/api/players")
def get_players(
    fixtures: int = Query(1, ge=1, le=5),
    position: str = Query("ALL"),
    max_price: float = Query(20.0),
    query: str = Query("")
):
    # Check if precomputed 10,000-iteration Monte Carlo cache exists
    cached_map = get_fixture_cache(fixtures)
    if cached_map:
        q = query.strip().lower()
        results = []
        for p in cached_map.values():
            if position != "ALL" and p["position"] != position:
                continue
            if p["price"] > max_price:
                continue
            if q:
                name_match = (q in p["name"].lower() or q in p["full_name"].lower())
                team_match = q in p["team"].lower()
                if not (name_match or team_match):
                    continue
            results.append(p)
        results.sort(key=lambda x: x["xp"], reverse=True)
        return {"total": len(results), "fixtures": fixtures, "simulations": 10000, "players": results}

    # Fallback to analytical calculation
    bootstrap = client.get_bootstrap()
    elements = bootstrap["elements"]
    
    pos_map = client.get_positions_map()
    filtered = []
    q = query.strip().lower()

    for raw in elements:
        pos = pos_map.get(raw["element_type"], "MID")
        if position != "ALL" and pos != position:
            continue
        price = float(raw.get("now_cost") or 0) / 10.0
        if price > max_price:
            continue
        if q:
            name_match = (q in raw["web_name"].lower() or
                          q in raw["first_name"].lower() or
                          q in raw["second_name"].lower())
            team_name = client.get_teams_map().get(raw["team"], "").lower()
            if not (name_match or q in team_name):
                continue
        filtered.append(raw)

    results = [calculate_player_projections(raw, fixtures_count=fixtures) for raw in filtered]
    results.sort(key=lambda p: p["xp"], reverse=True)
    return {"total": len(results), "fixtures": fixtures, "players": results}


@app.get("/api/player/{player_id}/simulate")
def simulate_player(
    player_id: int,
    fixtures: int = Query(1, ge=1, le=5),
    sims: int = Query(10000, ge=500, le=50000)
):
    # Check if precomputed 10,000-iteration Monte Carlo cache exists for this player
    cached_map = get_fixture_cache(fixtures)
    if cached_map and player_id in cached_map:
        p = cached_map[player_id]
        dist = p.get("distribution", {})
        scores = [int(k) for k in dist.keys()] if dist else []
        return {
            "player_id": player_id,
            "name": p.get("full_name", p.get("name")),
            "position": p["position"],
            "price": p["price"],
            "opponent": p["fixtures"][0]["opponent"] if p.get("fixtures") else "TBD",
            "fixtures_count": fixtures,
            "simulations": p.get("simulations", 10000),
            "mean_xp": p["xp"],
            "median": p.get("median", p["xp"]),
            "mode": int(max(dist.items(), key=lambda kv: kv[1])[0]) if dist else 2,
            "std_dev": p.get("sigma", 0.0),
            "min": min(scores) if scores else 0,
            "max": max(scores) if scores else 0,
            "p10": p.get("floor", 0.0),
            "p25": p.get("p25", p.get("floor", 0.0)),
            "p50": p.get("median", p["xp"]),
            "p75": p.get("p75", p.get("ceiling", 0.0)),
            "p90": p.get("ceiling", 0.0),
            "p95": p.get("p95", p.get("ceiling", 0.0)),
            "blank_rate": round(sum(v for k, v in dist.items() if int(k) <= 2) * 100, 1) if dist else 0.0,
            "return_rate": round(sum(v for k, v in dist.items() if int(k) >= 5) * 100, 1) if dist else 0.0,
            "haul_rate": p.get("haul_prob", 0.0),
            "mega_haul_rate": round(sum(v for k, v in dist.items() if int(k) >= (15.0 if fixtures == 1 else 12.0 * fixtures)) * 100, 1) if dist else 0.0,
            "defcon_rate": p.get("defcon_prob", 0.0),
            "points_per_million": p.get("ppm", 0.0),
            "distribution": dist,
            "fixtures_breakdown": p.get("fixtures", []),
            "profile_details": {
                "start_prob": p.get("start_prob", 90.0),
                "npxg90": p.get("npxg90", 0.0),
                "xa90": p.get("xa90", 0.0),
                "def_contrib90": p.get("def_contrib90", 0.0),
                "clean_sheet_prob": p.get("cs_prob", 0.0) if p.get("position") != "FWD" else 0.0,
                "is_pen_taker": False
            }
        }

    raw_player = client.get_player_by_id(player_id)
    if not raw_player:
        raise HTTPException(status_code=404, detail="Player not found")

    player_data = {"raw": raw_player, "minutes": raw_player.get("minutes", 0)}

    if fixtures > 1:
        profiles = client.build_multi_fixture_profiles(player_data, count=fixtures)
        multi_summary = simulator.run_multi_fixtures(profiles, n_simulations=sims)
        
        # Convert total distribution to serializable dict
        dist = {int(k): round(float(v), 4) for k, v in multi_summary.distribution.items()}
        
        # Fixture summaries
        fix_reports = []
        for i, (prof, s) in enumerate(zip(profiles, multi_summary.fixture_summaries), 1):
            fix_reports.append({
                "index": i,
                "opponent": prof.opponent,
                "npxg90": prof.npxG90,
                "xa90": prof.xA90,
                "cs_prob": round(prof.team_clean_sheet_prob * 100, 1),
                "defcon_rate": round(s.defcon_rate * 100, 1),
                "mean_xp": round(s.mean_points, 2),
                "floor": round(s.p10, 1),
                "ceiling": round(s.p90, 1),
                "haul_rate": round(s.haul_rate * 100, 1)
            })

        return {
            "player_id": player_id,
            "name": multi_summary.player_name,
            "position": multi_summary.position,
            "price": multi_summary.price,
            "fixtures_count": fixtures,
            "simulations": sims,
            "mean_xp": round(multi_summary.mean_total_points, 2),
            "median": round(multi_summary.median_total_points, 1),
            "mode": multi_summary.mode_total_points,
            "std_dev": round(multi_summary.std_dev, 2),
            "min": multi_summary.min_points,
            "max": multi_summary.max_points,
            "p10": round(multi_summary.p10, 1),
            "p25": round(multi_summary.p25, 1),
            "p50": round(multi_summary.p50, 1),
            "p75": round(multi_summary.p75, 1),
            "p90": round(multi_summary.p90, 1),
            "p95": round(multi_summary.p95, 1),
            "points_per_million": multi_summary.points_per_million,
            "distribution": dist,
            "fixtures_breakdown": fix_reports
        }
    else:
        profile = client.build_player_profile(player_data)
        summary = simulator.run(profile, n_simulations=sims)
        dist = {int(k): round(float(v), 4) for k, v in summary.distribution.items()}
        return {
            "player_id": player_id,
            "name": summary.player_name,
            "position": summary.position,
            "price": summary.player_price,
            "opponent": profile.opponent,
            "fixtures_count": 1,
            "simulations": sims,
            "mean_xp": round(summary.mean_points, 2),
            "median": round(summary.median_points, 1),
            "mode": summary.mode_points,
            "std_dev": round(summary.std_dev, 2),
            "min": summary.min_points,
            "max": summary.max_points,
            "p10": round(summary.p10, 1),
            "p25": round(summary.p25, 1),
            "p50": round(summary.p50, 1),
            "p75": round(summary.p75, 1),
            "p90": round(summary.p90, 1),
            "p95": round(summary.p95, 1),
            "blank_rate": round(summary.blank_rate * 100, 1),
            "return_rate": round(summary.return_rate * 100, 1),
            "haul_rate": round(summary.haul_rate * 100, 1),
            "mega_haul_rate": round(summary.mega_haul_rate * 100, 1),
            "defcon_rate": round(summary.defcon_rate * 100, 1),
            "points_per_million": summary.points_per_million,
            "distribution": dist,
            "profile_details": {
                "start_prob": round(profile.start_prob * 100, 0),
                "npxg90": profile.npxG90,
                "xa90": profile.xA90,
                "def_contrib90": profile.defensive_contrib_per_90,
                "clean_sheet_prob": round(profile.team_clean_sheet_prob * 100, 1),
                "is_pen_taker": profile.is_pen_taker
            }
        }


@app.get("/api/compare")
def compare_players(
    ids: str = Query(..., description="Comma-separated player IDs (e.g. '301,350')"),
    fixtures: int = Query(1, ge=1, le=5),
    sims: int = Query(10000, ge=500, le=50000)
):
    id_list = [int(x.strip()) for x in ids.split(",") if x.strip().isdigit()]
    if len(id_list) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 valid player IDs")

    summaries = []
    points_arrays = []

    for pid in id_list:
        raw_player = client.get_player_by_id(pid)
        if not raw_player:
            continue
        pdata = {"raw": raw_player, "minutes": raw_player.get("minutes", 0)}
        if fixtures > 1:
            profs = client.build_multi_fixture_profiles(pdata, count=fixtures)
            ms = simulator.run_multi_fixtures(profs, n_simulations=sims)
            summaries.append({
                "id": pid,
                "name": ms.player_name,
                "position": ms.position,
                "price": ms.price,
                "selected_by_percent": float(raw_player.get("selected_by_percent") or 0.0),
                "mean_xp": round(ms.mean_total_points, 2),
                "median": round(ms.median_total_points, 1),
                "p10": round(ms.p10, 1),
                "p90": round(ms.p90, 1),
                "ppm": ms.points_per_million,
                "distribution": {int(k): round(float(v), 4) for k, v in ms.distribution.items()}
            })
            points_arrays.append(ms.total_points_array)
        else:
            prof = client.build_player_profile(pdata)
            s = simulator.run(prof, n_simulations=sims)
            summaries.append({
                "id": pid,
                "name": s.player_name,
                "position": s.position,
                "price": s.player_price,
                "selected_by_percent": float(raw_player.get("selected_by_percent") or 0.0),
                "mean_xp": round(s.mean_points, 2),
                "median": round(s.median_points, 1),
                "p10": round(s.p10, 1),
                "p90": round(s.p90, 1),
                "ppm": s.points_per_million,
                "haul_rate": round(s.haul_rate * 100, 1),
                "defcon_rate": round(s.defcon_rate * 100, 1),
                "distribution": {int(k): round(float(v), 4) for k, v in s.distribution.items()}
            })
            points_arrays.append(s.points_array)

    # Pairwise win matrix (for Captaincy decider)
    head_to_head = []
    for i in range(len(summaries)):
        for j in range(i + 1, len(summaries)):
            arr_i = points_arrays[i]
            arr_j = points_arrays[j]
            p_i_wins = float((arr_i > arr_j).mean()) * 100
            p_j_wins = float((arr_j > arr_i).mean()) * 100
            ties = float((arr_i == arr_j).mean()) * 100
            head_to_head.append({
                "player_a": summaries[i]["name"],
                "player_b": summaries[j]["name"],
                "a_win_pct": round(p_i_wins, 1),
                "b_win_pct": round(p_j_wins, 1),
                "tie_pct": round(ties, 1)
            })

    return {
        "fixtures": fixtures,
        "simulations": sims,
        "players": summaries,
        "head_to_head": head_to_head
    }


@app.post("/api/optimize")
def optimize_squad(req: OptimizeRequest):
    # Fetch player projections
    bootstrap = client.get_bootstrap()
    all_players = [calculate_player_projections(raw, fixtures_count=req.fixtures) for raw in bootstrap["elements"]]
    
    res = solve_optimal_squad(
        all_players=all_players,
        budget=req.budget,
        max_per_team=3,
        locked_ids=req.locked_ids,
        excluded_ids=req.excluded_ids,
        objective=req.objective
    )
    return res


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=True)
