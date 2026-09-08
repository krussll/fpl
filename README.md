# Fantasy Premier League (FPL) Monte Carlo Simulation

A probabilistic engine that simulates thousands of matches for Fantasy Premier League players to generate true point distributions, floor/ceiling metrics, blank probabilities, and captaincy haul projections.

---

## ⚽ Why Monte Carlo for FPL?

Standard FPL analytics often rely on a single **Expected Points ($xP$)** figure:
$$xP = 2\text{ (appearance)} + (4 \times xG) + (3 \times xA) + \dots \approx 6.5 \text{ pts}$$

However, in football, no player ever scores $6.5$ points. Decisions in FPL (such as **Captaincy** or **Starting vs. Benching**) depend on the **shape of the distribution**:
1. **Haul Probability ($P(\text{Points} \ge 10)$)**: Who has the highest upside for the captain's armband?
2. **Floor / Blank Rate ($P(\text{Points} \le 2)$)**: Who is at risk of returning just 1 or 2 points?
3. **Volatility (Standard Deviation)**: Differentiating steady point accumulators from high-variance "boom-or-bust" differentials.

---

## 🧠 Statistical Foundations & Distributions Used

| Event | Distribution | Mathematical Rationale |
| :--- | :--- | :--- |
| **Minutes Played** | **Clipped Normal + Categorical** | Players have distinct roles: Starter ($\sim 60-90$ mins), Substitute cameo ($\sim 10-30$ mins), or Unused Bench ($0$ mins). |
| **Goals** | **Poisson ($\lambda = xG_{90} \times \frac{\text{mins}}{90}$)** | Goals are rare, count-based events occurring independently in continuous time. |
| **Assists** | **Poisson ($\lambda = xA_{90} \times \frac{\text{mins}}{90}$)** | Same as goals; discrete events with a rate parameter scaled by minutes. |
| **Clean Sheets** | **Bernoulli ($p = P(\text{CS})$)** | Binary outcome (Yes/No), conditioned on playing $\ge 60$ minutes. |
| **Goals Conceded** | **Truncated Poisson** | Conceded goals affect Defenders and Goalkeepers ($-1$ point per 2 goals conceded). |
| **Goalkeeper Saves** | **Poisson ($\lambda = \text{saves}_{90} \times \frac{\text{mins}}{90}$)** | Goalkeepers earn $+1$ pt per 3 saves made, plus $+5$ pts for penalty saves. |
| **Defensive Contribution (DefCon)** | **Poisson + Threshold Filter** | Outfield players earn $+2$ pts for hitting action thresholds: $\ge 10$ CBIT for DEF, $\ge 12$ CBIRT for MID/FWD. |
| **Penalties** | **Two-stage Bernoulli** | Stage 1: Team awarded penalty while player on pitch. Stage 2: Conversion ($\sim 80\%$). |
| **Bonus (BPS)** | **Conditional Multinomial** | Bonus points are correlated with attacking returns, clean sheets, saves, and DefCon actions. |

---

## 🚀 Getting Started

### 1. Installation

The simulation engine uses `numpy` and `matplotlib`:

```bash
cd fpl-monte-carlo
python3 -m pip install numpy matplotlib
```

### 2. Live FPL API Mode (Opta Data) ⚡

You can fetch live, official Opta stats ($xG_{90}$, $xA_{90}$, minutes, upcoming opponent, and penalty hierarchy) for **any player in the Premier League** with zero manual entry:

```bash
# 1. Single upcoming fixture (default):
python3 run_simulation.py --fpl "Haaland"
python3 run_simulation.py --fpl "Saka"

# 2. Multi-Fixture Horizon (e.g. next 3 or 5 fixtures):
python3 run_simulation.py --fpl "Saka" --fixtures 5
python3 run_simulation.py --fpl "Haaland" --fixtures 3

# 3. Simulate a "What-If" fixture against a specific opponent:
python3 run_simulation.py --fpl "Saka" --vs "Sunderland"
python3 run_simulation.py --fpl "Saka" --vs "Man City"
```

The script automatically:
* Pulls live $xG_{90}$ and $xA_{90}$ from the official FPL API.
* **Multi-Gameweek Monte Carlo**: Simulates match sequences over $K$ fixtures, summing points per iteration to give total points distributions, cumulative floors/ceilings, and match-by-match breakdowns.
* **Calculates Opponent Defensive & Attacking Ratios**: Scales the player's underlying goal and assist threat based on how leaky or stubborn the opponent's defense is compared to the league average.
* **Applies Home/Away Venue Weighting**: Factors in home advantage ($\sim +8\%$ attack, $+10\%$ clean sheet equity) vs away penalty.

