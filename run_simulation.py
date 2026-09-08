"""
Interactive Monte Carlo FPL Simulation Runner.
Supports interactive prompts, custom CLI inputs, preset comparisons, and head-to-head captaincy simulations.
"""

import sys
import argparse
from typing import Optional, List
import numpy as np

from player import PlayerProfile, Position
from simulator import FPLMonteCarloSimulator, SimulationSummary, MultiFixtureSummary
from fpl_api import FPLApiClient


def get_preset_players() -> List[PlayerProfile]:
    """Returns curated player archetypes for simulation demonstration."""
    return [
        PlayerProfile(
            name="Erling Haaland",
            position="FWD",
            team="Man City",
            opponent="Leicester (H)",
            price=15.5,
            start_prob=0.92,
            expected_start_mins=84.0,
            start_mins_std=8.0,
            sub_on_prob=0.05,
            sub_mins_avg=20.0,
            npxG90=0.85,
            xA90=0.15,
            is_pen_taker=True,
            pen_team_rate=0.15,
            pen_conv_rate=0.85,
            team_clean_sheet_prob=0.45,
            team_xGC=0.80,
            yellow_card_prob=0.08,
            red_card_prob=0.005
        ),
        PlayerProfile(
            name="Mohamed Salah",
            position="MID",
            team="Liverpool",
            opponent="Southampton (H)",
            price=12.5,
            start_prob=0.94,
            expected_start_mins=86.0,
            start_mins_std=6.0,
            sub_on_prob=0.04,
            sub_mins_avg=22.0,
            npxG90=0.62,
            xA90=0.38,
            is_pen_taker=True,
            pen_team_rate=0.14,
            pen_conv_rate=0.82,
            team_clean_sheet_prob=0.42,
            team_xGC=0.90,
            yellow_card_prob=0.06,
            red_card_prob=0.002
        ),
        PlayerProfile(
            name="Gabriel Magalhães",
            position="DEF",
            team="Arsenal",
            opponent="Everton (H)",
            price=6.0,
            start_prob=0.96,
            expected_start_mins=90.0,
            start_mins_std=3.0,
            sub_on_prob=0.02,
            sub_mins_avg=15.0,
            npxG90=0.12,  # Set-piece aerial threat
            xA90=0.03,
            is_pen_taker=False,
            pen_team_rate=0.12,
            pen_conv_rate=0.80,
            team_clean_sheet_prob=0.48,
            team_xGC=0.75,

            yellow_card_prob=0.14,
            red_card_prob=0.01
        )
    ]


def prompt_float(prompt_text: str, default_val: float, min_val: float = 0.0, max_val: float = 100.0) -> float:
    """Helper to prompt for a float with defaults and range validation."""
    while True:
        try:
            val_str = input(f"  {prompt_text} [{default_val}]: ").strip()
            if not val_str:
                return default_val
            val = float(val_str)
            if min_val <= val <= max_val:
                return val
            print(f"    (!) Please enter a value between {min_val} and {max_val}.")
        except ValueError:
            print("    (!) Invalid number. Please try again.")


def prompt_bool(prompt_text: str, default_val: bool) -> bool:
    """Helper to prompt for yes/no with default."""
    def_str = "Y/n" if default_val else "y/N"
    while True:
        val_str = input(f"  {prompt_text} ({def_str}): ").strip().lower()
        if not val_str:
            return default_val
        if val_str in ["y", "yes", "true", "1"]:
            return True
        if val_str in ["n", "no", "false", "0"]:
            return False
        print("    (!) Please enter 'y' or 'n'.")


def prompt_position(default_pos: str = "MID") -> Position:
    """Helper to prompt for player position."""
    valid_positions = ["GKP", "DEF", "MID", "FWD"]
    while True:
        pos_str = input(f"  Position (GKP / DEF / MID / FWD) [{default_pos}]: ").strip().upper()
        if not pos_str:
            return default_pos  # type: ignore
        if pos_str in valid_positions:
            return pos_str  # type: ignore
        print(f"    (!) Invalid position. Must be one of: {', '.join(valid_positions)}")


