"""
Official Fantasy Premier League (FPL) API Client.
Fetches live Opta stats (xG90, xA90, minutes, fixture, penalties) directly from FPL.
"""

import os
import json
import time
import urllib.request
from typing import Dict, List, Optional, Any

from player import PlayerProfile, Position


class FPLApiClient:
    """Client for official FPL API endpoints with local caching."""
    
    BOOTSTRAP_URL = "https://fantasy.premierleague.com/api/bootstrap-static/"
    FIXTURES_URL = "https://fantasy.premierleague.com/api/fixtures/?future=1"

    def __init__(self, cache_dir: str = ".fpl_cache", cache_ttl_seconds: int = 3600):
        self.cache_dir = cache_dir
        self.cache_ttl = cache_ttl_seconds
        os.makedirs(self.cache_dir, exist_ok=True)
        self._bootstrap_data: Optional[Dict[str, Any]] = None
        self._fixtures_data: Optional[List[Dict[str, Any]]] = None

    def _fetch_with_cache(self, url: str, cache_filename: str) -> Any:
        cache_path = os.path.join(self.cache_dir, cache_filename)
        
        # Check cache validity
        if os.path.exists(cache_path):
            file_age = time.time() - os.path.getmtime(cache_path)
            if file_age < self.cache_ttl:
                try:
                    with open(cache_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass  # Fall back to live fetch if cache read fails

        # Live HTTP fetch
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (FPL-MonteCarlo/1.0)"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Save to local cache
        try:
            with open(cache_path, "w", encoding="utf-8") as f:
                json.dump(data, f)
        except Exception:
            pass

        return data

    def get_bootstrap(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Fetch bootstrap-static containing players, teams, and gameweeks."""
        if self._bootstrap_data is None or force_refresh:
            self._bootstrap_data = self._fetch_with_cache(self.BOOTSTRAP_URL, "bootstrap_static.json")
        return self._bootstrap_data

    def get_fixtures(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Fetch upcoming fixture schedule."""
        if self._fixtures_data is None or force_refresh:
            self._fixtures_data = self._fetch_with_cache(self.FIXTURES_URL, "future_fixtures.json")
        return self._fixtures_data

    def get_teams_map(self) -> Dict[int, str]:
        """Returns mapping from team ID to team short name."""
        data = self.get_bootstrap()
        return {t["id"]: t["name"] for t in data["teams"]}

    def get_positions_map(self) -> Dict[int, Position]:
        """Returns mapping from element_type ID to FPL Position string."""
        return {1: "GKP", 2: "DEF", 3: "MID", 4: "FWD"}

    def search_players(self, query: str, limit: int = 8) -> List[Dict[str, Any]]:
        """Search players by query across web_name, first_name, and second_name."""
        data = self.get_bootstrap()
        teams = self.get_teams_map()
        positions = self.get_positions_map()
        q = query.strip().lower()

        results = []
        for p in data["elements"]:
            full_name = f"{p['first_name']} {p['second_name']}".lower()
            web_name = p["web_name"].lower()

            if q in web_name or q in full_name:
                results.append({
                    "id": p["id"],
                    "web_name": p["web_name"],
                    "full_name": f"{p['first_name']} {p['second_name']}",
                    "team": teams.get(p["team"], "Unknown"),
                    "team_id": p["team"],
                    "position": positions.get(p["element_type"], "MID"),
                    "price": round(float(p.get("now_cost") or 0) / 10.0, 1),
                    "minutes": p["minutes"],
                    "goals": p["goals_scored"],
                    "assists": p["assists"],
                    "xG90": float(p.get("expected_goals_per_90") or 0.0),
                    "xA90": float(p.get("expected_assists_per_90") or 0.0),
                    "xGC90": float(p.get("expected_goals_conceded_per_90") or 1.2),
                    "penalties_order": p.get("penalties_order"),
                    "chance_playing": p.get("chance_of_playing_next_round"),
                    "raw": p
                })


        # Sort by minutes played descending so starters show first
        results.sort(key=lambda x: x["minutes"], reverse=True)
        return results[:limit]

    def get_player_by_id(self, player_id: int) -> Optional[Dict[str, Any]]:
        """Look up raw player element by FPL ID."""
        data = self.get_bootstrap()
        for p in data["elements"]:
            if p["id"] == player_id:
                return p
        return None

    def get_team_ratings(self) -> Dict[str, Any]:
        """
        Calculate relative attacking and defensive ratings for all 20 Premier League teams.
        Returns team stats, defense ratios vs league average, and attack ratios vs league average.
        """
        data = self.get_bootstrap()
        teams = self.get_teams_map()
        
        team_ratings = {}
        for t_id, t_name in teams.items():
            # Defense: xGC per 90 from starting goalkeepers/defenders
            gkps = [p for p in data["elements"] if p["team"] == t_id and p["element_type"] == 1 and p["minutes"] > 0]
            xgc90 = float(max(gkps, key=lambda x: x["minutes"])["expected_goals_conceded_per_90"]) if gkps else 1.45

            # Attack: team xG per 90
            team_elements = [p for p in data["elements"] if p["team"] == t_id]
            total_xg = sum(float(p.get("expected_goals") or 0) for p in team_elements)
            total_mins = sum(p["minutes"] for p in team_elements)
            xg90 = (total_xg / max(1.0, total_mins / 10.0)) * 90 if total_mins > 0 else 1.35

            team_ratings[t_id] = {
                "name": t_name,
                "xGC90": round(xgc90, 2),
                "xG90": round(xg90, 2)
            }

        avg_xgc = sum(r["xGC90"] for r in team_ratings.values()) / max(1, len(team_ratings))
        avg_xg = sum(r["xG90"] for r in team_ratings.values()) / max(1, len(team_ratings))

        for t_id, r in team_ratings.items():
            # Leaky defense has ratio > 1.0; tough defense has ratio < 1.0
            r["def_ratio"] = round(r["xGC90"] / avg_xgc, 2)
            r["att_ratio"] = round(r["xG90"] / avg_xg, 2)

        return {
            "teams": team_ratings,
            "avg_xgc": round(avg_xgc, 2),
            "avg_xg": round(avg_xg, 2)
        }

    def get_upcoming_fixtures(self, team_id: int, count: int = 1) -> List[Dict[str, Any]]:
        """Finds the next 'count' scheduled upcoming fixtures for a team."""
        fixtures = self.get_fixtures()
        teams = self.get_teams_map()
        team_fixtures = []

        for f in fixtures:
            if f["team_h"] == team_id:
                opp_id = f["team_a"]
                opp_name = teams.get(opp_id, "Opponent")
                team_fixtures.append({
                    "event": f.get("event"),
                    "opponent_id": opp_id,
                    "opponent_name": opp_name,
                    "is_home": True,
                    "fdr": f.get("team_h_difficulty", 3),
                    "display": f"{opp_name} (H)"
                })
            elif f["team_a"] == team_id:
                opp_id = f["team_h"]
                opp_name = teams.get(opp_id, "Opponent")
                team_fixtures.append({
                    "event": f.get("event"),
                    "opponent_id": opp_id,
                    "opponent_name": opp_name,
                    "is_home": False,
                    "fdr": f.get("team_a_difficulty", 3),
                    "display": f"{opp_name} (A)"
                })
            if len(team_fixtures) >= count:
                break

        if not team_fixtures:
            team_fixtures.append({
                "event": None,
                "opponent_id": 0,
                "opponent_name": "Average Opponent",
                "is_home": True,
                "fdr": 3,
                "display": "Average Opponent (H)"
            })
        return team_fixtures

    def get_next_fixture_details(self, team_id: int) -> Dict[str, Any]:
        """Finds next opponent, venue, and FDR rating for a given team."""
        return self.get_upcoming_fixtures(team_id, count=1)[0]


    def find_team_by_name(self, name_query: str) -> Optional[int]:
        """Look up team ID by partial or full name."""
        teams = self.get_teams_map()
        q = name_query.strip().lower()
        for t_id, t_name in teams.items():
            if q in t_name.lower():
                return t_id
        return None

    def build_player_profile(
        self,
        player_data: Dict[str, Any],
        opponent_team_name: Optional[str] = None,
        is_home_override: Optional[bool] = None
    ) -> PlayerProfile:
        """
        Converts live FPL API element into an opponent-scaled PlayerProfile ready for Monte Carlo.
        Scales attacking stats (npxG, xA) and clean sheet odds based on opponent defense and venue!
        """
        raw = player_data["raw"]
        team_id = raw["team"]
        position = self.get_positions_map().get(raw["element_type"], "MID")
        team_name = self.get_teams_map().get(team_id, "Team")
        
        # 1. Determine Opponent & Venue
        ratings_data = self.get_team_ratings()
        team_ratings = ratings_data["teams"]
        
        if opponent_team_name:
            opp_id = self.find_team_by_name(opponent_team_name) or 1
            teams_map = self.get_teams_map()
            opp_name = teams_map.get(opp_id, opponent_team_name)
            is_home = True if is_home_override is None else is_home_override
            venue_str = "H" if is_home else "A"
            fixture_display = f"{opp_name} ({venue_str})"
        else:
            fix = self.get_next_fixture_details(team_id)
            opp_id = fix["opponent_id"]
            opp_name = fix["opponent_name"]
            is_home = fix["is_home"] if is_home_override is None else is_home_override
            fixture_display = fix["display"]

        # 2. Opponent & Venue Adjustment Multipliers
        # If opponent concedes more than average (def_ratio > 1), attacker gets boosted!
        # If opponent is Man City or Arsenal (def_ratio < 0.7), attacker gets scaled down.
        opp_rating = team_ratings.get(opp_id, {"def_ratio": 1.0, "att_ratio": 1.0, "xGC90": 1.45, "xG90": 1.35})
        my_team_rating = team_ratings.get(team_id, {"def_ratio": 1.0, "att_ratio": 1.0, "xGC90": 1.45, "xG90": 1.35})

        # Bounded between 0.45 and 1.65 to prevent extreme low-sample distortion
        opp_def_ratio = max(0.45, min(1.65, opp_rating.get("def_ratio", 1.0)))
        opp_att_ratio = max(0.45, min(1.65, opp_rating.get("att_ratio", 1.0)))

        # Home teams historically score ~10% more and concede ~10% less
        venue_att_mult = 1.08 if is_home else 0.92
        venue_def_mult = 0.90 if is_home else 1.10

        attack_multiplier = opp_def_ratio * venue_att_mult

        # 3. Minutes and Rotation estimation (Granular playing-time tiers)
        total_minutes = raw["minutes"]
        status = raw.get("status", "a")
        chance_playing = raw.get("chance_of_playing_next_round")

        if status in ["u", "i", "s"]:
            start_prob = 0.0
            sub_on_prob = 0.0
            expected_start_mins = 0.0
            sub_mins_avg = 0.0
        elif chance_playing is not None:
            # Official FPL flag (e.g., 75%, 50%, 25%, 0%)
            flag_prob = chance_playing / 100.0
            if total_minutes >= 180:
                start_prob = round(flag_prob * 0.92, 2)
            elif total_minutes >= 60:
                start_prob = round(flag_prob * 0.60, 2)
            elif total_minutes >= 15:
                start_prob = round(flag_prob * 0.20, 2)
            else:
                start_prob = round(flag_prob * 0.05, 2)
            
            sub_on_prob = round(max(0.0, (1.0 - start_prob) * (0.60 if total_minutes >= 60 else 0.25) * flag_prob), 2)
            expected_start_mins = 82.0 if total_minutes >= 180 else (72.0 if total_minutes >= 60 else 60.0)
            sub_mins_avg = 20.0 if total_minutes >= 60 else 12.0
        else:
            # Unflagged player: estimate from actual season minutes
            if total_minutes >= 270:
                start_prob = 0.92
                expected_start_mins = 84.0
                sub_on_prob = 0.05
                sub_mins_avg = 15.0
            elif total_minutes >= 180:
                start_prob = 0.82
                expected_start_mins = 80.0
                sub_on_prob = 0.12
                sub_mins_avg = 18.0
            elif total_minutes >= 60:
                start_prob = 0.50
                expected_start_mins = 70.0
                sub_on_prob = 0.35
                sub_mins_avg = 20.0
            elif total_minutes >= 15:
                start_prob = 0.20
                expected_start_mins = 65.0
                sub_on_prob = 0.40
                sub_mins_avg = 18.0
            elif total_minutes > 0:
                # Late substitute / fringe cameos (1 - 14 minutes)
                start_prob = 0.05
                expected_start_mins = 60.0
                sub_on_prob = 0.25
                sub_mins_avg = 12.0
            else:
                # 0 minutes played all season
                start_prob = 0.02
                expected_start_mins = 60.0
                sub_on_prob = 0.10
                sub_mins_avg = 10.0

        # 4. Attacking Rates (Bayesian regression for low sample sizes + Opponent Defense & Venue scaling)
        raw_xg90 = float(raw.get("expected_goals_per_90") or 0.0)
        raw_xa90 = float(raw.get("expected_assists_per_90") or 0.0)

        # Regress low-minute samples (< 360 mins) towards position baseline priors
        pos_baseline_xg = {"FWD": 0.35, "MID": 0.15, "DEF": 0.05, "GKP": 0.00}.get(position, 0.15)
        pos_baseline_xa = {"FWD": 0.15, "MID": 0.15, "DEF": 0.08, "GKP": 0.00}.get(position, 0.12)
        att_sample_mins = 360.0
        att_weight = min(1.0, max(0.0, total_minutes / att_sample_mins))
        
        regressed_xg90 = (raw_xg90 * att_weight) + (pos_baseline_xg * (1.0 - att_weight))
        regressed_xa90 = (raw_xa90 * att_weight) + (pos_baseline_xa * (1.0 - att_weight))

        pen_order = raw.get("penalties_order")
        is_pen_taker = (pen_order == 1)

        # Separate non-penalty xG from raw xG
        if is_pen_taker and regressed_xg90 > 0.15:
            base_npxg90 = max(0.05, regressed_xg90 - 0.10)
        else:
            base_npxg90 = regressed_xg90

        # Apply opponent defense and venue scaling!
        scaled_npxg90 = round(max(0.01, base_npxg90 * attack_multiplier), 2)
        scaled_xa90 = round(max(0.01, regressed_xa90 * attack_multiplier), 2)

        # 5. Defensive Clean Sheet & Goals Conceded (Scaled by Opponent Attack)
        base_team_xgc = my_team_rating.get("xGC90", 1.20)
        match_team_xgc = round(max(0.3, base_team_xgc * opp_att_ratio * venue_def_mult), 2)
        
        # Poisson probability of 0 conceded = exp(-match_team_xgc)
        clean_sheet_prob = round(float(2.71828 ** (-match_team_xgc)), 2)

        # 6. Current FPL Price (£m)
        price_m = round(float(raw.get("now_cost") or 0) / 10.0, 1)

        # 7. Goalkeeper Saves per 90 (scaled by opponent attacking strength)
        raw_saves = float(raw.get("saves_per_90") or 3.0)
        saves_p90 = round(raw_saves * opp_att_ratio, 2) if position == "GKP" else 0.0

        # 8. Defensive Contribution actions per 90 (CBIT / CBIRT)
        # Regress low-minute samples (< 450 mins) towards position baseline to avoid small-sample distortion
        raw_def_contrib = float(raw.get("defensive_contribution_per_90") or 0.0)
        if position != "GKP":
            pos_def_baseline = {"DEF": 7.6, "MID": 8.2, "FWD": 4.5}.get(position, 7.6)
            def_sample_mins = 450.0
            def_weight = min(1.0, max(0.0, total_minutes / def_sample_mins))
            regressed_def_contrib = (raw_def_contrib * def_weight) + (pos_def_baseline * (1.0 - def_weight))
            scaled_def_contrib = round(regressed_def_contrib * (0.85 + 0.15 * opp_att_ratio), 2)
        else:
            scaled_def_contrib = 0.0

        return PlayerProfile(
            name=f"{raw['first_name']} {raw['second_name']}",
            position=position,
            team=team_name,
            opponent=fixture_display,
            price=price_m,
            start_prob=start_prob,
            expected_start_mins=expected_start_mins,
            start_mins_std=8.0,
            sub_on_prob=sub_on_prob,
            sub_mins_avg=sub_mins_avg,
            npxG90=scaled_npxg90,
            xA90=scaled_xa90,
            is_pen_taker=is_pen_taker,
            pen_team_rate=round(0.14 * attack_multiplier, 2) if is_pen_taker else 0.0,
            pen_conv_rate=0.82,
            team_clean_sheet_prob=clean_sheet_prob,
            team_xGC=match_team_xgc,
            saves_per_90=saves_p90,
            defensive_contrib_per_90=scaled_def_contrib,
            yellow_card_prob=0.10,
            red_card_prob=0.005
        )



    def build_multi_fixture_profiles(self, player_data: Dict[str, Any], count: int = 1) -> List[PlayerProfile]:
        """Builds a list of PlayerProfile objects for the next 'count' fixtures."""
        team_id = player_data["raw"]["team"]
        upcoming = self.get_upcoming_fixtures(team_id, count=count)
        profiles = []
        for fix in upcoming:
            prof = self.build_player_profile(
                player_data=player_data,
                opponent_team_name=fix["opponent_name"],
                is_home_override=fix["is_home"]
            )
            gw_str = f"GW{fix['event']}: " if fix.get("event") else ""
            prof.opponent = f"{gw_str}{fix['display']} (FDR {fix['fdr']})"
            profiles.append(prof)
        return profiles


if __name__ == "__main__":
    import sys
    query = sys.argv[1] if len(sys.argv) > 1 else "Haaland"
    client = FPLApiClient()
    print(f"Searching for '{query}' in official FPL API...")
    results = client.search_players(query)
    
    if not results:
        print(f"No players found matching '{query}'.")
    else:
        for r in results:
            print(f"• {r['full_name']} ({r['web_name']}) | {r['position']} | {r['team']} | Mins: {r['minutes']} | xG90: {r['xG90']:.2f} | xA90: {r['xA90']:.2f} | Pen Taker: {'Yes' if r['penalties_order'] == 1 else 'No'}")
        
        # Build profile for the top match
        top_profile = client.build_player_profile(results[0])
        print(f"\nGenerated Simulation Profile for Top Result ({top_profile.name}):")
        print(f"  Position       : {top_profile.position}")
        print(f"  Team vs Opp    : {top_profile.team} vs {top_profile.opponent}")
        print(f"  Starting Prob  : {top_profile.start_prob * 100:.0f}%")
        print(f"  npxG90         : {top_profile.npxG90}")
        print(f"  xA90           : {top_profile.xA90}")
        print(f"  Penalty Taker  : {top_profile.is_pen_taker}")
        if top_profile.position != "FWD":
            print(f"  Clean Sheet %  : {top_profile.team_clean_sheet_prob * 100:.0f}%")
