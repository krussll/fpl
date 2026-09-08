"""
FPL Squad Optimizer and Formation Selector.
Solves for the optimal 15-player squad and starting XI based on Monte Carlo projections,
respecting the £100.0m budget, position quotas, and team ownership limits.
"""

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
    (1, 5, 2, 3),
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