def build_custom_player_interactive() -> PlayerProfile:
    """Guided terminal wizard to configure a custom FPL player."""
    print("\n" + "=" * 60)
    print("        CUSTOM PLAYER MONTE CARLO CONFIGURATOR")
    print("=" * 60)
    print("Enter the player's parameters below (press [Enter] to keep defaults):\n")

    name = input("  Player Name [Cole Palmer]: ").strip() or "Cole Palmer"
    pos = prompt_position("MID")
    team = input("  Player Team [Chelsea]: ").strip() or "Chelsea"
    opp = input("  Opponent [Wolves (H)]: ").strip() or "Wolves (H)"

    print("\n-- Playing Time & Rotation Risk --")
    start_prob = prompt_float("Starting Probability (0.0 to 1.0)", 0.92, 0.0, 1.0)
    exp_mins = prompt_float("Expected Minutes if Starting", 82.0, 45.0, 90.0)

    print("\n-- Attacking Metrics (Per 90 Minutes) --")
    npxg = prompt_float("Non-Penalty xG per 90 (npxG90)", 0.45, 0.0, 2.5)
    xa = prompt_float("Expected Assists per 90 (xA90)", 0.35, 0.0, 2.0)
    is_pen = prompt_bool("Primary Penalty Taker?", True)

    print("\n-- Defensive & Team Context --")
    cs_prob = prompt_float("Team Clean Sheet Probability (0.0 to 1.0)", 0.35, 0.0, 1.0)
    xgc = prompt_float("Team Expected Goals Conceded (xGC)", 1.15, 0.0, 5.0)

    print("-" * 60)

    return PlayerProfile(
        name=name,
        position=pos,
        team=team,
        opponent=opp,
        start_prob=start_prob,
        expected_start_mins=exp_mins,
        start_mins_std=8.0,
        sub_on_prob=round((1.0 - start_prob) * 0.7, 2),
        sub_mins_avg=20.0,
        npxG90=npxg,
        xA90=xa,
        is_pen_taker=is_pen,
        pen_team_rate=0.14 if is_pen else 0.0,
        pen_conv_rate=0.82,
        team_clean_sheet_prob=cs_prob,
        team_xGC=xgc,
        yellow_card_prob=0.10,
        red_card_prob=0.005
    )


def run_head_to_head_comparison(p1: PlayerProfile, p2: PlayerProfile, sims: int, seed: int):
    """Simulates match-by-match head-to-head for captaincy decision."""
    sim = FPLMonteCarloSimulator(random_seed=seed)
    s1 = sim.run(p1, n_simulations=sims)
    s2 = sim.run(p2, n_simulations=sims)

    p1_pts = s1.points_array
    p2_pts = s2.points_array

    p1_wins = np.mean(p1_pts > p2_pts) * 100
    ties = np.mean(p1_pts == p2_pts) * 100
    p2_wins = np.mean(p2_pts > p1_pts) * 100
    net_diff = np.mean(p1_pts - p2_pts)

    print("\n" + "=" * 65)
    print(f"      CAPTAINCY HEAD-TO-HEAD: {p1.name} vs {p2.name}")
    print("=" * 65)
    print(f"Simulations: {sims:,} matches\n")
    print(f"  {p1.name:<22} : Mean xP = {s1.mean_points:.2f} | Haul Rate (≥10) = {s1.haul_rate*100:.1f}%")
    print(f"  {p2.name:<22} : Mean xP = {s2.mean_points:.2f} | Haul Rate (≥10) = {s2.haul_rate*100:.1f}%\n")
    print("-" * 65)
    print(f"  Probability {p1.name} OUTSCORES {p2.name} : {p1_wins:5.1f}%")
    print(f"  Probability of a TIE (Same points)       : {ties:5.1f}%")
    print(f"  Probability {p2.name} OUTSCORES {p1.name} : {p2_wins:5.1f}%")
    print("-" * 65)
    if net_diff > 0:
        print(f"  ⭐ Recommendation: {p1.name} provides +{net_diff:.2f} expected points advantage.")
    elif net_diff < 0:
        print(f"  ⭐ Recommendation: {p2.name} provides +{abs(net_diff):.2f} expected points advantage.")
    else:
        print("  ⭐ Recommendation: Dead heat! Check haul probability for upside.")
    print("=" * 65 + "\n")


