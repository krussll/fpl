"""
Batch Monte Carlo Simulation Engine.
Runs 10,000 simulations for all 654 Premier League players using the latest model
with DefCon shrinkage and position rules across multiple CPU cores.
"""

import os
import json
import time
from concurrent.futures import ProcessPoolExecutor
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

from fpl_api import FPLApiClient
from simulator import FPLMonteCarloSimulator, SimulationSummary, MultiFixtureSummary
from player import PlayerProfile


def simulate_player_single_fixture(args: Tuple[Dict[str, Any], int]) -> Dict[str, Any]:
    raw, n_sims = args
    client = FPLApiClient()
    sim = FPLMonteCarloSimulator()
    
    p_id = raw["id"]
    t_id = raw["team"]
    pos_map = client.get_positions_map()
    teams_map = client.get_teams_map()
    pos = pos_map.get(raw["element_type"], "MID")
    team_name = teams_map.get(t_id, "Team")
    price = round(float(raw.get("now_cost") or 0) / 10.0, 1)
    mins = raw.get("minutes", 0)
    status = raw.get("status", "a")
    form = float(raw.get("form") or 0.0)
    selected_by_percent = float(raw.get("selected_by_percent") or 0.0)

    pdata = {"raw": raw, "minutes": mins}
    profile = client.build_player_profile(pdata)
    
    upcoming = client.get_upcoming_fixtures(t_id, count=1)
    fix_display = upcoming[0]["display"] if upcoming else "Upcoming"
    fix_opponent = upcoming[0]["opponent_name"] if upcoming else "Opponent"
    fdr = upcoming[0].get("fdr", 3) if upcoming else 3
    is_home = upcoming[0].get("is_home", True) if upcoming else True

    # Run 10,000 Monte Carlo simulations
    summary = sim.run(profile, n_simulations=n_sims)
    
    dist = {int(k): round(float(v), 4) for k, v in summary.distribution.items()}
    cs_prob = round(profile.team_clean_sheet_prob * 100, 1) if pos != "FWD" else 0.0
    defcon_prob = round(summary.defcon_rate * 100, 1)

    fixtures_info = [{
        "event": upcoming[0].get("event") if upcoming else None,
        "opponent": fix_display,
        "opponent_name": fix_opponent,
        "is_home": is_home,
        "fdr": fdr,
        "match_xp": round(summary.mean_points, 2),
        "cs_prob": cs_prob,
        "defcon_prob": defcon_prob
    }]

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
        "form": form,
        "selected_by_percent": selected_by_percent,
        "npxg90": profile.npxG90,
        "xa90": profile.xA90,
        "def_contrib90": profile.defensive_contrib_per_90,
        "saves90": profile.saves_per_90,
        "start_prob": round(profile.start_prob * 100, 0),
        "xp": round(summary.mean_points, 2),
        "ppm": round(summary.points_per_million, 2),
        "sigma": round(summary.std_dev, 2),
        "floor": round(summary.p10, 1),
        "median": round(summary.median_points, 1),
        "ceiling": round(summary.p90, 1),
        "haul_prob": round(summary.haul_rate * 100, 1),
        "defcon_prob": defcon_prob,
        "cs_prob": cs_prob,
        "fixtures": fixtures_info,
        "distribution": dist,
        "simulations": n_sims
    }


def simulate_player_multi_fixtures(args: Tuple[Dict[str, Any], int, int]) -> Dict[str, Any]:
    raw, count, n_sims = args
    client = FPLApiClient()
    sim = FPLMonteCarloSimulator()
    
    p_id = raw["id"]
    t_id = raw["team"]
    pos_map = client.get_positions_map()
    teams_map = client.get_teams_map()
    pos = pos_map.get(raw["element_type"], "MID")
    team_name = teams_map.get(t_id, "Team")
    price = round(float(raw.get("now_cost") or 0) / 10.0, 1)
    mins = raw.get("minutes", 0)
    status = raw.get("status", "a")
    form = float(raw.get("form") or 0.0)
    selected_by_percent = float(raw.get("selected_by_percent") or 0.0)

    pdata = {"raw": raw, "minutes": mins}
    profiles = client.build_multi_fixture_profiles(pdata, count=count)
    
    upcoming = client.get_upcoming_fixtures(t_id, count=count)
    ms = sim.run_multi_fixtures(profiles, n_simulations=n_sims)
    
    dist = {int(k): round(float(v), 4) for k, v in ms.distribution.items()}
    
    fixtures_info = []
    for prof, s, fix in zip(profiles, ms.fixture_summaries, upcoming):
        f_cs = round(prof.team_clean_sheet_prob * 100, 1) if pos != "FWD" else 0.0
        f_defcon = round(s.defcon_rate * 100, 1)
        fixtures_info.append({
            "event": fix.get("event"),
            "opponent": fix["display"],
            "opponent_name": fix["opponent_name"],
            "is_home": fix["is_home"],
            "fdr": fix.get("fdr", 3),
            "match_xp": round(s.mean_points, 2),
            "cs_prob": f_cs,
            "defcon_prob": f_defcon
        })

    first_prof = profiles[0]
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
        "form": form,
        "selected_by_percent": selected_by_percent,
        "npxg90": first_prof.npxG90,
        "xa90": first_prof.xA90,
        "def_contrib90": first_prof.defensive_contrib_per_90,
        "saves90": first_prof.saves_per_90,
        "start_prob": round(first_prof.start_prob * 100, 0),
        "xp": round(ms.mean_total_points, 2),
        "ppm": round(ms.points_per_million, 2),
        "sigma": round(ms.std_dev, 2),
        "floor": round(ms.p10, 1),
        "median": round(ms.median_total_points, 1),
        "ceiling": round(ms.p90, 1),
        "haul_prob": round(float(np.mean(ms.total_points_array >= (8.0 * count))) * 100, 1),
        "defcon_prob": round(fixtures_info[0]["defcon_prob"], 1) if fixtures_info else 0.0,
        "cs_prob": round(fixtures_info[0]["cs_prob"], 1) if fixtures_info else 0.0,
        "fixtures": fixtures_info,
        "distribution": dist,
        "simulations": n_sims
    }


