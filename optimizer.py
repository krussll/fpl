"""
FPL Squad Optimizer and Formation Selector.
Solves for the optimal 15-player squad and starting XI based on Monte Carlo projections,
respecting the £100.0m budget, position quotas, and team ownership limits.
"""

import os
import json
import shutil
import time
from typing import List, Dict, Any, Tuple, Optional
import copy


VALID_FORMATIONS = [
    (1, 3, 5, 2),
    (1, 3, 4, 3),
    (1, 4, 4, 2),
    (1, 4, 3, 3),
    (1, 4, 5, 1),
    (1, 5, 3, 2),
    (1, 5, 4, 1),
]


def is_valid_gkp_pair(g1: Dict[str, Any], g2: Dict[str, Any]) -> bool:
    """
    Enforces the two valid FPL goalkeeper strategies:
    1. Premium Keeper (> £5.0m, e.g. Raya) paired with a £4.0m backup (deadspot).
    2. Rotating Budget Keepers (both <= £5.0m, with at least one <= £4.5m).
    Never permits two expensive keepers without rotation value (e.g. £5.0m + £5.0m or £6.0m + £5.0m).
    """
    prices = sorted([float(g1.get('price', 0.0)), float(g2.get('price', 0.0))])
    if prices[1] > 5.0:
        return prices[0] <= 4.0
    return prices[1] <= 5.0 and prices[0] <= 4.5