* **Current Player Price & Value**: Extracts live `now_cost` (£m) and calculates **Value for Money ($xP$ per £m)** to compare budget enablers against premium assets.
* Identifies their upcoming match opponent and Home/Away venue.
* Checks if they are the primary penalty taker (`penalties_order == 1`).
* Estimates clean sheet probabilities based on team defensive performance vs opponent attack.
* Caches API responses locally in `.fpl_cache/` so subsequent runs are instant.



### 3. Interactive Web Dashboard & Squad Explorer 🌐

Launch the interactive web application to search, filter, compare players, and plan your 15-man squad:

```bash
python3 app.py
```

Then open **[http://localhost:8000](http://localhost:8000)** in your browser!

**Features in the Web App:**
* **Searchable & Sortable Table**: Filter all ~650 Premier League players by position, budget cap, club, or search query.
* **Monte Carlo Distributions on Demand**: Click any player row to launch an instant 10,000-iteration simulation with interactive SVG probability charts, floor (P10), median (P50), and ceiling (P90) markers.
* **FDR Color Badging**: View upcoming opponent difficulty ratings (GW 1, 3, or 5 fixture lookaheads).
* **Head-to-Head Compare**: Compare up to 4 players simultaneously to decide captaincy picks with simulated pairwise win probabilities.
* **15-Man Squad Planner**: Build your squad under the £100.0m budget, check max 3 players per club, and calculate the optimal Starting XI formation and bench order.
* **🤖 Auto-Optimizer**: Uses greedy knapsack and local search swaps to find the highest projected scoring 15-player squad within the £100.0m budget!

### 4. Interactive CLI Wizard

Run the script with no flags to open the interactive terminal menu:

```bash
python3 run_simulation.py
```

Options:
1. **Pull & Simulate Live Player from FPL API**: Type any player's name.
2. **Create Custom Player Manually**: Step-by-step wizard to tweak individual parameters.
3. **Preset Archetypes Comparison**: Haaland vs. Salah vs. Gabriel.
4. **Head-to-Head Captaincy Matchup**: Match-by-match simulation between two players.

### 4. Non-Interactive Custom CLI Mode

```bash
python3 run_simulation.py \
  --name "Cole Palmer" \
  --position MID \
  --team "Chelsea" \
  --opponent "Wolves (H)" \
  --npxg 0.45 \
  --xa 0.35 \
  --pen \
  --cs 0.35 \
  --sims 10000
```


---

## 📁 Project Structure

* [app.py](file:///home/reecewilliams8/fpl-monte-carlo/app.py): FastAPI backend serving interactive web dashboard endpoints for live filtering, simulations, and squad optimization.
* [optimizer.py](file:///home/reecewilliams8/fpl-monte-carlo/optimizer.py): Squad selection engine that solves for the highest-scoring 15-player FPL squad under the £100m budget and ranks starting XI and bench order.
* [player.py](file:///home/reecewilliams8/fpl-monte-carlo/player.py): Player profile dataclass and official FPL scoring rules across all positions (`GKP`, `DEF`, `MID`, `FWD`).
* [simulator.py](file:///home/reecewilliams8/fpl-monte-carlo/simulator.py): Core Monte Carlo engine, match execution loop, statistical metrics, ASCII histogram, and Matplotlib visualizer.
* [fpl_api.py](file:///home/reecewilliams8/fpl-monte-carlo/fpl_api.py): Live FPL API client with local caching, team attack/defense ratings, and multi-fixture horizon profile builder.
* [run_simulation.py](file:///home/reecewilliams8/fpl-monte-carlo/run_simulation.py): CLI runner with preset player profiles (Haaland, Salah, Gabriel) and comparison summary.

---

## 📊 Sample Output Metrics

```text
Player               | xP (Mean)  | Floor (P10) | Ceiling (P90) | Haul (≥10) | Blank (≤2)
--------------------------------------------------------------------------------
Erling Haaland (FWD) |   6.67 pts |     1.0 pts  |      13.0 pts   |   25.2%    |  39.3%
Mohamed Salah (MID)  |   7.60 pts |     2.0 pts  |      16.0 pts   |   33.2%    |  25.7%
Gabriel Magalhães (DEF) |   4.69 pts |     1.0 pts  |       9.0 pts   |    7.8%    |  47.6%
```