def run_all_player_simulations(fixtures_list: List[int] = [1, 3], n_sims: int = 10000) -> None:
    client = FPLApiClient()
    bootstrap = client.get_bootstrap()
    elements = bootstrap["elements"]
    print(f"[*] Loaded {len(elements)} players from FPL bootstrap.")
    
    os.makedirs(".fpl_cache", exist_ok=True)

    for fix_count in fixtures_list:
        print(f"\n[*] Running {n_sims:,} Monte Carlo simulations for {len(elements)} players across {fix_count} fixture(s)...")
        t0 = time.time()
        
        if fix_count == 1:
            tasks = [(e, n_sims) for e in elements]
            with ProcessPoolExecutor(max_workers=8) as executor:
                results = list(executor.map(simulate_player_single_fixture, tasks))
        else:
            tasks = [(e, fix_count, n_sims) for e in elements]
            with ProcessPoolExecutor(max_workers=8) as executor:
                results = list(executor.map(simulate_player_multi_fixtures, tasks))

        t1 = time.time()
        print(f"[✔] Completed {len(results)} simulations in {t1 - t0:.1f}s ({len(results)/(t1 - t0):.1f} players/sec).")
        
        cache_file = f".fpl_cache/simulations_10k_fixtures_{fix_count}.json"
        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump({
                "timestamp": time.time(),
                "simulations": n_sims,
                "fixtures_count": fix_count,
                "players_count": len(results),
                "players": results
            }, f)
        print(f"[✔] Saved precomputed simulations to {cache_file} ({os.path.getsize(cache_file) / 1024 / 1024:.2f} MB).")


def regenerate_saved_charts(n_sims: int = 10000) -> None:
    print(f"\n[*] Regenerating visual chart PNGs with 10,000 simulations...")
    client = FPLApiClient()
    sim = FPLMonteCarloSimulator(random_seed=42)
    
    chart_targets = [
        ("Haaland", 1, "erling_haaland_fpl_simulation.png"),
        ("Haaland", 3, "erling_haaland_3fixtures_simulation.png"),
        ("Saka", 1, "bukayo_saka_fpl_simulation.png"),
        ("Saka", 3, "bukayo_saka_3fixtures_simulation.png"),
        ("Saka", 5, "bukayo_saka_5fixtures_simulation.png"),
        ("Gabriel", 1, "gabriel_dos_santos_magalhães_fpl_simulation.png"),
        ("Gabriel", 3, "gabriel_dos_santos_magalhães_3fixtures_simulation.png"),
        ("Mukiele", 1, "nordi_mukiele_fpl_simulation.png"),
        ("Watkins", 1, "ollie_watkins_fpl_simulation.png"),
        ("Palmer", 1, "cole_palmer_simulation.png"),
        ("Semenyo", 4, "antoine_semenyo_4fixtures_simulation.png"),
        ("Schade", 1, "kevin_schade_fpl_simulation.png"),
        ("Schade", 4, "kevin_schade_4fixtures_simulation.png"),
        ("Pickford", 1, "jordan_pickford_fpl_simulation.png"),
        ("Raya", 3, "david_raya_martín_3fixtures_simulation.png"),
        ("Raya", 4, "david_raya_martín_4fixtures_simulation.png"),
        ("Mainoo", 1, "kobbie_mainoo_fpl_simulation.png"),
        ("Ndiaye", 4, "iliman_ndiaye_4fixtures_simulation.png"),
        ("Trafford", 4, "james_trafford_4fixtures_simulation.png"),
        ("Wirtz", 4, "florian_wirtz_4fixtures_simulation.png"),
        ("Kostoulas", 4, "charalampos_kostoulas_4fixtures_simulation.png"),
    ]

    for query, fix_count, filename in chart_targets:
        matches = client.search_players(query)
        if not matches:
            print(f"  (!) Player '{query}' not found, skipping.")
            continue
        raw_player = matches[0]["raw"]
        pdata = {"raw": raw_player, "minutes": raw_player.get("minutes", 0)}
        
        try:
            if fix_count == 1:
                prof = client.build_player_profile(pdata)
                s = sim.run(prof, n_simulations=n_sims)
                sim.plot_single_player(s, output_path=filename)
            else:
                profs = client.build_multi_fixture_profiles(pdata, count=fix_count)
                ms = sim.run_multi_fixtures(profs, n_simulations=n_sims)
                sim.plot_multi_fixture(ms, output_path=filename)
            print(f"  [✔] Generated {filename} ({raw_player['web_name']}, {fix_count} fix, 10,000 sims)")
        except Exception as e:
            print(f"  (!) Error generating {filename}: {e}")


if __name__ == "__main__":
    run_all_player_simulations(fixtures_list=[1, 2, 3, 4, 5], n_sims=10000)
    regenerate_saved_charts(n_sims=10000)
