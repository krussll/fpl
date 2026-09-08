# Future Improvements & Modeling Backlog

## 1. Hard Plausibility Clamps on Attacking Rates (npxG90 & xA90)

### Background & Motivation
In Fantasy Premier League, per-90 statistics provided by the official API or raw Opta metrics can experience extreme skew during early season weeks or following small-minute substitute appearances (e.g., a player playing 1 minute and registering a single shot of 0.17 xG ends up with an artificial 15.3 xG90).

While **Empirical Bayesian Regression** (Change 1) shrinks small-sample players towards positional priors ($< 360$ minutes), there may still be cases where players with moderate sample sizes (~300–500 minutes) experience unsustainable short-term finishing or creation hot streaks (e.g., scoring 4 goals from 4 low-xG shots over 3 games).

### Proposed Feature
Introduce hard plausibility ceilings to prevent any player profile from exceeding humanly sustainable limits in professional football:

- **npxG90 Caps**:
  - `FWD`: Maximum **1.15** non-penalty xG per 90 (at or above peak prime Erling Haaland).
  - `MID`: Maximum **0.75** non-penalty xG per 90 (at or above peak Mohamed Salah).
  - `DEF`: Maximum **0.30** non-penalty xG per 90 (at or above peak Gabriel / Trent Alexander-Arnold).
  - `GKP`: Maximum **0.02** non-penalty xG per 90.

- **xA90 Caps**:
  - **0.75** expected assists per 90 across all outfield positions (at or above peak Kevin De Bruyne).

### Implementation Considerations & Trade-Offs
- **Pros**: Guarantees immunity against statistical anomalies, bugged data feeds, or extreme small-to-medium sample heaters distorting captaincy picks and squad optimizers.
- **Cons / Nuances**: Need to be careful not to artificially truncate legitimate generational single-fixture matchups (e.g., Haaland playing Southampton at home in a projected 5-0 blowout where true match xG might exceed 1.2). The cap should ideally apply to the *base* per-90 rate before match-specific opponent multipliers, or act as an absolute outer bound.

---

## 2. Dynamic Injury & Suspension Tracking (Multi-Horizon Availability Engine)

### Background & Motivation
In FPL, player availability changes rapidly due to muscle strains, yellow/red card bans, international duty, and loan rules (ineligible to face parent club). Currently, basic `status` flags (`'i'`, `'s'`, `'u'`, `'d'`) and `chance_of_playing_next_round` are applied uniformly across all simulated fixtures. 

For multi-gameweek projections (e.g., 3-to-5 fixture horizons), this produces distortions:
- A player serving a 1-match yellow-card accumulation suspension is erroneously zeroed out for all 5 gameweeks.
- A player recovering from a 2-week hamstring strain should have 0% in GW1–2, 50% in GW3, and 90% in GW4–5.

### Proposed Feature
Build a dynamic availability resolver that projects match-by-match playing probabilities across multi-fixture horizons:

1. **Suspension Duration Modeling**:
   - **Yellow Card Accumulation (5 yellows)**: 1-match ban $\to$ 0% in next fixture, 100% thereafter.
   - **Straight Red Card**: 3-match domestic ban $\to$ 0% in next 3 fixtures, 100% thereafter.
   - **Professional Last-Man / Denial of Goal Foul**: 1-match ban.
2. **Injury Recovery Curves**:
   - Parse `news` text from FPL API (e.g., *"Expected back 21 Sep"*, *"Knock - 75% chance"*).
   - Apply probabilistic sigmoid return curves across upcoming gameweeks rather than a flat rate.
3. **Loan Restrictions**:
   - Detect if a player is on loan and playing against their parent club, setting availability to 0% strictly for that specific fixture.

---

## 3. Rotation Risk Modeling & Automated Detection

### Background & Motivation
Certain clubs and tactical systems are notorious for rotation risks due to immense squad depth, European football (UEFA Champions League / Europa League), and tactical rotation (e.g., Manchester City attacking midfield/wings with Phil Foden vs. Rayan Cherki / Jérémy Doku / Jack Grealish; Arsenal wingers Gabriel Martinelli vs. Leandro Trossard).

Treating these players with standard ~90% starting rates inflates their expected points, as a benched player who comes on for 15 minutes rarely earns more than 1 point, severely depressing expected value.

### Proposed Feature
Introduce a dedicated **Rotation Risk Factor** that adjusts player profiles:
- Reduces `start_prob` (e.g., from 0.85–0.92 down to 0.55–0.65).
- Increases `sub_on_prob` (e.g., 0.30–0.45) with low average minutes (`sub_mins_avg` $\approx 15\text{–}20$ mins).
- Adjusts `expected_start_mins` downwards (e.g., 65–70 mins instead of 84 mins due to early 60th-minute tactical hooks).

### Automated Detection from Existing Data
Rather than relying solely on manual flags, rotation risk can be automated directly from existing FPL and Opta data:

1. **Intra-Squad Position Clustering & Share of Minutes**:
   - Group all players within each club by primary position/sub-role (e.g., Man City attacking midfielders / inverted wingers).
   - If a single position pool contains 2 or more senior, high-cost players (e.g., price $\ge £6.5\text{m}$) where neither commands $> 75\%$ of available minutes over the season, flag all competing players in that cluster as **High Rotation Risk**.