def get_gkp_rotation_schedule(g1: Dict[str, Any], g2: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    For rotating budget goalkeepers (Strategy 2), generates a gameweek-by-gameweek
    rotation schedule stating explicitly which goalkeeper starts in which gameweek.
    """
    fixes1 = g1.get('fixtures', [])
    fixes2 = g2.get('fixtures', [])
    n_matches = min(len(fixes1), len(fixes2))
    
    schedule = []
    for i in range(n_matches):
        f1 = fixes1[i]
        f2 = fixes2[i]
        xp1 = f1.get('match_xp', 0.0)
        xp2 = f2.get('match_xp', 0.0)
        fdr1 = f1.get('fdr', 3)
        fdr2 = f2.get('fdr', 3)
        
        if xp1 > xp2 or (xp1 == xp2 and fdr1 <= fdr2):
            starter, bench = g1, g2
            s_fix, b_fix = f1, f2
        else:
            starter, bench = g2, g1
            s_fix, b_fix = f2, f1
            
        schedule.append({
            'gameweek': f1.get('event', i + 1),
            'starter': starter['name'],
            'starter_team': starter['team'],
            'starter_opponent': s_fix.get('opponent', 'TBD'),
            'starter_fdr': s_fix.get('fdr', 3),
            'starter_cs_prob': s_fix.get('cs_prob', 0.0),
            'starter_match_xp': s_fix.get('match_xp', 0.0),
            'bench': bench['name'],
            'bench_opponent': b_fix.get('opponent', 'TBD'),
            'bench_fdr': b_fix.get('fdr', 3)
        })
    return schedule


def pick_best_starting_xi(squad: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Given a 15-player squad (2 GKP, 5 DEF, 5 MID, 3 FWD),
    finds the valid starting XI formation that maximizes expected points (xP),
    and assigns an optimal bench order.
    """
    gkps = sorted([p for p in squad if p['position'] == 'GKP'], key=lambda x: x.get('xp', 0), reverse=True)
    defs = sorted([p for p in squad if p['position'] == 'DEF'], key=lambda x: x.get('xp', 0), reverse=True)
    mids = sorted([p for p in squad if p['position'] == 'MID'], key=lambda x: x.get('xp', 0), reverse=True)
    fwds = sorted([p for p in squad if p['position'] == 'FWD'], key=lambda x: x.get('xp', 0), reverse=True)

    best_formation = None
    best_score = -1.0
    best_starters = []
    best_bench = []

    for n_gkp, n_def, n_mid, n_fwd in VALID_FORMATIONS:
        starters = (
            gkps[:n_gkp] +
            defs[:n_def] +
            mids[:n_mid] +
            fwds[:n_fwd]
        )
        total_xp = sum(p.get('xp', 0.0) for p in starters)
        if total_xp > best_score:
            best_score = total_xp
            best_formation = f'{n_def}-{n_mid}-{n_fwd}'
            best_starters = starters
            
            # Bench: backup keeper + remaining outfield players sorted by xP
            bench_gk = gkps[n_gkp:]
            bench_outfield = sorted(
                defs[n_def:] + mids[n_mid:] + fwds[n_fwd:],
                key=lambda x: x.get('xp', 0.0),
                reverse=True
            )
            best_bench = bench_gk + bench_outfield

    # Captain recommendations: highest ceiling / haul rate
    captain_candidates = sorted(
        best_starters,
        key=lambda x: (x.get('haul_prob', 0.0), x.get('ceiling', 0.0), x.get('xp', 0.0)),
        reverse=True
    )
    captain = captain_candidates[0] if captain_candidates else None
    vice_captain = captain_candidates[1] if len(captain_candidates) > 1 else None

    # Goalkeeper strategy analysis
    gkp_info = {'strategy': 'Standard', 'schedule': []}
    if len(gkps) >= 2:
        g1, g2 = gkps[0], gkps[1]
        max_p = max(g1['price'], g2['price'])
        min_p = min(g1['price'], g2['price'])
        if max_p > 5.0 and min_p <= 4.0:
            gkp_info = {
                'strategy': 'Set-and-Forget Premium',
                'premium_starter': g1['name'] if g1['price'] == max_p else g2['name'],
                'deadspot_backup': g2['name'] if g1['price'] == max_p else g1['name'],
                'schedule': []
            }
        elif max_p <= 5.0 and min_p <= 4.5:
            gkp_info = {
                'strategy': 'Rotating Budget Keepers',
                'schedule': get_gkp_rotation_schedule(g1, g2)
            }

    return {
        'formation': best_formation,
        'starting_xp': round(best_score, 2),
        'starters': best_starters,
        'bench': best_bench,
        'captain': captain,
        'vice_captain': vice_captain,
        'gkp_strategy_info': gkp_info
    }


def solve_optimal_squad(
    all_players: List[Dict[str, Any]],
    budget: float = 100.0,
    max_per_team: int = 3,
    locked_ids: Optional[List[int]] = None,
    excluded_ids: Optional[List[int]] = None,
    objective: str = 'xp'
) -> Dict[str, Any]:
    """
    Selects a 15-player squad (2 GKP, 5 DEF, 5 MID, 3 FWD) that maximizes the objective
    (expected points 'xp', ceiling 'ceiling', or value 'ppm') within budget and team limits.
    """
    locked_ids = set(locked_ids or [])
    excluded_ids = set(excluded_ids or [])

    pool = [p for p in all_players if p['id'] not in excluded_ids]
    pos_targets = {'GKP': 2, 'DEF': 5, 'MID': 5, 'FWD': 3}
    score_key = 'ceiling' if objective == 'ceiling' else ('ppm' if objective == 'value' else 'xp')

    # 1. Base squad: start with locked players
    current_squad = [p for p in pool if p['id'] in locked_ids]
    current_ids = {p['id'] for p in current_squad}
    pos_counts = {k: sum(1 for p in current_squad if p['position'] == k) for k in pos_targets}
    team_counts = {}
    for p in current_squad:
        t = p.get('team', 'Unknown')
        team_counts[t] = team_counts.get(t, 0) + 1

    # Fill remaining slots with the cheapest viable players to guarantee budget feasibility
    for pos, target in pos_targets.items():
        cheapest_pos = sorted(
            [p for p in pool if p['position'] == pos and p['id'] not in current_ids],
            key=lambda p: (p['price'], -p.get(score_key, 0.0))
        )
        for p in cheapest_pos:
            if pos_counts[pos] >= target:
                break
            t = p.get('team', 'Unknown')
            if team_counts.get(t, 0) >= max_per_team:
                continue
            if pos == 'GKP':
                existing_gkp = next((x for x in current_squad if x['position'] == 'GKP'), None)
                if existing_gkp and not is_valid_gkp_pair(existing_gkp, p):
                    continue
            current_squad.append(p)
            current_ids.add(p['id'])
            pos_counts[pos] += 1
            team_counts[t] = team_counts.get(t, 0) + 1

    total_cost = sum(p['price'] for p in current_squad)

    # 2. Local search upgrades: iteratively swap in higher-scoring alternatives within budget
    available = [p for p in pool if p['id'] not in current_ids]
    for _ in range(120):
        best_swap = None
        best_gain = 0.0
        for i, curr in enumerate(current_squad):
            if curr['id'] in locked_ids:
                continue
            for cand in available:
                if cand['position'] != curr['position']:
                    continue
                cand_team = cand.get('team', 'Unknown')
                curr_team = curr.get('team', 'Unknown')
                if cand_team != curr_team and team_counts.get(cand_team, 0) >= max_per_team:
                    continue
                if curr['position'] == 'GKP':
                    other_gkp = next((x for x in current_squad if x['position'] == 'GKP' and x['id'] != curr['id']), None)
                    if other_gkp and not is_valid_gkp_pair(other_gkp, cand):
                        continue
                cost_diff = cand['price'] - curr['price']
                if total_cost + cost_diff > budget:
                    continue
                gain = cand.get(score_key, 0.0) - curr.get(score_key, 0.0)
                if gain > best_gain:
                    best_gain = gain
                    best_swap = (i, curr, cand, cost_diff)

        if best_swap and best_gain > 0.001:
            idx, curr, cand, cost_diff = best_swap
            current_squad[idx] = cand
            current_ids.remove(curr['id'])
            current_ids.add(cand['id'])
            available.remove(cand)
            available.append(curr)
            curr_t = curr.get('team', 'Unknown')
            cand_t = cand.get('team', 'Unknown')
            team_counts[curr_t] = team_counts.get(curr_t, 1) - 1
            team_counts[cand_t] = team_counts.get(cand_t, 0) + 1
            total_cost += cost_diff
        else:
            break

    xi_analysis = pick_best_starting_xi(current_squad)
    total_squad_xp = sum(p.get('xp', 0.0) for p in current_squad)

    return {
        'squad': current_squad,
        'total_cost': round(total_cost, 1),
        'bank_remaining': round(max(0.0, budget - total_cost), 1),
        'total_squad_xp': round(total_squad_xp, 2),
        'starting_xi': xi_analysis
    }


def generate_optimal_squad_for_horizon(
    horizon: int = 1,
    base_dir: str = ".",
    budget: float = 100.0,
    max_per_team: int = 3,
    objective: str = "xp"
) -> Dict[str, Any]:
    """
    Solves for the optimal 15-player squad for a specific gameweek horizon
    and enriches players with fixture timelines, history, and captaincy metrics.
    """
    cache_dir = os.path.join(base_dir, ".fpl_cache")
    sim_path = os.path.join(cache_dir, f"simulations_10k_fixtures_{horizon}.json")
    sim_5_path = os.path.join(cache_dir, "simulations_10k_fixtures_5.json")
    history_path = os.path.join(cache_dir, "player_histories.json")

    if not os.path.exists(sim_path):
        raise FileNotFoundError(f"Simulation cache file not found: {sim_path}")

    with open(sim_path, "r", encoding="utf-8") as f:
        d_sim = json.load(f)
    players_h = d_sim["players"]
    players_map = {p["id"]: p for p in players_h}

    histories: Dict[str, Any] = {}
    if os.path.exists(history_path):
        try:
            with open(history_path, "r", encoding="utf-8") as f:
                histories = json.load(f)
        except Exception:
            histories = {}

    players_5_map: Dict[int, Any] = {}
    if os.path.exists(sim_5_path):
        try:
            with open(sim_5_path, "r", encoding="utf-8") as f:
                d_5 = json.load(f)
                players_5_map = {p["id"]: p for p in d_5.get("players", [])}
        except Exception:
            players_5_map = {}

    # Detect gameweek number from upcoming fixtures
    gw = 1
    for p in players_h:
        if p.get("fixtures"):
            ev = p["fixtures"][0].get("event")
            if ev is not None:
                gw = ev
                break

    # Solve optimal squad under budget and team limits
    res = solve_optimal_squad(
        all_players=players_h,
        budget=budget,
        max_per_team=max_per_team,
        objective=objective
    )
    xi = res["starting_xi"]
    starters_raw = xi["starters"]
    bench_raw = xi["bench"]

    # Select captain and vice captain (highest haul_prob, ceiling, and xp)
    captain_candidates = sorted(
        starters_raw,
        key=lambda x: (x.get("haul_prob", 0.0), x.get("ceiling", 0.0), x.get("xp", 0.0)),
        reverse=True
    )
    cap_p = captain_candidates[0] if captain_candidates else starters_raw[0]
    vc_p = captain_candidates[1] if len(captain_candidates) > 1 else starters_raw[1]

    def enrich_player(p: Dict[str, Any], is_starter: bool, bench_order: Optional[int] = None) -> Dict[str, Any]:
        pid = p["id"]
        full = copy.deepcopy(players_map[pid])
        p5 = players_5_map.get(pid)
        if p5:
            full["fixtures_5"] = p5.get("fixtures", [])
            full["five_gw"] = p5
        else:
            full["fixtures_5"] = full.get("fixtures", [])
        full["history"] = histories.get(str(pid), [])
        full["is_starter"] = is_starter
        if bench_order is not None:
            full["bench_order"] = bench_order
        full["is_captain"] = (pid == cap_p["id"])
        full["is_vice_captain"] = (pid == vc_p["id"])
        return full

    starters = [enrich_player(p, True) for p in starters_raw]
    bench = [enrich_player(p, False, i + 1) for i, p in enumerate(bench_raw)]

    total_cost = round(sum(p["price"] for p in starters + bench), 1)
    bank_remaining = round(max(0.0, budget - total_cost), 1)
    starting_xi_xp = round(sum(p["xp"] for p in starters), 2)
    cap_xp = round(cap_p["xp"], 2)
    total_match_xp = round(starting_xi_xp + cap_xp, 2)
    full_squad_xp = round(starting_xi_xp + sum(p["xp"] for p in bench), 2)

    first_fix_cap = cap_p.get("fixtures", [{}])[0]
    first_fix_vc = vc_p.get("fixtures", [{}])[0]
    opp_cap = f"{first_fix_cap.get('opponent', 'TBD')} +{horizon-1}" if horizon > 1 else first_fix_cap.get("opponent", "TBD")
    opp_vc = f"{first_fix_vc.get('opponent', 'TBD')} +{horizon-1}" if horizon > 1 else first_fix_vc.get("opponent", "TBD")

    captain_info = {
        "id": cap_p["id"],
        "name": cap_p["name"],
        "full_name": cap_p["full_name"],
        "team": cap_p["team"],
        "position": cap_p["position"],
        "price": cap_p["price"],
        "xp": cap_xp,
        "doubled_xp": round(cap_xp * 2, 2),
        "opponent": opp_cap,
        "fdr": first_fix_cap.get("fdr", 3)
    }

    vc_info = {
        "id": vc_p["id"],
        "name": vc_p["name"],
        "full_name": vc_p["full_name"],
        "team": vc_p["team"],
        "position": vc_p["position"],
        "price": vc_p["price"],
        "xp": round(vc_p["xp"], 2),
        "opponent": opp_vc,
        "fdr": first_fix_vc.get("fdr", 3)
    }

    formation_lines = {
        "gkp": [p for p in starters if p["position"] == "GKP"],
        "def": [p for p in starters if p["position"] == "DEF"],
        "mid": [p for p in starters if p["position"] == "MID"],
        "fwd": [p for p in starters if p["position"] == "FWD"]
    }

    squad_id = f"gw{gw}_{horizon}_gameweek_optimum" if horizon > 1 else f"gw{gw}_single_fixture_optimum"
    title = (
        f"Optimal Starting XI & 15-Player Squad: Gameweek {gw}"
        if horizon == 1 else
        f"Optimal Starting XI & 15-Player Squad: Next {horizon} Gameweeks (GW {gw}–{gw + horizon - 1})"
    )

    gkp_starter = formation_lines["gkp"][0] if formation_lines["gkp"] else {}
    gkp_backup = next((p for p in bench if p["position"] == "GKP"), {})
    if horizon == 1:
        notes = [
            f"Optimal Gameweek {gw} single-fixture selection solved from 10,000 Monte Carlo simulation runs under official £100.0m budget cap.",
            f"{xi['formation']} formation maximizing starting XI output ({starting_xi_xp:.2f} base xP, {total_match_xp:.2f} with captaincy).",
            f"Captain {cap_p['name']} commanded top haul rate ({cap_p.get('haul_prob', 0):.1f}%) and ceiling ({cap_p.get('ceiling', 0):.1f} pts) vs {opp_cap}, with {vc_p['name']} securing vice-captaincy.",
            f"Goalkeeper setup deploys {gkp_starter.get('name', 'starter')} (£{gkp_starter.get('price', 0.0):.1f}m) alongside £4.0m reserve {gkp_backup.get('name', 'backup')} to funnel funds into starting XI assets.",
            f"Outfield bench enablers provide autosub security while keeping squad cost under the £100.0m limit (£{bank_remaining:.1f}m ITB)."
        ]
    elif horizon == 3:
        notes = [
            f"Optimal 3-gameweek selection (GW {gw}–{gw+2}) solved from 10,000 Monte Carlo simulation runs per fixture.",
            f"{xi['formation']} formation yielding {starting_xi_xp:.2f} base xP ({total_match_xp:.2f} with captaincy), averaging {total_match_xp/3:.2f} projected match pts/GW.",
            f"Captaincy awarded to {cap_p['name']} ({cap_p.get('xp', 0):.2f} xP, {cap_p.get('haul_prob', 0):.1f}% haul rate) with {vc_p['name']} ({vc_p.get('xp', 0):.2f} xP) as vice-captain.",
            f"Balanced structure pairing premium talisman firepower with budget defensive starters.",
            f"Set-and-forget goalkeeper strategy with budget emergency outfield bench cover."
        ]
    else:
        notes = [
            f"Optimal 5-gameweek selection (GW {gw}–{gw+4}) solved from 10,000 Monte Carlo simulation runs per fixture.",
            f"{xi['formation']} formation yielding {starting_xi_xp:.2f} base xP ({total_match_xp:.2f} with captaincy), averaging {total_match_xp/5:.2f} projected match pts/GW.",
            f"Captaincy awarded to {cap_p['name']} ({cap_p.get('xp', 0):.2f} xP) with {vc_p['name']} ({vc_p.get('xp', 0):.2f} xP) as vice-captain.",
            f"Long-term transfer horizon optimizing fixture difficulty rating (FDR) runs across multiple gameweeks.",
            f"Budget efficiency (£{total_cost:.1f}m invested, £{bank_remaining:.1f}m ITB) concentrating capital in high-scoring starters."
        ]

    return {
        "id": squad_id,
        "gameweek": gw,
        "horizon": horizon,
        "title": title,
        "formation": xi["formation"],
        "budget": budget,
        "total_cost": total_cost,
        "bank_remaining": bank_remaining,
        "starting_xi_xp": starting_xi_xp,
        "total_match_xp": total_match_xp,
        "full_squad_xp": full_squad_xp,
        "captain": captain_info,
        "vice_captain": vc_info,
        "formation_lines": formation_lines,
        "starters": starters,
        "bench": bench,
        "notes": notes
    }


def update_saved_squads_markdown(
    squads: Dict[int, Dict[str, Any]],
    base_dir: str = "."
) -> None:
    """Updates SAVED_SQUADS.md with formatted tables and review notes for all horizons."""
    md_path = os.path.join(base_dir, "SAVED_SQUADS.md")
    today = time.strftime("%Y-%m-%d")

    content = [
        "# Saved FPL Squad Selections & Performance Tracker",
        "",
        "This document records the optimal 15-player squads generated by the 10,000-iteration Monte Carlo engine for performance review after gameweek fixtures conclude.",
        "",
        "---",
        ""
    ]

    sel_idx = 1
    for h in sorted(squads.keys()):
        s = squads[h]
        gw = s["gameweek"]
        c = s["captain"]
        vc = s["vice_captain"]
        end_gw = gw + h - 1
        horizon_label = f"{h}-Fixture Horizon: GW {gw}" if h == 1 else f"{h}-Fixture Horizon: GW {gw}–{end_gw}"
        title = f"## Selection {sel_idx}: Next {h} Gameweek{'s' if h > 1 else ''} ({horizon_label})"

        content.extend([
            title,
            "",
            f"- **Selection ID**: `{s['id']}`",
            f"- **Saved At**: {today}",
            f"- **Formation**: **{s['formation']}** *(Valid FPL formation)*",
            f"- **Budget**: £100.0m | **Cost**: £{s['total_cost']:.1f}m | **Bank**: £{s['bank_remaining']:.1f}m",
            f"- **Projected Starting XI xP**: **{s['starting_xi_xp']:.2f} pts**" + (f" *(avg {s['starting_xi_xp']/h:.2f} pts/GW)*" if h > 1 else ""),
            f"- **Captain (2x)**: **{c['name']}** (+{c['xp']:.2f} pts) $\\to$ **Total Match Projection: {s['total_match_xp']:.2f} pts**" + (f" *(avg {s['total_match_xp']/h:.2f} pts/GW)*" if h > 1 else ""),
            f"- **Vice-Captain**: **{vc['name']}** ({vc['xp']:.2f} xP)",
            f"- **Full Squad xP**: **{s['full_squad_xp']:.2f} pts**" + (f" *(avg {s['full_squad_xp']/h:.2f} pts/GW)*" if h > 1 else ""),
            "",
            "### Starting XI Lineup"
        ])

        if h == 1:
            content.append("| Pos | Player | Club | Price | Sim xP | Floor | Ceiling | Actual Pts | Notes / Performance Review |")
            content.append("| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |")
            for p in s["starters"]:
                pos = p["position"]
                name = p["name"]
                if p["id"] == c["id"]:
                    name += " `(C)`"
                elif p["id"] == vc["id"]:
                    name += " `(VC)`"
                club = p["team"]
                price = p["price"]
                xp = p["xp"]
                floor = p.get("floor", "-")
                ceil = p.get("ceiling", "-")
                opp = p["fixtures"][0]["opponent"] if p.get("fixtures") else "-"
                content.append(f"| **{pos}** | {name} | {club} | £{price:.1f}m | {xp:.2f} | {floor} | {ceil} | *(pending)* | vs {opp} |")
            content.extend([
                "",
                "### Bench Lineup (Budget Enablers)",
                "| Order | Pos | Player | Club | Price | Sim xP | Actual Pts | Role / Autosub Strategy |",
                "| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- |"
            ])
            for i, p in enumerate(s["bench"]):
                order = f"B{i+1}"
                pos = p["position"]
                name = p["name"]
                club = p["team"]
                price = p["price"]
                xp = p["xp"]
                opp = p["fixtures"][0]["opponent"] if p.get("fixtures") else "-"
                role = "Non-playing £4.0m deadspot keeper" if pos == "GKP" else f"{i}st Outfield Sub" if i == 1 else f"{i}nd Outfield Sub" if i == 2 else f"{i}rd Outfield Sub"
                content.append(f"| **{order}** | {pos} | {name} | {club} | £{price:.1f}m | {xp:.2f} | *(pending)* | {role} vs {opp} |")
            content.extend([
                "",
                "> **Single Gameweek Goalkeeper Note**: In a single gameweek selection, you do not need a second playing goalkeeper. The backup keeper can be bumped down to any playing £4.5m keeper, or for maximum money in the bank, go with a non-starting £4.0m deadspot to funnel every pound into the starting XI.",
                "",
                "---",
                ""
            ])
        else:
            content.append(f"| Pos | Player | Club | Price | {h}-GW xP | Avg/GW | Floor | Ceiling | Actual Pts | Fixtures (GW{gw}–{end_gw}) |")
            content.append("| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |")
            for p in s["starters"]:
                pos = p["position"]
                name = p["name"]
                if p["id"] == c["id"]:
                    name += " `(C)`"
                elif p["id"] == vc["id"]:
                    name += " `(VC)`"
                club = p["team"]
                price = p["price"]
                xp = p["xp"]
                avg = xp / h
                floor = p.get("floor", "-")
                ceil = p.get("ceiling", "-")
                fixes = ", ".join([f.get("opponent", "?") for f in p.get("fixtures", [])[:h]])
                content.append(f"| **{pos}** | {name} | {club} | £{price:.1f}m | {xp:.2f} | {avg:.2f} | {floor} | {ceil} | *(pending)* | {fixes} |")
            content.extend([
                "",
                "### Bench Lineup",
                f"| Order | Pos | Player | Club | Price | {h}-GW xP | Avg/GW | Actual Pts | Role / Autosub Strategy |",
                "| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- |"
            ])
            for i, p in enumerate(s["bench"]):
                order = f"B{i+1}"
                pos = p["position"]
                name = p["name"]
                club = p["team"]
                price = p["price"]
                xp = p["xp"]
                avg = xp / h
                role = "Non-playing budget keeper (frees funds for outfield talent)" if pos == "GKP" else f"{i}st Outfield Sub" if i == 1 else f"{i}nd Outfield Sub" if i == 2 else f"{i}rd Outfield Sub"
                content.append(f"| **{order}** | {pos} | {name} | {club} | £{price:.1f}m | {xp:.2f} | {avg:.2f} | *(pending)* | {role} |")
            content.extend([
                "",
                "---",
                ""
            ])
        sel_idx += 1

    content.extend([
        "## Review Checklist",
        "When fixtures conclude:",
        "1. Compare actual total FPL points against the projected Starting XI score.",
        "2. Measure captaincy success.",
        "3. Evaluate clean sheet delivery across defensive selections.",
        "4. Review bench contribution (did any starter fail to play, triggering autosub points?).",
        ""
    ])

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(content))
    print(f"[✔] Updated {md_path}")


