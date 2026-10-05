"""
Team Sources Registry for FPL Eye-Test Pipeline.
Manages consistent beat newspaper outlets, tactical podcasts, and fan channels for all clubs.
"""

import os
import json
from typing import Dict, List, Optional, Any


class TeamSourcesRegistry:
    """Registry of verified qualitative eye-test sources across all 20 Premier League clubs."""

    DEFAULT_SOURCES_PATH = os.path.join(os.path.dirname(__file__), "team_sources.json")

    def __init__(self, sources_path: Optional[str] = None):
        self.sources_path = sources_path or self.DEFAULT_SOURCES_PATH
        self.data: Dict[str, Any] = self._load()

    def _load(self) -> Dict[str, Any]:
        if os.path.exists(self.sources_path):
            try:
                with open(self.sources_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] Error loading {self.sources_path}: {e}")
        return {"version": "1.0", "teams": []}

    def save(self) -> None:
        """Persists sources to disk."""
        with open(self.sources_path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def get_all_teams(self) -> List[Dict[str, Any]]:
        """Returns all configured team records."""
        return self.data.get("teams", [])

    def get_team(self, team_query: Any) -> Optional[Dict[str, Any]]:
        """Look up team by ID (int) or name/short_name (str)."""
        teams = self.get_all_teams()
        if isinstance(team_query, int):
            for t in teams:
                if t.get("id") == team_query:
                    return t
            return None

        q = str(team_query).strip().lower()
        # Exact match first
        for t in teams:
            if t.get("name", "").lower() == q or t.get("short_name", "").lower() == q:
                return t
        # Substring match
        for t in teams:
            if q in t.get("name", "").lower() or q in t.get("short_name", "").lower():
                return t
        return None

    def get_sources_for_team(self, team_query: Any) -> Dict[str, Any]:
        """Returns beat outlets and fan channels for a specific team."""
        team = self.get_team(team_query)
        if not team:
            return {"team": str(team_query), "beat_outlets": [], "fan_channels": []}
        return {
            "team_id": team.get("id"),
            "team_name": team.get("name"),
            "short_name": team.get("short_name"),
            "beat_outlets": team.get("beat_outlets", []),
            "fan_channels": team.get("fan_channels", [])
        }

    def add_beat_outlet(self, team_query: Any, outlet: Dict[str, Any]) -> bool:
        """Adds a new beat outlet to a team."""
        team = self.get_team(team_query)
        if not team:
            return False
        team.setdefault("beat_outlets", []).append(outlet)
        self.save()
        return True

    def add_fan_channel(self, team_query: Any, channel: Dict[str, Any]) -> bool:
        """Adds a new fan channel to a team."""
        team = self.get_team(team_query)
        if not team:
            return False
        team.setdefault("fan_channels", []).append(channel)
        self.save()
        return True

    def validate_with_fpl(self) -> List[str]:
        """Validates all teams in registry against official FPL bootstrap data."""
        issues = []
        try:
            from fpl_api import FPLApiClient
            client = FPLApiClient()
            fpl_teams = client.get_teams_map()
        except Exception as e:
            return [f"Could not load FPL API teams: {e}"]

        registered_ids = {t["id"]: t["name"] for t in self.get_all_teams()}

        for tid, tname in fpl_teams.items():
            if tid not in registered_ids:
                issues.append(f"FPL Team #{tid} '{tname}' is missing from team_sources.json")
            else:
                team = self.get_team(tid)
                if not team.get("beat_outlets"):
                    issues.append(f"Team #{tid} '{tname}' has no beat outlets configured")
                if not team.get("fan_channels"):
                    issues.append(f"Team #{tid} '{tname}' has no fan channels configured")

        return issues

    def print_team_sources(self, team_query: Any) -> None:
        """Prints a structured summary of sources for a team."""
        team = self.get_team(team_query)
        if not team:
            print(f"[!] Team '{team_query}' not found in registry.")
            return

        print("=" * 65)
        print(f"  Eye-Test Sources for: {team['name']} ({team['short_name']}) [Team #{team['id']}]")
        print("=" * 65)
        print("\n[Beat Newspaper Outlets]")
        for b in team.get("beat_outlets", []):
            journalists = ", ".join(b.get("key_journalists", []))
            print(f"  • {b['name']} ({b['type']})")
            print(f"    URL: {b['url']}")
            if journalists:
                print(f"    Key Reporters: {journalists}")

        print("\n[Independent Fan Channels & Podcasts]")
        for f in team.get("fan_channels", []):
            print(f"  • {f['name']} ({f['type']})")
            print(f"    URL: {f['url']}")
            print(f"    Focus: {f.get('tactical_focus', 'General')}")
        print("=" * 65 + "\n")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="FPL Team Eye-Test Sources Registry")
    parser.add_argument("--list", action="store_true", help="List all 20 Premier League clubs and source counts")
    parser.add_argument("--team", type=str, help="Display sources for a specific team (e.g. Bournemouth, Arsenal)")
    parser.add_argument("--validate", action="store_true", help="Validate coverage against FPL bootstrap teams")
    args = parser.parse_args()

    registry = TeamSourcesRegistry()

    if args.validate:
        issues = registry.validate_with_fpl()
        if issues:
            print("Validation warnings:")
            for issue in issues:
                print(f"  [!] {issue}")
        else:
            print("✓ All 20 Premier League teams have verified beat outlets and fan channels!")

    elif args.team:
        registry.print_team_sources(args.team)

    elif args.list:
        print(f"\n{'ID':<4} | {'Club':<18} | {'Code':<5} | {'Beat Outlets':<14} | {'Fan Channels'}")
        print("-" * 65)
        for t in registry.get_all_teams():
            beats = len(t.get("beat_outlets", []))
            fans = len(t.get("fan_channels", []))
            print(f"{t['id']:<4} | {t['name']:<18} | {t['short_name']:<5} | {beats:<14} | {fans}")
        print("-" * 65)
    else:
        registry.print_team_sources("Bournemouth")