2. **Minutes Volatility Metric ($\sigma_{\text{mins}}$)**:
   - Calculate the standard deviation and coefficient of variation of minutes played across the past 4–6 gameweeks.
   - Undisputed starters have low variance (e.g., 90, 90, 90, 85, 90; $\sigma < 5$).
   - Rotation-prone players show high variance (e.g., 90, 12, 0, 75, 20; $\sigma > 25$). A threshold $\sigma_{\text{mins}} \ge 20$ automatically triggers a rotation discount.
3. **Sub-Off / Early Hook Frequency**:
   - Compute $\frac{\text{matches substituted off before 70'}}{\text{starts}}$. Managers like Pep Guardiola or Enzo Maresca consistently rotate specific positions around 60–65 minutes.
4. **Midweek European Schedule Density**:
   - Cross-reference upcoming Premier League fixtures with UEFA matchdays (Tuesday/Wednesday/Thursday).
   - Apply a dynamic fatigue/rotation penalty ($10\%\text{–}15\%$ start rate reduction) for deep-squad clubs playing 3 matches within 7 days.

---

## 4. User-Controlled Risk-Adjusted Squad Selector (Sliding Scale)

### Background & Motivation
Different FPL managers operate with fundamentally different strategic objectives depending on their overall rank, mini-league standings, and current gameweek in the season:
- **Rank Defenders / Mini-League Leaders**: Need **low-variance, high-floor template protection** to shield their lead against opponent ownership (Effective Ownership / EO defense).
- **Chasers / Green Arrow Hunters**: Need **high-variance, explosive upside differentials** (low ownership $\le 5\%$, high ceiling P90/P95, high haul probabilities) to make up large point deficits.

### Proposed Feature (Risk Slider: 0% to 100%)
Integrate a user-facing **Risk Tolerance Slider** into the squad builder and optimizer UI:

- **Mathematical Objective Formulation**:
  $$\text{Utility}(p, \lambda) = \text{Mean\_xP}(p) + \lambda_{\text{risk}} \cdot \Delta_{\text{risk}}(p)$$
  Where $\lambda \in [-1.0, +1.0]$ represents the slider position:

  - **Low Risk ($\lambda < 0$, Conservative / Rank Shielding)**:
    - **Rewards**:
      - High Start Probability ($\ge 90\%$).
      - P10 Point Floor (steady appearance + DefCon points).
      - High FPL Ownership % ($\ge 25\%$, template shielding to reduce effective rank drops).
    - **Penalties**: Rotation volatility ($\sigma$), unproven minutes, low ownership.
    - **Target Squad**: Template stalwarts (Haaland, Gabriel, Palmer, Saka, Raya) with minimal rotation exposure.

  - **Balanced ($\lambda = 0.0$, Neutral)**:
    - Maximizes raw Monte Carlo Mean Expected Points ($\text{xP}$) subject to standard budget and team constraints.

  - **High Risk ($\lambda > 0$, Aggressive / Differential Chasing)**:
    - **Rewards**:
      - P90 and P95 Haul Ceilings ($\ge 12\text{–}16\text{ pts}$).
      - High Haul Probability ($\ge 10\text{ pts}$ return rate).
      - Differential Ownership Multiplier ($\text{Own} < 5\%$ or $< 10\%$, rewarding unique rank climb vectors).
    - **Penalties**: High-ownership template players are discounted or penalized to force non-consensus picks.
    - **Target Squad**: High-ceiling explosive differentials (e.g., Barry, Enciso, Rogers, Bogle) with massive upside swings.

---

## 5. Risk-Calibrated Player Alternatives in Player Modal (Price-Point Swaps)

### Background & Motivation
When inspecting a player in the modal (e.g., Cole Palmer at £9.6m or Alexander Isak at £9.1m), managers frequently ask: *"Who else can I buy at this exact price point depending on whether I want to play it safe or take a gamble?"*

### Proposed Feature
Add a dedicated **"Tactical Alternatives (Same Price Bracket)"** section inside the player inspection modal:

- **Filter Scope**: Same position (or complementary role) within $\pm £0.5\text{m}$ of the active player's price tag.
- **Categorized Recommendations**:
  1. **🛡️ Low-Risk Alternative (Safe Template / High Floor)**:
     - Player in the price tier with highest ownership % and highest starting XI security ($\ge 90\%$).
     - Displays: High floor (P10), minimal rotation risk, template rank defense badge.
     - *Example*: Swapping an erratic differential midfielder for a rock-solid 45% owned regular.
  2. **⚖️ Balanced Alternative (Maximum Expected Value / xP)**:
     - Player in the price tier with the highest raw Mean xP and best Points per Million (£m).
     - Displays: Clean median projection and FDR schedule.
  3. **🚀 High-Risk Alternative (Differential / Explosive Upside)**:
     - Low ownership player ($< 5\%$ or $< 10\%$ own) with the highest P90 ceiling and haul rate.
     - Displays: Ceiling upside (+12 pts potential) and differential badge (`🎯 Differential`).

- **Interactive UI Integration**:
  - Direct 1-click **"Compare"** button next to each suggested alternative to open the head-to-head probability graph.
  - Direct 1-click **"Replace in Squad"** button to immediately swap into the user's active 15-player team.
