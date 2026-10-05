"""
Eye Test Module for Fantasy Premier League (FPL).
Ingests qualitative match reviews, beat writer ratings, and fan-channel tactical debriefs,
validates them against official FPL element data, and structures them into standardized
eye-test reports and Bayesian nudges.
"""

import os
import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional, Any

from fpl_api import FPLApiClient


@dataclass
class EyeTestPlayerEvaluation:
    """Individual player performance evaluation from the eye test."""
    element_id: Optional[int]
    name: str
    position: str
    rating: float                       # Rating out of 10 (e.g. 7.0)
    verdict: str                        # Short descriptor, e.g. "Primary Spark", "Isolated", "Box Anchor"
    tactical_role: str                  # Tactical positioning and movement
    observations: List[str]             # Specific bullet-point on-pitch observations
    stats_vs_eye_test_summary: str      # Contextualizing official stats vs eye test reality
    suggested_attack_mult: float = 1.0  # Recommended gentle nudge on npxG90 / xA90 (e.g. 0.90 to 1.10)
    suggested_defense_mult: float = 1.0 # Recommended gentle nudge on team xGC scaling (e.g. 0.90 to 1.10)


@dataclass
class EyeTestMatchReport:
    """Full match eye-test report for a team in a specific gameweek."""
    team_name: str
    opponent_name: str
    gameweek: int
    score: str
    venue: str                          # "Home" or "Away"
    sources: List[Dict[str, str]]       # Name, outlet, URL / format
    overall_tactical_summary: str
    players: Dict[str, EyeTestPlayerEvaluation] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert report to JSON-serializable dictionary."""
        d = asdict(self)
        return d

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "EyeTestMatchReport":
        """Instantiate report from dictionary."""
        players_data = data.get("players", {})
        players = {}
        for k, v in players_data.items():
            if isinstance(v, dict):
                players[k] = EyeTestPlayerEvaluation(**v)
            else:
                players[k] = v

        return cls(
            team_name=data["team_name"],
            opponent_name=data["opponent_name"],
            gameweek=data["gameweek"],
            score=data["score"],
            venue=data.get("venue", "Home"),
            sources=data.get("sources", []),
            overall_tactical_summary=data.get("overall_tactical_summary", ""),
            players=players
        )


class EyeTestManager:
    """Manages eye-test cache files, parsing, validation, and retrieval."""

    def __init__(self, cache_dir: str = ".fpl_cache", fpl_client: Optional[FPLApiClient] = None):
        self.cache_dir = cache_dir
        self.fpl_client = fpl_client or FPLApiClient(cache_dir=cache_dir)
        self._cached_reports: Optional[List[EyeTestMatchReport]] = None
        self._id_eval_map: Optional[Dict[int, tuple[EyeTestPlayerEvaluation, EyeTestMatchReport]]] = None
        self._name_eval_map: Optional[Dict[str, tuple[EyeTestPlayerEvaluation, EyeTestMatchReport]]] = None
        os.makedirs(self.cache_dir, exist_ok=True)

    def _get_filename(self, team_name: str, gameweek: int) -> str:
        clean_team = team_name.strip().lower().replace(" ", "_").replace("'", "")
        return f"eye_test_gw{gameweek}_{clean_team}.json"

    def save_report(self, report: EyeTestMatchReport) -> str:
        """Saves validated report to cache directory and invalidates in-memory index."""
        filename = self._get_filename(report.team_name, report.gameweek)
        path = os.path.join(self.cache_dir, filename)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(report.to_dict(), f, indent=2, ensure_ascii=False)
        self._cached_reports = None
        self._id_eval_map = None
        self._name_eval_map = None
        return path

    def load_report(self, team_name: str, gameweek: int) -> Optional[EyeTestMatchReport]:
        """Loads report from cache if exists."""
        filename = self._get_filename(team_name, gameweek)
        path = os.path.join(self.cache_dir, filename)
        if not os.path.exists(path):
            return None
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return EyeTestMatchReport.from_dict(data)
        except Exception:
            return None

    def get_all_reports(self, force_reload: bool = False) -> List[EyeTestMatchReport]:
        """Loads all cached eye-test match reports with in-memory caching."""
        if self._cached_reports is not None and not force_reload:
            return self._cached_reports

        reports = []
        if not os.path.exists(self.cache_dir):
            self._cached_reports = reports
            return reports
        for fname in os.listdir(self.cache_dir):
            if fname.startswith("eye_test_gw") and fname.endswith(".json"):
                fpath = os.path.join(self.cache_dir, fname)
                try:
                    with open(fpath, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    reports.append(EyeTestMatchReport.from_dict(data))
                except Exception:
                    pass
        # Sort reports by gameweek descending
        reports.sort(key=lambda r: r.gameweek, reverse=True)
        self._cached_reports = reports
        return reports

    def _ensure_index(self) -> None:
        if self._id_eval_map is not None:
            return
        self._id_eval_map = {}
        self._name_eval_map = {}
        reports = self.get_all_reports()
        for rep in reports:
            for p_eval in rep.players.values():
                if p_eval.element_id is not None and p_eval.element_id not in self._id_eval_map:
                    self._id_eval_map[p_eval.element_id] = (p_eval, rep)
                if p_eval.name:
                    norm = p_eval.name.lower().strip()
                    if norm not in self._name_eval_map:
                        self._name_eval_map[norm] = (p_eval, rep)

    def get_player_evaluation(
        self,
        player_id: Optional[int] = None,
        player_name: Optional[str] = None
    ) -> Optional[tuple[EyeTestPlayerEvaluation, EyeTestMatchReport]]:
        """
        Finds the most recent eye-test evaluation for a player by element_id or name.
        Uses fast O(1) indexed lookup.
        """
        self._ensure_index()
        if player_id is not None and player_id in self._id_eval_map:
            return self._id_eval_map[player_id]
        if player_name:
            norm_name = player_name.lower().strip()
            if norm_name in self._name_eval_map:
                return self._name_eval_map[norm_name]
            for name_key, val in self._name_eval_map.items():
                if norm_name in name_key or name_key in norm_name:
                    return val
        return None

    def get_all_player_evaluations_map(self) -> Dict[int, Dict[str, Any]]:
        """
        Returns a mapping of element_id -> enriched eye-test data dictionary.
        """
        self._ensure_index()
        result = {}
        for el_id, (p_eval, rep) in self._id_eval_map.items():
            result[el_id] = {
                "rating": p_eval.rating,
                "verdict": p_eval.verdict,
                "tactical_role": p_eval.tactical_role,
                "observations": p_eval.observations,
                "summary": p_eval.stats_vs_eye_test_summary,
                "attack_multiplier": p_eval.suggested_attack_mult,
                "defense_multiplier": p_eval.suggested_defense_mult,
                "gameweek": rep.gameweek,
                "opponent": rep.opponent_name,
                "score": rep.score,
                "venue": rep.venue,
                "sources": rep.sources
            }
        return result

    def validate_report(self, report: EyeTestMatchReport) -> List[str]:
        """
        Validates player names and element IDs against the official FPL bootstrap data.
        Returns a list of warnings or error strings (empty if perfectly valid).
        """
        issues = []
        try:
            bootstrap = self.fpl_client.get_bootstrap()
            elements = {p["id"]: p for p in bootstrap["elements"]}
            teams_map = self.fpl_client.get_teams_map()
        except Exception as e:
            return [f"Unable to load FPL bootstrap data for validation: {e}"]

        # Validate team name
        matching_teams = [t_name for t_name in teams_map.values() if report.team_name.lower() in t_name.lower()]
        if not matching_teams:
            issues.append(f"Team '{report.team_name}' does not match any recognized Premier League club in FPL.")

        # Validate each player
        for key, p_eval in report.players.items():
            # Check rating range
            if not (1.0 <= p_eval.rating <= 10.0):
                issues.append(f"Player '{p_eval.name}' has rating {p_eval.rating} outside standard 1.0-10.0 scale.")

            # Validate element ID if provided
            if p_eval.element_id is not None:
                if p_eval.element_id not in elements:
                    issues.append(f"Player '{p_eval.name}' has invalid element_id: {p_eval.element_id}")
                else:
                    el = elements[p_eval.element_id]
                    el_team = teams_map.get(el["team"], "")
                    if matching_teams and el_team not in matching_teams:
                        issues.append(f"Player '{p_eval.name}' (ID {p_eval.element_id}) is listed with {el_team}, not {report.team_name}.")
            else:
                # Attempt to find element ID by web_name or full name
                found_id = None
                for el in elements.values():
                    full_name = f"{el['first_name']} {el['second_name']}".lower()
                    web_name = el["web_name"].lower()
                    if (p_eval.name.lower() in web_name or p_eval.name.lower() in full_name) and teams_map.get(el["team"], "") in matching_teams:
                        found_id = el["id"]
                        break
                if found_id:
                    p_eval.element_id = found_id
                else:
                    issues.append(f"Player '{p_eval.name}' could not be matched to an active FPL element ID for {report.team_name}.")

        return issues

    def print_ascii_summary(self, report: EyeTestMatchReport) -> None:
        """Prints a human-readable, structured breakdown of the eye test report."""
        header = f"=== Eye-Test Match Debrief: {report.team_name} vs {report.opponent_name} (GW{report.gameweek}) ==="
        print("=" * len(header))
        print(header)
        print("=" * len(header))
        print(f"Result  : {report.team_name} {report.score} ({report.venue})")
        print("Sources :")
        for s in report.sources:
            print(f"  • {s.get('name')} [{s.get('type')}] ({s.get('url', 'N/A')})")
        print("-" * len(header))
        print(f"Tactical Overview:\n{report.overall_tactical_summary}")
        print("-" * len(header))
        print(f"{'Player':<18} | {'Pos':<4} | {'Rating':<6} | {'Verdict':<20} | {'Suggested Att / Def Multipliers'}")
        print("-" * len(header))

        for p in report.players.values():
            mults = f"Att: {p.suggested_attack_mult:.2f}x | Def: {p.suggested_defense_mult:.2f}x"
            print(f"{p.name:<18} | {p.position:<4} | {p.rating:<4.1f}/10 | {p.verdict:<20} | {mults}")
            print(f"   ↳ Role: {p.tactical_role}")
            print(f"   ↳ Insight: {p.stats_vs_eye_test_summary}")
        print("=" * len(header))


def create_bournemouth_gw5_sample() -> EyeTestMatchReport:
    """Generates the validated GW5 AFC Bournemouth eye-test report."""
    sources = [
        {
            "name": "Bournemouth Daily Echo Player Ratings",
            "type": "Local Beat Newspaper",
            "author": "Tom Crocker",
            "url": "https://www.bournemouthecho.co.uk/sport/cherries/"
        },
        {
            "name": "Back of the Net - The AFC Bournemouth Fan Channel",
            "type": "Fan Channel & Tactical Debrief",
            "episode": "Episode 419 & 3 Things To Learn (Bournemouth 0-1 Liverpool)",
            "url": "https://www.youtube.com/@afcbpodcast"
        }
    ]

    overview = (
        "Bournemouth maintained a remarkably disciplined central defensive structure at the Vitality Stadium, "
        "restricting Liverpool's open-play chances through high defensive contributions from center-backs Silva and Hill. "
        "However, Truffert was pinned deep by wide pressure, eliminating wing-back overlaps. "
        "In attack, Evanilson fought tirelessly as a lone pressing striker but was starved of box service. "
        "Alex Scott provided the main transitional thrust, while Rayan flashed dangerous 1v1 threat on the flank."
    )

    players = {
        "Hill": EyeTestPlayerEvaluation(
            element_id=60,
            name="James Hill",
            position="DEF",
            rating=7.0,
            verdict="Box Defending Anchor",
            tactical_role="Right-sided center-back; held off central runners and dominated aerial clearances.",
            observations=[
                "Recorded 15 defensive contributions in engine",
                "Dominated aerial box entries against crosses",
                "Positionally sound against second-phase runners"
            ],
            stats_vs_eye_test_summary="Data (4 pts, 15 def actions) perfectly mirrors eye-test dominance.",
            suggested_attack_mult=1.0,
            suggested_defense_mult=0.95
        ),
        "Silva": EyeTestPlayerEvaluation(
            element_id=566,
            name="António Silva",
            position="DEF",
            rating=7.0,
            verdict="Aggressive Stopper",
            tactical_role="Left-sided center-back; stepped forward into midfield duels, broke up counter-attacks.",
            observations=[
                "Stepped up aggressively to halt central transitions",
                "Committed a tactical foul leading to yellow card",
                "15 defensive contributions, matched Hill's output"
            ],
            stats_vs_eye_test_summary="High volume of interventions; disciplinary risk slightly elevated by aggressive pressing.",
            suggested_attack_mult=1.0,
            suggested_defense_mult=0.95
        ),
        "Petrovic": EyeTestPlayerEvaluation(
            element_id=57,
            name="Đorđe Petrović",
            position="GKP",
            rating=6.0,
            verdict="Assured Handler",
            tactical_role="Starting goalkeeper; commanded 6-yard box on set pieces, had no chance with winner.",
            observations=[
                "Made 2 standard reaction saves",
                "Good command of high balls under set-piece traffic",
                "Conceded only to a clinical close-range finish"
            ],
            stats_vs_eye_test_summary="Steady display matching clean sheet metrics against elite opposition.",
            suggested_attack_mult=1.0,
            suggested_defense_mult=1.0
        ),
        "Truffert": EyeTestPlayerEvaluation(
            element_id=61,
            name="Adrien Truffert",
            position="DEF",
            rating=5.0,
            verdict="Pinned Deep",
            tactical_role="Left-back forced into a conservative defensive shell due to Liverpool's pace on the flank.",
            observations=[
                "Barely crossed the halfway line in open play",
                "Struggled with 1v1 defensive recoveries out wide",
                "Only managed 7 defensive actions; minimal forward contribution"
            ],
            stats_vs_eye_test_summary="Low offensive metrics (0.02 xG, 0.06 xA) confirmed by visual lack of attacking freedom.",
            suggested_attack_mult=0.90,
            suggested_defense_mult=1.05
        ),
        "Smith": EyeTestPlayerEvaluation(
            element_id=64,
            name="Adam Smith",
            position="DEF",
            rating=6.0,
            verdict="Veteran Workhorse",
            tactical_role="Right-back; disciplined positional holding before fatigue led to substitution (74 mins).",
            observations=[
                "Narrow defensive positioning to assist Hill",
                "Limited overlapping",
                "Replaced on 74 mins to maintain defensive energy"
            ],
            stats_vs_eye_test_summary="Minutes management is standard for his profile against high-intensity opposition.",
            suggested_attack_mult=1.0,
            suggested_defense_mult=1.0
        ),
        "Adams": EyeTestPlayerEvaluation(
            element_id=73,
            name="Tyler Adams",
            position="MID",
            rating=5.0,
            verdict="Defensive Pivot Engine",
            tactical_role="Central midfield destroyer; broke up attacks with 13 defensive actions but minimal forward passing.",
            observations=[
                "Huge work rate closing down half-spaces",
                "Safe, sideways retention rather than progressive passing",
                "Hit 13 def actions, earning DefCon bonus points"
            ],
            stats_vs_eye_test_summary="Excellent fantasy DefCon value (4 pts) despite low real-world creative rating.",
            suggested_attack_mult=0.90,
            suggested_defense_mult=0.95
        ),
        "Scott": EyeTestPlayerEvaluation(
            element_id=69,
            name="Alex Scott",
            position="MID",
            rating=7.0,
            verdict="Primary Transition Spark",
            tactical_role="Box-to-box number 8; chief ball-carrier through midfield transitions.",
            observations=[
                "Consistently carried through Liverpool's counter-press",
                "Drew 3 tactical fouls in advanced positions",
                "High technical composure in tight central areas"
            ],
            stats_vs_eye_test_summary="Eye test reveals much higher attacking potential than raw 0.12 xG suggests; primed for returns in easier fixtures.",
            suggested_attack_mult=1.10,
            suggested_defense_mult=1.0
        ),
        "Tavernier": EyeTestPlayerEvaluation(
            element_id=68,
            name="Marcus Tavernier",
            position="MID",
            rating=6.0,
            verdict="Industrious Presser",
            tactical_role="Wide attacking midfielder; worked hard tracking back, but lacked cut-through in final third.",
            observations=[
                "High pressing commitment; covered Smith well",
                "Created 0.11 xA from set pieces",
                "Substituted at 74' for fresh attacking legs"
            ],
            stats_vs_eye_test_summary="Steady floor from work rate, but low ceiling against elite defensive teams.",
            suggested_attack_mult=1.0,
            suggested_defense_mult=1.0
        ),
        "Christie": EyeTestPlayerEvaluation(
            element_id=75,
            name="Ryan Christie",
            position="MID",
            rating=6.0,
            verdict="Frustrated Finisher",
            tactical_role="Advanced central pressing midfielder; arrived late into the box.",
            observations=[
                "Arrived onto Bournemouth's biggest chance (0.50 xG) but missed target",
                "High energetic pressing throughout 74 minutes",
                "Lacked clinical edge on the day"
            ],
            stats_vs_eye_test_summary="xG of 0.50 reflects real threat; eye test confirms he gets into prime scoring positions.",
            suggested_attack_mult=1.05,
            suggested_defense_mult=1.0
        ),
        "Rayan": EyeTestPlayerEvaluation(
            element_id=67,
            name="Rayan",
            position="MID",
            rating=6.5,
            verdict="Direct Flank Threat",
            tactical_role="Direct right-winger; took on Liverpool's left-back repeatedly in 1v1 situations.",
            observations=[
                "Produced 3 dangerous cutbacks (team-high 0.35 xA)",
                "Forced Liverpool defenders into retreat",
                "Delivered accurate balls that lacked central conversion"
            ],
            stats_vs_eye_test_summary="Eye test strongly validates his underlying 0.35 xA; looked unplayable in isolated 1v1 moments.",
            suggested_attack_mult=1.10,
            suggested_defense_mult=1.0
        ),
        "Evanilson": EyeTestPlayerEvaluation(
            element_id=79,
            name="Evanilson",
            position="FWD",
            rating=6.0,
            verdict="Starved Lone Striker",
            tactical_role="Solitary target striker; pressed tirelessly against center-backs but received almost no service.",
            observations=[
                "Pressed aggressively for 90 minutes without fading",
                "Stuck with back to goal; received only 1 clean touch inside the 18-yard box",
                "Underlying 0.16 xG caused by tactical starvation rather than lack of effort or movement"
            ],
            stats_vs_eye_test_summary="The eye test shows his low output was tactical; when Bournemouth play mid/lower table opposition, his threat will surge.",
            suggested_attack_mult=1.05,
            suggested_defense_mult=1.0
        )
    }

    return EyeTestMatchReport(
        team_name="Bournemouth",
        opponent_name="Liverpool",
        gameweek=5,
        score="0 - 1",
        venue="Home",
        sources=sources,
        overall_tactical_summary=overview,
        players=players
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="FPL Eye-Test Report Manager & Validator")
    parser.add_argument("--generate-sample", action="store_true", help="Generate and save Bournemouth GW5 report")
    parser.add_argument("--team", type=str, default="Bournemouth", help="Team name to inspect/validate")
    parser.add_argument("--gw", type=int, default=5, help="Gameweek number")
    args = parser.parse_args()

    manager = EyeTestManager()

    if args.generate_sample:
        report = create_bournemouth_gw5_sample()
        issues = manager.validate_report(report)
        if issues:
            print("Validation issues detected:")
            for issue in issues:
                print(f"  [WARNING] {issue}")
        else:
            print("✓ Validation passed! All players and IDs verified against FPL bootstrap data.")
        saved_path = manager.save_report(report)
        print(f"✓ Report successfully saved to: {saved_path}")
        manager.print_ascii_summary(report)
    else:
        report = manager.load_report(args.team, args.gw)
        if not report:
            print(f"No eye-test report found for {args.team} GW{args.gw}. Generating sample...")
            report = create_bournemouth_gw5_sample()
            manager.save_report(report)
        issues = manager.validate_report(report)
        if issues:
            print("Validation warnings:")
            for issue in issues:
                print(f"  [WARNING] {issue}")
        manager.print_ascii_summary(report)
