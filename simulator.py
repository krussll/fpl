"""
Monte Carlo Simulation Engine for Fantasy Premier League (FPL).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
import numpy as np
import matplotlib.pyplot as plt

from player import PlayerProfile, ScoringRules


@dataclass
class MatchResult:
    """Detailed outcome of a single simulated match."""
    minutes: int
    goals: int
    assists: int
    penalties_missed: int
    clean_sheet: bool
    goals_conceded: int
    yellow_card: bool
    red_card: bool
    bonus_points: int = 0
    saves: int = 0
    penalty_saves: int = 0
    defensive_actions: int = 0
    defensive_contribution_pts: int = 0
    total_points: int = 0


@dataclass
class SimulationSummary:
    """Aggregated statistics across thousands of simulated matches."""
    player_name: str
    position: str
    n_simulations: int
    points_array: np.ndarray
    player_price: float = 0.0
    points_per_million: float = 0.0
    
    mean_points: float = 0.0
    median_points: float = 0.0
    mode_points: int = 0
    std_dev: float = 0.0
    min_points: int = 0
    max_points: int = 0
    
    # Percentiles
    p10: float = 0.0  # Floor
    p25: float = 0.0
    p50: float = 0.0
    p75: float = 0.0
    p90: float = 0.0  # Ceiling
    p95: float = 0.0
    
    # Probabilities
    zero_points_rate: float = 0.0   # DNP or 0 mins
    blank_rate: float = 0.0         # <= 2 points
    return_rate: float = 0.0        # >= 5 points (at least one attacking return or DEF CS+extra)
    haul_rate: float = 0.0          # >= 10 points (double digit haul)
    mega_haul_rate: float = 0.0     # >= 15 points
    defcon_rate: float = 0.0        # % matches hitting DefCon +2 pts
    
    # Exact point distribution {score: probability}
    distribution: Dict[int, float] = field(default_factory=dict)

    def print_ascii_report(self) -> None:
        """Print a formatted console report with an ASCII histogram."""
        price_tag = f" | £{self.player_price:.1f}m" if self.player_price > 0 else ""
        header = f"=== Monte Carlo FPL Simulation Report: {self.player_name} ({self.position}{price_tag}) ==="
        print("=" * len(header))
        print(header)
        print("=" * len(header))
        print(f"Simulations Run       : {self.n_simulations:,}")
        print(f"Expected Points (Mean): {self.mean_points:.2f} pts")
        if self.player_price > 0:
            print(f"Price & Value         : £{self.player_price:.1f}m  ({self.points_per_million:.2f} xP / £m)")
        print(f"Median Points         : {self.median_points:.1f} pts")
        print(f"Most Likely Score     : {self.mode_points} pts")
        print(f"Volatility (Std Dev)  : ±{self.std_dev:.2f} pts")
        print(f"Range                 : {self.min_points} to {self.max_points} pts")
        print("-" * len(header))
        print("Percentile Projections:")
        print(f"  10th Percentile (Floor)   : {self.p10:.1f} pts")

        print(f"  50th Percentile (Median)  : {self.p50:.1f} pts")
        print(f"  90th Percentile (Ceiling) : {self.p90:.1f} pts")
        print(f"  95th Percentile (Max Run) : {self.p95:.1f} pts")
        print("-" * len(header))
        print("Key FPL Decision Probabilities:")
        print(f"  Blank Rate (<= 2 pts)     : {self.blank_rate * 100:.1f}%")
        print(f"  Return Rate (>= 5 pts)    : {self.return_rate * 100:.1f}%")
        if self.defcon_rate > 0.0:
            print(f"  DefCon Rate (+2 pts)      : {self.defcon_rate * 100:.1f}%  (Defensive contribution)")
        print(f"  Haul Rate (>= 10 pts)     : {self.haul_rate * 100:.1f}%  (Captaincy indicator)")
        print(f"  Mega-Haul (>= 15 pts)     : {self.mega_haul_rate * 100:.1f}%")
        print("-" * len(header))
        print("Point Distribution (ASCII Histogram):")
        
        # Display points up to max observed or 20
        max_score_to_show = min(22, max(self.distribution.keys(), default=10))
        min_score_to_show = min(0, min(self.distribution.keys(), default=0))
        
        for score in range(min_score_to_show, max_score_to_show + 1):
            prob = self.distribution.get(score, 0.0)
            bar_len = int(prob * 100 * 1.5)  # scale bar
            bar = "█" * bar_len
            pct_str = f"{prob * 100:5.1f}%"
            print(f"  {score:2d} pts | {pct_str} | {bar}")
        print("=" * len(header) + "\n")


@dataclass
class MultiFixtureSummary:
    """Aggregated statistics across multiple upcoming fixtures."""
    player_name: str
    position: str
    n_simulations: int
    fixtures_count: int
    fixture_profiles: List[PlayerProfile]
    fixture_summaries: List[SimulationSummary]
    total_points_array: np.ndarray
    price: float = 0.0
    points_per_million: float = 0.0

    mean_total_points: float = 0.0
    median_total_points: float = 0.0
    mode_total_points: int = 0
    std_dev: float = 0.0
    min_points: int = 0
    max_points: int = 0

    p10: float = 0.0
    p25: float = 0.0
    p50: float = 0.0
    p75: float = 0.0
    p90: float = 0.0
    p95: float = 0.0

    distribution: Dict[int, float] = field(default_factory=dict)

    def print_ascii_report(self) -> None:
        """Print a formatted console report with a multi-gameweek ASCII histogram."""
        price_tag = f" | £{self.price:.1f}m" if self.price > 0 else ""
        header = f"=== Multi-Fixture Monte Carlo Report: {self.player_name} ({self.position}{price_tag}) - {self.fixtures_count} Matches ==="
        print("\n" + "=" * len(header))
        print(header)
        print("=" * len(header))
        print(f"Simulations Run          : {self.n_simulations:,}")
        print(f"Total Expected Points    : {self.mean_total_points:.2f} pts  (Avg {self.mean_total_points / max(1, self.fixtures_count):.2f} pts/match)")
        if self.price > 0:
            print(f"Price & Value            : £{self.price:.1f}m  ({self.points_per_million:.2f} Total xP / £m)")
        print(f"Median Total Points      : {self.median_total_points:.1f} pts")
        print(f"Volatility (Std Dev)     : ±{self.std_dev:.2f} pts")
        print(f"Observed Range           : {self.min_points} to {self.max_points} pts")
        print("-" * len(header))

        print("Multi-Gameweek Percentile Projections:")
        print(f"  10th Percentile (Floor)      : {self.p10:.1f} pts")
        print(f"  25th Percentile              : {self.p25:.1f} pts")
        print(f"  50th Percentile (Median)     : {self.p50:.1f} pts")
        print(f"  75th Percentile              : {self.p75:.1f} pts")
        print(f"  90th Percentile (Ceiling)    : {self.p90:.1f} pts")
        print(f"  95th Percentile (Max Run)    : {self.p95:.1f} pts")
        print("-" * len(header))
        print("Fixture-by-Fixture Projections:")
        print(f"  {'Fix':<4} | {'Match / Opponent':<28} | {'xP (Mean)':<10} | {'Floor (P10)':<11} | {'Ceiling (P90)':<13} | {'Haul (≥10)'}")
        print("  " + "-" * 82)
        for idx, (prof, f_sum) in enumerate(zip(self.fixture_profiles, self.fixture_summaries), 1):
            print(f"  #{idx:<3} | {prof.opponent:<28} | {f_sum.mean_points:6.2f} pts | {f_sum.p10:7.1f} pts  | {f_sum.p90:9.1f} pts   | {f_sum.haul_rate*100:6.1f}%")
        print("-" * len(header))
        print("Total Points Distribution (ASCII Histogram):")
        
        # Display bins for multi-gameweek totals
        min_s = int(self.p10) - 2
        max_s = int(self.p90) + 4
        step = max(1, (max_s - min_s) // 25)
        
        for score in range(min_s, max_s + 1, step):
            if step == 1:
                prob = self.distribution.get(score, 0.0)
                label = f"{score:3d} pts"
            else:
                prob = sum(self.distribution.get(s, 0.0) for s in range(score, score + step))
                label = f"{score:2d}-{score+step-1:2d} pts"
            bar_len = int(prob * 100 * 2.2)
            bar = "█" * bar_len
            pct_str = f"{prob * 100:5.1f}%"
            print(f"  {label} | {pct_str} | {bar}")
        print("=" * len(header) + "\n")


class FPLMonteCarloSimulator:

    """
    Simulates thousands of potential gameweek outcomes for a player.
    """
    
    def __init__(self, random_seed: Optional[int] = None):
        if random_seed is not None:
            np.random.seed(random_seed)

    def simulate_single_match(self, player: PlayerProfile) -> MatchResult:
        """
        Simulate a single 90-minute match instance for a player.
        """
        # 1. Simulate playing time (minutes)
        rand_role = np.random.rand()
        if rand_role < player.start_prob:
            # Player starts: normal distribution clipped between 45 and 90
            mins = int(np.clip(
                np.random.normal(player.expected_start_mins, player.start_mins_std),
                45, 90
            ))
        else:
            # Did not start: check if brought on as a substitute
            # Conditional probability of sub given not starting
            sub_cond_prob = player.sub_on_prob / max(1.0 - player.start_prob, 0.001)
            if np.random.rand() < sub_cond_prob:
                mins = int(np.clip(np.random.normal(player.sub_mins_avg, 6), 5, 45))
            else:
                mins = 0

        if mins == 0:
            return MatchResult(
                minutes=0, goals=0, assists=0, penalties_missed=0,
                clean_sheet=False, goals_conceded=0, yellow_card=False,
                red_card=False, bonus_points=0, saves=0, penalty_saves=0, total_points=0
            )


        # 2. Appearance points
        points = ScoringRules.appearance_60_plus if mins >= 60 else ScoringRules.appearance_1_to_59

        # 3. Attacking events (Goals & Assists)
        # Scale rates by playing time fraction
        effective_npxG = player.effective_npxG_for_minutes(mins)
        effective_xA = player.effective_xA_for_minutes(mins)

        # Goals from open play / set pieces (Poisson)
        open_play_goals = np.random.poisson(lam=effective_npxG)
        
        # Penalty kick modeling
        pen_goals = 0
        pen_missed = 0
        if player.is_pen_taker:
            # Probability team gets a penalty while this player is on the pitch
            team_pen_awarded = np.random.rand() < (player.pen_team_rate * (mins / 90.0))
            if team_pen_awarded:
                converted = np.random.rand() < player.pen_conv_rate
                if converted:
                    pen_goals += 1
                else:
                    pen_missed += 1

        total_goals = open_play_goals + pen_goals
        assists = np.random.poisson(lam=effective_xA)

        # Add attacking points
        goal_pts_multiplier = ScoringRules.get_goal_points(player.position)
        points += (total_goals * goal_pts_multiplier)
        points += (assists * ScoringRules.assist)
        points += (pen_missed * ScoringRules.pen_miss)

        # 4. Defensive outcomes (Clean sheets and Goals Conceded)
        clean_sheet = False
        goals_conceded = 0
        
        if mins >= 60:
            # Clean sheet check
            clean_sheet = (np.random.rand() < player.team_clean_sheet_prob)
            if clean_sheet:
                points += ScoringRules.get_clean_sheet_points(player.position)
                goals_conceded = 0
            else:
                # If clean sheet is lost, sample goals conceded (at least 1)
                # We model goals conceded with a Poisson conditioned on >= 1
                # Truncated approximation: 1 + Poisson(lambda = max(0.1, xGC - 0.7))
                extra_gc = np.random.poisson(lam=max(0.2, player.team_xGC - 0.7))
                goals_conceded = 1 + extra_gc
                
                # Deductions for defenders and goalkeepers (-1 per 2 goals conceded)
                if player.position in ["DEF", "GKP"]:
                    points += (goals_conceded // 2) * ScoringRules.conceded_2_goals

        # 5. Goalkeeper Saves & Penalty Saves
        saves = 0
        penalty_saves = 0
        if player.position == "GKP":
            # Saves: +1 point per 3 saves made
            effective_saves = player.saves_per_90 * (mins / 90.0)
            saves = np.random.poisson(lam=max(0.4, effective_saves))
            points += (saves // 3) * ScoringRules.save_3_shots

            # Penalty save chance (~12% chance of pen against team, ~18% saved -> +5 pts)
            team_pen_conceded = np.random.rand() < (0.12 * (mins / 90.0))
            if team_pen_conceded and np.random.rand() < 0.18:
                penalty_saves += 1
                points += ScoringRules.pen_save

        # 6. Defensive Contribution (DefCon) Points
        # DEF: >= 10 clearances, blocks, interceptions, tackles (CBIT) -> +2 pts
        # MID / FWD: >= 12 CBIT + recoveries (CBIRT) -> +2 pts
        # Capped at 2 pts maximum per match
        def_actions = 0
        defcon_pts = 0
        if player.position in ["DEF", "MID", "FWD"] and player.defensive_contrib_per_90 > 0:
            effective_def_rate = player.defensive_contrib_per_90 * (mins / 90.0)
            def_actions = int(np.random.poisson(lam=max(0.1, effective_def_rate)))
            threshold = (
                ScoringRules.def_threshold_cbit
                if player.position == "DEF"
                else ScoringRules.mid_fwd_threshold_cbirt
            )
            if def_actions >= threshold:
                defcon_pts = ScoringRules.defensive_contribution_pts
                points += defcon_pts

        # 7. Discipline (Yellow / Red cards)
        yellow_card = np.random.rand() < (player.yellow_card_prob * (mins / 90.0))
        red_card = False
        if yellow_card:
            points += ScoringRules.yellow_card
        else:
            # Direct red card is only evaluated if no yellow (simplified)
            red_card = np.random.rand() < (player.red_card_prob * (mins / 90.0))
            if red_card:
                points += ScoringRules.red_card

        # 8. Bonus Points System (BPS) Modeling
        bonus = 0
        if penalty_saves >= 1:
            # Penalty save almost always captures maximum 3 bonus points
            bonus = 3
        elif total_goals >= 2:
            bonus = np.random.choice([3, 2], p=[0.75, 0.25])
        elif total_goals == 1 and assists >= 1:
            bonus = np.random.choice([3, 2, 1], p=[0.55, 0.35, 0.10])
        elif total_goals == 1:
            bonus = np.random.choice([3, 2, 1, 0], p=[0.25, 0.25, 0.20, 0.30])
        elif assists >= 1:
            bonus = np.random.choice([2, 1, 0], p=[0.15, 0.25, 0.60])
        elif clean_sheet and player.position == "GKP":
            # Goalkeepers with clean sheet + 3+ saves are prime bonus contenders
            if saves >= 3:
                bonus = np.random.choice([3, 2, 1, 0], p=[0.25, 0.35, 0.25, 0.15])
            else:
                bonus = np.random.choice([2, 1, 0], p=[0.10, 0.25, 0.65])
        elif clean_sheet and player.position == "DEF":
            bonus = np.random.choice([3, 2, 1, 0], p=[0.05, 0.15, 0.20, 0.60])
        elif defcon_pts >= 2 and player.position in ["DEF", "MID"]:
            # High CBIT or recoveries give a strong boost in BPS
            bonus = np.random.choice([3, 2, 1, 0], p=[0.12, 0.22, 0.26, 0.40])

        points += bonus

        return MatchResult(
            minutes=mins,
            goals=total_goals,
            assists=assists,
            penalties_missed=pen_missed,
            clean_sheet=clean_sheet,
            goals_conceded=goals_conceded,
            yellow_card=yellow_card,
            red_card=red_card,
            bonus_points=bonus,
            saves=saves,
            penalty_saves=penalty_saves,
            defensive_actions=def_actions,
            defensive_contribution_pts=defcon_pts,
            total_points=points
        )


    def run(self, player: PlayerProfile, n_simulations: int = 10000) -> SimulationSummary:
        """
        Execute n_simulations iterations and return statistical summary.
        """
        points = np.zeros(n_simulations, dtype=int)
        defcon_hits = 0
        
        for i in range(n_simulations):
            res = self.simulate_single_match(player)
            points[i] = res.total_points
            if res.defensive_contribution_pts > 0:
                defcon_hits += 1

        # Calculate statistics
        mean_val = float(np.mean(points))
        median_val = float(np.median(points))
        vals, counts = np.unique(points, return_counts=True)
        mode_val = int(vals[np.argmax(counts)])
        std_val = float(np.std(points))
        
        # Build probability distribution dict
        dist = {int(val): float(count / n_simulations) for val, count in zip(vals, counts)}
        ppm = round(mean_val / player.price, 2) if player.price > 0 else 0.0
        defcon_rate = float(defcon_hits / n_simulations)
        
        summary = SimulationSummary(
            player_name=player.name,
            position=player.position,
            n_simulations=n_simulations,
            points_array=points,
            player_price=player.price,
            points_per_million=ppm,
            mean_points=mean_val,
            median_points=median_val,
            mode_points=mode_val,
            std_dev=std_val,
            min_points=int(np.min(points)),
            max_points=int(np.max(points)),
            p10=float(np.percentile(points, 10)),
            p25=float(np.percentile(points, 25)),
            p50=float(np.percentile(points, 50)),
            p75=float(np.percentile(points, 75)),
            p90=float(np.percentile(points, 90)),
            p95=float(np.percentile(points, 95)),
            zero_points_rate=float(np.mean(points == 0)),
            blank_rate=float(np.mean(points <= 2)),
            return_rate=float(np.mean(points >= 5)),
            haul_rate=float(np.mean(points >= 10)),
            mega_haul_rate=float(np.mean(points >= 15)),
            defcon_rate=defcon_rate,
            distribution=dist
        )
        return summary

    def plot_comparison(self, summaries: List[SimulationSummary], output_path: str = "simulation_plot.png") -> str:
        """
        Generate a comparative probability distribution chart for multiple players.
        """
        plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
        fig, axes = plt.subplots(len(summaries), 1, figsize=(10, 4 * len(summaries)), sharex=True)
        if len(summaries) == 1:
            axes = [axes]

        colors = ["#38003c", "#00ff85", "#e90052", "#04f5ff"]  # FPL brand palette

        for idx, (summary, ax) in enumerate(zip(summaries, axes)):
            color = colors[idx % len(colors)]
            scores = sorted(summary.distribution.keys())
            probs = [summary.distribution[s] * 100 for s in scores]

            # Color bars by category: Blanks (gray), Regular returns (primary), Hauls (gold/highlight)
            bar_colors = []
            for s in scores:
                if s <= 2:
                    bar_colors.append("#888888")       # Blank
                elif s >= 10:
                    bar_colors.append("#e90052")      # Haul
                else:
                    bar_colors.append(color)          # Solid return

            bars = ax.bar(scores, probs, color=bar_colors, edgecolor="black", alpha=0.85, width=0.8)

            # Draw vertical line for Expected Points (Mean)
            ax.axvline(summary.mean_points, color="#ff0055" if color == "#e90052" else "#d80032", 
                       linestyle="--", linewidth=2, label=f"Mean (xP): {summary.mean_points:.2f}")

            ax.set_title(
                f"{summary.player_name} ({summary.position}) | xP: {summary.mean_points:.2f} | "
                f"Floor (P10): {summary.p10:.0f} | Ceiling (P90): {summary.p90:.0f} | "
                f"Haul Prob (≥10): {summary.haul_rate*100:.1f}%",
                fontsize=11, fontweight="bold", pad=8
            )
            ax.set_ylabel("Probability (%)", fontsize=10)
            ax.set_ylim(0, max(probs) * 1.25)
            ax.legend(loc="upper right", frameon=True)
            ax.grid(axis="y", linestyle=":", alpha=0.6)

        axes[-1].set_xlabel("FPL Gameweek Points", fontsize=11, fontweight="bold")
        plt.xlim(-3, 25)
        plt.tight_layout()
        plt.savefig(output_path, dpi=200)
        plt.close()
        return output_path

    def plot_single_player(self, summary: SimulationSummary, output_path: str = "custom_player_plot.png") -> str:
        """
        Generate an in-depth 2-panel visual analysis for an individual player:
        Panel 1: Probability Distribution Histogram (PMF)
        Panel 2: Cumulative Exceedance Probability Curve P(Points >= X)
        """
        plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))

        # Panel 1: Probability Distribution (Bar Chart)
        scores = sorted(summary.distribution.keys())
        probs = [summary.distribution[s] * 100 for s in scores]

        bar_colors = []
        for s in scores:
            if s <= 2:
                bar_colors.append("#888888")       # Blank (Gray)
            elif s >= 10:
                bar_colors.append("#e90052")      # Double-Digit Haul (Pink/Red)
            else:
                bar_colors.append("#38003c")      # Solid Return (FPL Purple)

        ax1.bar(scores, probs, color=bar_colors, edgecolor="black", alpha=0.85, width=0.8)
        ax1.axvline(summary.mean_points, color="#ff0055", linestyle="--", linewidth=2,
                    label=f"Expected Points (Mean): {summary.mean_points:.2f}")
        ax1.axvline(summary.p10, color="#666666", linestyle=":", linewidth=1.5,
                    label=f"Floor (10th percentile): {summary.p10:.0f} pts")
        ax1.axvline(summary.p90, color="#00aa55", linestyle=":", linewidth=1.5,
                    label=f"Ceiling (90th percentile): {summary.p90:.0f} pts")

        ax1.set_title(
            f"{summary.player_name} ({summary.position}) - Points Probability Distribution ({summary.n_simulations:,} Sims)",
            fontsize=12, fontweight="bold", pad=10
        )
        ax1.set_ylabel("Probability of Exact Score (%)", fontsize=10)
        ax1.set_xlim(min(scores) - 1, max(max(scores) + 1, 20))
        ax1.set_ylim(0, max(probs) * 1.25)
        ax1.legend(loc="upper right", frameon=True)
        ax1.grid(axis="y", linestyle=":", alpha=0.6)

        # Panel 2: Cumulative Exceedance Curve P(Points >= X)
        x_pts = np.arange(min(scores), max(scores) + 1)
        exceedance = [np.mean(summary.points_array >= x) * 100 for x in x_pts]

        ax2.plot(x_pts, exceedance, marker="o", color="#38003c", linewidth=2.5, markersize=5)
        ax2.fill_between(x_pts, exceedance, color="#38003c", alpha=0.15)

        # Reference lines on exceedance
        ax2.axhline(50, color="#888888", linestyle="--", alpha=0.7, label="50% Probability")
        ax2.axvline(10, color="#e90052", linestyle="--", alpha=0.7,
                    label=f"Haul Prob (≥10 pts): {summary.haul_rate*100:.1f}%")

        ax2.set_title("Exceedance Curve: Probability of Scoring AT LEAST 'X' Points", fontsize=11, fontweight="bold", pad=8)
        ax2.set_xlabel("Points Threshold (X)", fontsize=11, fontweight="bold")
        ax2.set_ylabel("Chance of Scoring ≥ X (%)", fontsize=10)
        ax2.set_xlim(min(scores) - 1, max(max(scores) + 1, 20))
        ax2.set_ylim(0, 105)
        ax2.legend(loc="upper right", frameon=True)
        ax2.grid(True, linestyle=":", alpha=0.6)

        plt.tight_layout()
        plt.savefig(output_path, dpi=200)
        plt.close()
        return output_path

    def run_multi_fixtures(self, profiles: List[PlayerProfile], n_simulations: int = 10000) -> MultiFixtureSummary:
        """
        Simulate match sequences across multiple future fixtures.
        For each simulation iteration, generates sequential matches and sums total points.
        """
        k = len(profiles)
        fixture_points = np.zeros((k, n_simulations), dtype=int)
        fixture_summaries = []

        for f_idx, prof in enumerate(profiles):
            pts = np.zeros(n_simulations, dtype=int)
            for i in range(n_simulations):
                pts[i] = self.simulate_single_match(prof).total_points
            fixture_points[f_idx] = pts

            vals, counts = np.unique(pts, return_counts=True)
            dist = {int(v): float(c / n_simulations) for v, c in zip(vals, counts)}
            f_sum = SimulationSummary(
                player_name=prof.name,
                position=prof.position,
                n_simulations=n_simulations,
                points_array=pts,
                mean_points=float(np.mean(pts)),
                median_points=float(np.median(pts)),
                mode_points=int(vals[np.argmax(counts)]),
                std_dev=float(np.std(pts)),
                min_points=int(np.min(pts)),
                max_points=int(np.max(pts)),
                p10=float(np.percentile(pts, 10)),
                p25=float(np.percentile(pts, 25)),
                p50=float(np.percentile(pts, 50)),
                p75=float(np.percentile(pts, 75)),
                p90=float(np.percentile(pts, 90)),
                p95=float(np.percentile(pts, 95)),
                zero_points_rate=float(np.mean(pts == 0)),
                blank_rate=float(np.mean(pts <= 2)),
                return_rate=float(np.mean(pts >= 5)),
                haul_rate=float(np.mean(pts >= 10)),
                mega_haul_rate=float(np.mean(pts >= 15)),
                distribution=dist
            )
            fixture_summaries.append(f_sum)

        total_points = np.sum(fixture_points, axis=0)

        tot_vals, tot_counts = np.unique(total_points, return_counts=True)
        tot_dist = {int(v): float(c / n_simulations) for v, c in zip(tot_vals, tot_counts)}
        mean_tot = float(np.mean(total_points))
        price = profiles[0].price
        ppm = round(mean_tot / price, 2) if price > 0 else 0.0

        return MultiFixtureSummary(
            player_name=profiles[0].name,
            position=profiles[0].position,
            n_simulations=n_simulations,
            fixtures_count=k,
            fixture_profiles=profiles,
            fixture_summaries=fixture_summaries,
            total_points_array=total_points,
            price=price,
            points_per_million=ppm,
            mean_total_points=mean_tot,
            median_total_points=float(np.median(total_points)),
            mode_total_points=int(tot_vals[np.argmax(tot_counts)]),
            std_dev=float(np.std(total_points)),
            min_points=int(np.min(total_points)),
            max_points=int(np.max(total_points)),
            p10=float(np.percentile(total_points, 10)),
            p25=float(np.percentile(total_points, 25)),
            p50=float(np.percentile(total_points, 50)),
            p75=float(np.percentile(total_points, 75)),
            p90=float(np.percentile(total_points, 90)),
            p95=float(np.percentile(total_points, 95)),
            distribution=tot_dist
        )


    def plot_multi_fixture(self, summary: MultiFixtureSummary, output_path: str = "multi_fixture_simulation.png") -> str:
        """
        Generate a 2-panel chart for multi-fixture projection:
        Panel 1: Fixture-by-fixture expected points bar chart with P10-P90 error bars.
        Panel 2: Overall Total Points probability distribution across the multi-match run.
        """
        plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
        fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(11, 9))

        # Panel 1: Fixture-by-fixture breakdown
        labels = [f"#{i+1}: {p.opponent}" for i, p in enumerate(summary.fixture_profiles)]
        means = [s.mean_points for s in summary.fixture_summaries]
        p10s = [s.p10 for s in summary.fixture_summaries]
        p90s = [s.p90 for s in summary.fixture_summaries]
        err_lower = [m - p for m, p in zip(means, p10s)]
        err_upper = [p - m for m, p in zip(means, p90s)]

        bars = ax1.bar(range(len(labels)), means, yerr=[err_lower, err_upper], capsize=5,
                       color="#38003c", edgecolor="black", alpha=0.85, width=0.6)

        for b, m in zip(bars, means):
            ax1.text(b.get_x() + b.get_width() / 2.0, m / 2.0, f"{m:.1f} pts",
                     ha="center", va="center", color="white", fontweight="bold", fontsize=10)

        ax1.set_xticks(range(len(labels)))
        ax1.set_xticklabels(labels, fontsize=10, rotation=10, ha="right")
        ax1.set_ylabel("Expected Points (xP)", fontsize=11, fontweight="bold")
        ax1.set_title(
            f"{summary.player_name} ({summary.position}) - Fixture-by-Fixture Projections ({summary.fixtures_count} Games)",
            fontsize=12, fontweight="bold", pad=10
        )
        ax1.grid(axis="y", linestyle=":", alpha=0.6)

        # Panel 2: Total Points distribution
        tot_scores = sorted(summary.distribution.keys())
        tot_probs = [summary.distribution[s] * 100 for s in tot_scores]

        ax2.bar(tot_scores, tot_probs, color="#04f5ff", edgecolor="#002244", alpha=0.85, width=0.85)
        ax2.axvline(summary.mean_total_points, color="#ff0055", linestyle="--", linewidth=2,
                    label=f"Total Mean: {summary.mean_total_points:.1f} pts")
        ax2.axvline(summary.p10, color="#666666", linestyle=":", linewidth=1.5,
                    label=f"Floor (P10): {summary.p10:.0f} pts")
        ax2.axvline(summary.p90, color="#00aa55", linestyle=":", linewidth=1.5,
                    label=f"Ceiling (P90): {summary.p90:.0f} pts")

        ax2.set_title(
            f"Overall Total Points Distribution over {summary.fixtures_count} Fixtures ({summary.n_simulations:,} Sims)",
            fontsize=12, fontweight="bold", pad=10
        )
        ax2.set_xlabel(f"Total Points Across {summary.fixtures_count} Fixtures", fontsize=11, fontweight="bold")
        ax2.set_ylabel("Probability (%)", fontsize=10)
        ax2.legend(loc="upper right", frameon=True)
        ax2.grid(axis="y", linestyle=":", alpha=0.6)

        plt.tight_layout()
        plt.savefig(output_path, dpi=200)
        plt.close()
        return output_path