def run_live_fpl_flow(
    query: str,
    sims: int,
    seed: int,
    fixtures_count: int = 1,
    opponent_override: Optional[str] = None,
    plot_path: Optional[str] = None
):
    """Search for player in FPL API, build profile from live stats, and simulate."""
    client = FPLApiClient()
    print(f"\n[*] Searching official FPL API for '{query}'...")
    results = client.search_players(query)

    if not results:
        print(f"[!] No players found matching '{query}'. Please check spelling.")
        return

    # Check for exact match first
    exact_matches = [r for r in results if r["web_name"].lower() == query.strip().lower() or r["full_name"].lower() == query.strip().lower()]
    if len(exact_matches) == 1:
        selected_player_data = exact_matches[0]
    elif len(results) > 1:
        print(f"\nFound {len(results)} matches:")
        for idx, r in enumerate(results, 1):
            print(f"  [{idx}] {r['full_name']} ({r['web_name']}) - {r['position']} ({r['team']} | £{r.get('price', 0.0):.1f}m) | Mins: {r['minutes']} | xG90: {r['xG90']:.2f} | xA90: {r['xA90']:.2f}")
        if sys.stdin.isatty():
            try:
                choice = input(f"\nSelect player [1-{len(results)}] (default: 1): ").strip()
                sel_idx = int(choice) - 1 if choice else 0
                if 0 <= sel_idx < len(results):
                    selected_player_data = results[sel_idx]
                else:
                    selected_player_data = results[0]
            except (ValueError, IndexError, EOFError):
                selected_player_data = results[0]
        else:
            selected_player_data = results[0]
    else:
        selected_player_data = results[0]

    simulator = FPLMonteCarloSimulator(random_seed=seed)

    # Multi-fixture mode (fixtures_count > 1)
    if fixtures_count > 1 and not opponent_override:
        profiles = client.build_multi_fixture_profiles(selected_player_data, count=fixtures_count)
        price_tag = f" | £{profiles[0].price:.1f}m" if profiles[0].price > 0 else ""
        print("\n" + "=" * 75)
        print(f"    OFFICIAL FPL {len(profiles)}-FIXTURE SCHEDULE: {profiles[0].name} ({profiles[0].position}{price_tag})")
        print("=" * 75)
        for i, p in enumerate(profiles, 1):
            cs_part = f" | CS%: {p.team_clean_sheet_prob*100:.0f}%" if p.position != "FWD" else ""
            print(f"  Fix #{i}: {p.opponent:<30} | Scaled npxG90: {p.npxG90:.2f} | Scaled xA90: {p.xA90:.2f}{cs_part}")
        print("=" * 75)

        print(f"\n[*] Running {sims:,} Monte Carlo simulations across {len(profiles)} upcoming fixtures...")
        multi_summary = simulator.run_multi_fixtures(profiles, n_simulations=sims)
        multi_summary.print_ascii_report()

        chart_file = plot_path or f"{profiles[0].name.lower().replace(' ', '_')}_{len(profiles)}fixtures_simulation.png"
        simulator.plot_multi_fixture(multi_summary, output_path=chart_file)
        print(f"[✔] Multi-fixture 2-panel chart saved to: {chart_file}\n")
        return

    # Single fixture mode (default or with override)
    profile = client.build_player_profile(selected_player_data, opponent_team_name=opponent_override)
    
    print("\n" + "=" * 60)
    print(f"    OFFICIAL FPL STATS EXTRACTED: {profile.name}")
    print("=" * 60)
    price_str = f" | £{profile.price:.1f}m" if profile.price > 0 else ""
    print(f"  Position & Price: {profile.position}{price_str}")
    print(f"  Club & Fixture : {profile.team} vs {profile.opponent}")
    print(f"  Season Minutes : {selected_player_data['minutes']} mins")
    print(f"  Match npxG90   : {profile.npxG90:.2f}  (Scaled by opponent defense & venue)")
    print(f"  Match xA90     : {profile.xA90:.2f}  (Scaled by opponent defense & venue)")
    print(f"  Penalty Taker  : {'Yes (Priority #1)' if profile.is_pen_taker else 'No'}")
    print(f"  Starting Prob  : {profile.start_prob * 100:.0f}%")
    if profile.position != "FWD":
        print(f"  Clean Sheet %  : {profile.team_clean_sheet_prob * 100:.0f}%")
    if profile.defensive_contrib_per_90 > 0:
        thresh = 10 if profile.position == "DEF" else 12
        actions_name = "CBIT" if profile.position == "DEF" else "CBIRT"
        print(f"  DefCon Rate    : {profile.defensive_contrib_per_90:.1f} {actions_name}/90 (Target: ≥{thresh} for +2 pts)")
    print("=" * 60)


    # Run Monte Carlo
    print(f"\n[*] Running {sims:,} Monte Carlo simulations for {profile.name} vs {profile.opponent}...")
    summary = simulator.run(profile, n_simulations=sims)
    summary.print_ascii_report()

    chart_file = plot_path or f"{profile.name.lower().replace(' ', '_')}_fpl_simulation.png"
    simulator.plot_single_player(summary, output_path=chart_file)
    print(f"[✔] Visual 2-panel chart saved to: {chart_file}\n")