def regenerate_all_optimal_squads(
    horizons: List[int] = [1, 3, 5],
    base_dir: str = "."
) -> Dict[int, Dict[str, Any]]:
    """
    Main orchestrator: regenerates optimal squads across all specified horizons,
    saves them to .fpl_cache and frontend/.fpl_cache, updates saved_squads.json,
    and updates SAVED_SQUADS.md.
    """
    print("[*] Regenerating optimal team selections across simulation horizons...")
    cache_dir = os.path.join(base_dir, ".fpl_cache")
    frontend_cache_dir = os.path.join(base_dir, "frontend", ".fpl_cache")
    os.makedirs(cache_dir, exist_ok=True)
    if os.path.exists(os.path.join(base_dir, "frontend")):
        os.makedirs(frontend_cache_dir, exist_ok=True)

    generated_squads: Dict[int, Dict[str, Any]] = {}
    for h in horizons:
        print(f"\n[*] Solving optimal squad for {h}-gameweek horizon...")
        squad = generate_optimal_squad_for_horizon(horizon=h, base_dir=base_dir)
        generated_squads[h] = squad

        out_file = os.path.join(cache_dir, f"optimal_squad_gw_{h}.json")
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(squad, f, indent=2)
        print(f"  [✔] Saved {out_file} (Formation: {squad['formation']}, XI xP: {squad['starting_xi_xp']} pts, Match xP: {squad['total_match_xp']} pts)")

        if os.path.exists(frontend_cache_dir):
            frontend_out = os.path.join(frontend_cache_dir, f"optimal_squad_gw_{h}.json")
            shutil.copy2(out_file, frontend_out)
            print(f"  [✔] Synced to {frontend_out}")

    # Update saved_squads.json
    saved_path = os.path.join(base_dir, "saved_squads.json")
    saved_data = {"squads": []}
    if os.path.exists(saved_path):
        try:
            with open(saved_path, "r", encoding="utf-8") as f:
                saved_data = json.load(f)
        except Exception:
            saved_data = {"squads": []}

    existing_squads = saved_data.get("squads", [])
    new_ids = {s["id"] for s in generated_squads.values()}
    updated_squads = [s for s in existing_squads if s.get("id") not in new_ids]
    for h in sorted(generated_squads.keys()):
        updated_squads.append(generated_squads[h])
    saved_data["squads"] = updated_squads

    with open(saved_path, "w", encoding="utf-8") as f:
        json.dump(saved_data, f, indent=2)
    print(f"\n[✔] Updated {saved_path} (Total saved squads: {len(updated_squads)})")

    # Update SAVED_SQUADS.md
    update_saved_squads_markdown(generated_squads, base_dir=base_dir)

    return generated_squads


if __name__ == "__main__":
    regenerate_all_optimal_squads(horizons=[1, 3, 5])
