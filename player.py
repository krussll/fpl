"""
Player Profile and Position Scoring Rules for FPL Monte Carlo Simulation.
"""

from dataclasses import dataclass
from typing import Literal

Position = Literal["GKP", "DEF", "MID", "FWD"]

@dataclass
class ScoringRules:
    """Official Fantasy Premier League scoring rules based on position."""
    appearance_1_to_59: int = 1
    appearance_60_plus: int = 2
    goal_gkp: int = 6
    goal_def: int = 6
    goal_mid: int = 5
    goal_fwd: int = 4
    assist: int = 3
    clean_sheet_gkp: int = 4
    clean_sheet_def: int = 4
    clean_sheet_mid: int = 1
    clean_sheet_fwd: int = 0
    conceded_2_goals: int = -1  # -1 for every 2 goals conceded (GKP/DEF only)
    yellow_card: int = -1
    red_card: int = -3
    pen_miss: int = -2
    pen_save: int = 5
    save_3_shots: int = 1       # +1 for every 3 saves made by a goalkeeper
    defensive_contribution_pts: int = 2  # +2 pts for hitting defensive action threshold
    def_threshold_cbit: int = 10         # >= 10 CBIT actions for DEF
    mid_fwd_threshold_cbirt: int = 12    # >= 12 CBIRT actions for MID / FWD

    @classmethod
    def get_goal_points(cls, position: Position) -> int:
        if position in ["GKP", "DEF"]:
            return cls.goal_def
        elif position == "MID":
            return cls.goal_mid
        elif position == "FWD":
            return cls.goal_fwd
        return 4

    @classmethod
    def get_clean_sheet_points(cls, position: Position) -> int:
        if position in ["GKP", "DEF"]:
            return cls.clean_sheet_def
        elif position == "MID":
            return cls.clean_sheet_mid
        return 0


@dataclass
class PlayerProfile:
    """
    Underlying statistical parameters for a single player in an upcoming match.
    
    All rates are expressed per 90 minutes (per90) so that minutes played
    stochastically scales the expected count of events.
    """
    name: str
    position: Position
    team: str
    opponent: str
    price: float = 0.0                # Current FPL price in millions (e.g. 15.5 for £15.5m)

    # Playing time modeling
    start_prob: float = 0.88          # Probability player is named in starting XI
    expected_start_mins: float = 78.0 # Mean minutes played when starting
    start_mins_std: float = 10.0      # Standard deviation around starting minutes
    sub_on_prob: float = 0.08         # Probability of coming on as a sub if not starting
    sub_mins_avg: float = 20.0        # Average minutes played if substituted on

    # Attacking metrics (Per 90 minutes)
    npxG90: float = 0.45              # Non-penalty Expected Goals per 90
    xA90: float = 0.25               # Expected Assists per 90
    is_pen_taker: bool = False        # Does this player take penalties?
    pen_team_rate: float = 0.13       # Team's probability of being awarded a penalty in a match
    pen_conv_rate: float = 0.80       # Historical penalty conversion rate (~80%)

    # Defensive metrics
    team_clean_sheet_prob: float = 0.35 # Probability team keeps clean sheet against opponent
    team_xGC: float = 1.15             # Expected goals conceded by team
    saves_per_90: float = 3.0          # Goalkeeper saves per 90 minutes (+1 pt per 3 saves)
    defensive_contrib_per_90: float = 0.0  # Defensive actions/90 (CBIT for DEF, CBIRT for MID/FWD)

    # Discipline metrics
    yellow_card_prob: float = 0.12     # Probability of receiving a yellow card
    red_card_prob: float = 0.01        # Probability of receiving a direct red card

    def effective_npxG_for_minutes(self, minutes: float) -> float:
        """Calculate expected non-penalty goals scaled to actual minutes played."""
        return self.npxG90 * (minutes / 90.0)

    def effective_xA_for_minutes(self, minutes: float) -> float:
        """Calculate expected assists scaled to actual minutes played."""
        return self.xA90 * (minutes / 90.0)