def main():
    parser = argparse.ArgumentParser(description="Monte Carlo Simulation for Fantasy Premier League.")
    parser.add_argument("--interactive", "-i", action="store_true", help="Launch interactive player creation wizard")
    parser.add_argument("--preset", action="store_true", help="Run simulation for preset players (Haaland, Salah, Gabriel)")
    parser.add_argument("--fpl", type=str, help="Search and simulate a player directly from official FPL API (Opta data)")
    parser.add_argument("--fixtures", "-k", type=int, default=1, help="Number of future fixtures to simulate across (default: 1)")
    parser.add_argument("--vs", type=str, default=None, help="Opponent to simulate against (e.g. --vs 'Man City')")
    parser.add_argument("--sims", type=int, default=10000, help="Number of simulated matches (default: 10000)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--plot", type=str, default=None, help="Output image filename for chart")
    
    # Optional CLI arguments for non-interactive custom player
    parser.add_argument("--name", type=str, help="Player Name")
    parser.add_argument("--position", type=str, choices=["GKP", "DEF", "MID", "FWD"], help="Player Position")
    parser.add_argument("--team", type=str, default="Team", help="Player Team")
    parser.add_argument("--opponent", type=str, default="Opponent", help="Match Opponent")
    parser.add_argument("--start-prob", type=float, default=0.90, help="Starting XI probability (0.0 to 1.0)")
    parser.add_argument("--mins", type=float, default=80.0, help="Expected starting minutes")
    parser.add_argument("--npxg", type=float, default=0.40, help="Non-penalty xG per 90")
    parser.add_argument("--xa", type=float, default=0.25, help="Expected assists per 90")
    parser.add_argument("--pen", action="store_true", help="Is primary penalty taker")
    parser.add_argument("--cs", type=float, default=0.35, help="Clean sheet probability (0.0 to 1.0)")
    parser.add_argument("--xgc", type=float, default=1.15, help="Team expected goals conceded")
    
    args = parser.parse_args()

    # Mode 0: Live FPL API lookup
    if args.fpl:
        run_live_fpl_flow(
            args.fpl,
            args.sims,
            args.seed,
            fixtures_count=args.fixtures,
            opponent_override=args.vs,
            plot_path=args.plot
        )
        return

    simulator = FPLMonteCarloSimulator(random_seed=args.seed)

    # Mode 1: CLI arguments provided for a custom player
    if args.name and args.position:
        player = PlayerProfile(
            name=args.name,
            position=args.position,  # type: ignore
            team=args.team,
            opponent=args.opponent,
            start_prob=args.start_prob,
            expected_start_mins=args.mins,
            npxG90=args.npxg,
            xA90=args.xa,
            is_pen_taker=args.pen,
            pen_team_rate=0.14 if args.pen else 0.0,
            team_clean_sheet_prob=args.cs,
            team_xGC=args.xgc
        )
        print(f"\n[*] Running {args.sims:,} simulations for {player.name} ({player.position})...")
        summary = simulator.run(player, n_simulations=args.sims)
        summary.print_ascii_report()
        plot_path = args.plot or f"{player.name.lower().replace(' ', '_')}_simulation.png"
        simulator.plot_single_player(summary, output_path=plot_path)
        print(f"[✔] Detailed 2-panel chart saved to: {plot_path}\n")
        return

    # Mode 2: Preset comparison requested
    if args.preset:
        print(f"\n[*] Running {args.sims:,} simulations across preset players...")
        presets = get_preset_players()
        summaries = [simulator.run(p, n_simulations=args.sims) for p in presets]
        for s in summaries:
            s.print_ascii_report()
        plot_path = args.plot or "fpl_simulation_results.png"
        simulator.plot_comparison(summaries, output_path=plot_path)
        print(f"[✔] Comparative chart saved to: {plot_path}\n")
        return

    # Mode 3: Interactive Menu
    print("\n" + "=" * 60)
    print("      FANTASY PREMIER LEAGUE - MONTE CARLO SIMULATOR")
    print("=" * 60)
    print("Choose an option:")
    print("  [1] Pull & Simulate Live Player from FPL API (Opta Data)")
    print("  [2] Create Custom Player Manually (Interactive Wizard)")
    print("  [3] Run Preset Comparison (Haaland vs Salah vs Gabriel)")
    print("  [4] Head-to-Head Captaincy Matchup")
    
    try:
        choice = input("\nEnter choice [1-4] (default: 1): ").strip() or "1"
    except (EOFError, KeyboardInterrupt):
        choice = "1"

    if choice == "1":
        try:
            player_query = input("Enter player name to search (e.g. Saka, Palmer, Watkins): ").strip() or "Saka"
            k_input = input("Number of upcoming fixtures to simulate [1]: ").strip()
            k_val = int(k_input) if k_input else 1
        except (ValueError, EOFError, KeyboardInterrupt):
            player_query = "Saka"
            k_val = 1
        run_live_fpl_flow(
            player_query,
            args.sims,
            args.seed,
            fixtures_count=k_val,
            opponent_override=args.vs,
            plot_path=args.plot
        )

    elif choice == "2":
        player = build_custom_player_interactive()
        print(f"\n[*] Running {args.sims:,} Monte Carlo simulations for {player.name}...")
        summary = simulator.run(player, n_simulations=args.sims)
        summary.print_ascii_report()
        plot_path = args.plot or f"{player.name.lower().replace(' ', '_')}_simulation.png"
        simulator.plot_single_player(summary, output_path=plot_path)
        print(f"[✔] Detailed 2-panel chart (PMF + Exceedance Curve) saved to: {plot_path}\n")

    elif choice == "3":
        presets = get_preset_players()
        summaries = [simulator.run(p, n_simulations=args.sims) for p in presets]
        for s in summaries:
            s.print_ascii_report()
        plot_path = args.plot or "fpl_simulation_results.png"
        simulator.plot_comparison(summaries, output_path=plot_path)
        print(f"[✔] Comparative chart saved to: {plot_path}\n")

    elif choice == "4":
        presets = get_preset_players()
        print("\nPreset players available: 1) Haaland  2) Salah  3) Gabriel")
        c1 = input("Select Player 1 [1]: ").strip() or "1"
        c2 = input("Select Player 2 [2]: ").strip() or "2"
        idx1 = 0 if c1 == "1" else (1 if c1 == "2" else 2)
        idx2 = 1 if c2 == "2" else (0 if c2 == "1" else 2)
        run_head_to_head_comparison(presets[idx1], presets[idx2], args.sims, args.seed)


if __name__ == "__main__":
    main()


