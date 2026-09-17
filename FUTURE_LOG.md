# Future Improvements & Modeling Backlog

## 1. Hard Plausibility Clamps on Attacking Rates (npxG90 & xA90) — [IMPLEMENTED]

### Status: Complete
Implemented two-tier plausibility bounds in `fpl_api.py` for both base rates and match-scaled rates:
- **Base npxG90 Caps**: FWD: 1.15, MID: 0.65, DEF: 0.25, GKP: 0.02.
- **Base xA90 Caps**: FWD: 0.45, MID: 0.60, DEF: 0.40, GKP: 0.02.
- **Match-Scaled Absolute Outer Bounds**: FWD: 1.30 npxG90 (0.55 xA90), MID: 0.75 npxG90 (0.70 xA90), DEF: 0.35 npxG90 (0.50 xA90), GKP: 0.02.

### Background & Motivation
In Fantasy Premier League, per-90 statistics provided by the official API or raw Opta metrics can experience extreme skew during early season weeks or following small-minute substitute appearances (e.g., a player playing 1 minute and registering a single shot of 0.17 xG ends up with an artificial 15.3 xG90).

While **Empirical Bayesian Regression** (Change 1) shrinks small-sample players towards positional priors ($< 360$ minutes), there may still be cases where players with moderate sample sizes (~300–500 minutes) experience unsustainable short-term finishing or creation hot streaks (e.g., scoring 4 goals from 4 low-xG shots over 3 games).

### Proposed Feature
Introduce hard plausibility ceilings to prevent any player profile from exceeding humanly sustainable limits in professional football:

- **npxG90 Caps**:
  - `FWD`: Maximum **1.15** non-penalty xG per 90 (at or above peak prime Erling Haaland).
  - `MID`: Maximum **0.65** non-penalty xG per 90 (at or above peak Mohamed Salah).
  - `DEF`: Maximum **0.25** non-penalty xG per 90 (at or above peak Gabriel / Trent Alexander-Arnold).
  - `GKP`: Maximum **0.02** non-penalty xG per 90.

- **xA90 Caps**:
  - `FWD`: Maximum **0.45** expected assists per 90.
  - `MID`: Maximum **0.60** expected assists per 90 (at or above peak Kevin De Bruyne).
  - `DEF`: Maximum **0.40** expected assists per 90 (at or above peak Trent Alexander-Arnold).
  - `GKP`: Maximum **0.02** expected assists per 90.

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

---

## 6. Expanded Bayesian Regression Sample Window (Early-Season Outlier Dampening) — [IMPLEMENTED]

### Status: Complete
Implemented in `fpl_api.py`:
- **1,080-Minute Sample Window**: Extended shrinkage window from 360.0 to 1,080.0 minutes (~12 matches), smoothly weighting current form vs proven prior.
- **Historical Multi-Season Blending (Point 3)**: Prior baselines now integrate up to 2 prior Premier League seasons per player (weighted by historical sample size up to 1,800 minutes).
- **Price-Aware Fallback Priors**: Unproven players and new signings without PL history are initialized with price-tiered baselines, ensuring sensible separation between premium assets and budget options.

### Background & Motivation
In early gameweeks (GW1–GW4), raw per-90 metrics can experience extreme small-sample noise. For instance, a player with an explosive 2–3 fixture run can accumulate an unsustainable per-90 rate (e.g., Bryan Mbeumo or Thierno Barry accumulating high xG in small minutes).

Previously, the model's Bayesian regression used a 360-minute sample window (`att_sample_mins = 360.0`) in `fpl_api.py` to shrink players toward their positional baseline. By Gameweek 4, this turned off prior shrinkage completely for regular starters.

### Proposed Feature
1. **Enlarge the Regression Horizon**:
   - Extended `att_sample_mins` from 360 minutes to **1,080 minutes** (~12 matches).
2. **Multi-Season & Price-Aware Bayesian Priors**:
   - Incorporate the player's 2-year historical xG90 and xA90 baselines.
   - Price-tier fallbacks for new signings without historical Premier League minutes.

### Implementation Considerations & Trade-Offs
- **Pros**: Prevents flash-in-the-pan early-season heaters from distorting transfers and captaincy models; stabilizes projections during GW1–8 while respecting proven elite historical performers.
- **Cons / Nuances**: Slightly slower to reward genuine breakout players who have earned a regular starting berth in an improved offensive system, but balances smoothly as minutes accumulate towards 1,080.

---

## 7. Team-Relative Attacking Share Caps (Team-Level xG Constraints)

### Background & Motivation
Player projections currently evaluate an individual's attacking rate (`raw_xg90` adjusted for opponent defense) largely independent of their club's macro-level attacking output. 

For example, Everton's team average is **1.21 xG per 90** (ranking 15th in the league). Modeling an individual forward with **0.88 npxG/90** plus penalty duties effectively assigns them $> 70\%\text{–}85\%$ of the team's entire offensive output in that match. In real-world football, even dominant focal points (e.g., Erling Haaland at Man City or Dominic Solanke at Bournemouth) typically account for 35% to 50% of their club's expected goals over a sustained campaign.

### Proposed Feature
Introduce a macro-to-micro constraint that couples individual attacking expectancy to their team's realistic attacking capacity:

1. **Team Match Expected Goals Anchor**:
   $$\text{Team\_Match\_xG} = \text{Team\_Base\_xG90} \times \text{Opponent\_Def\_Ratio} \times \text{Venue\_Mult}$$
2. **Maximum Plausible Attacking Share ($\alpha_{\max}$)**:
   - Cap the maximum share of open-play team xG that a single player can command:
     - `FWD` (Primary striker): Maximum **48%** of team open-play xG.
     - `MID` (Talisman / Winger): Maximum **40%** of team open-play xG.
     - `DEF` (Set-piece threat): Maximum **18%** of team open-play xG.
3. **Clamping Equation**:
   $$\text{Player\_npxG90} \le \alpha_{\max} \times \text{Team\_Match\_xG}$$
4. **Independent Penalty Handling**:
   - Penalty expected goals are calculated separately on top of open-play share, ensuring penalty takers are credited without artificially inflating open-play shot volume.

### Implementation Considerations & Trade-Offs
- **Pros**: Grounds individual projections in team-level offensive reality; naturally discounts attackers playing for low-scoring sides while boosting assets in free-scoring attacks.
- **Cons / Nuances**: Requires maintaining team-level attacking baselines and carefully separating open-play xG from set-piece/penalty opportunities.

---

## 8. Bayesian Prior Shrinkage for Promoted & Early-Season Team Defenses

### Background & Motivation
In early gameweeks (GW1–GW4), team-level offensive and defensive ratings are computed in `fpl_api.py` (`get_team_ratings()`) directly from the primary starting goalkeeper's live minutes and expected goals conceded (`expected_goals_conceded_per_90`).

Without prior shrinkage, small-sample variance creates extreme macro distortions:
- **Hull City Example**: Hull kept 3 consecutive clean sheets in GW1–3 while conceding 5.05 expected goals. Because their starting goalkeeper (Tzolakis) recorded a 1.68 xGC90 against a league average of 1.50, the model assigned Hull a `def_ratio` of **1.12** (only 12% leakier than average). In reality, newly promoted Premier League sides typically concede **1.85–2.25 xGC90** (30%–50% leakier than average) across a full campaign.
- **Sunderland & Leeds**: Sunderland's early 1.32 xGC90 placed them as the **6th-best defense** in the entire Premier League, ahead of Liverpool (1.54) and Chelsea (1.73). Leeds (1.51 xGC90) ranked 8th.

This lack of shrinkage causes the simulation engine to generate overly optimistic clean sheet probabilities (e.g., giving Hull a 31% clean sheet chance away at Newcastle and 28% at home to Everton).

### Proposed Feature
Implement an **Empirical Bayesian Prior** for team defensive strength:

$$\text{Regressed\_Team\_xGC90} = w_{\text{sample}} \cdot \text{Raw\_xGC90} + (1 - w_{\text{sample}}) \cdot \text{Prior\_xGC90}$$

Where the sample weight scales over the first quarter of the season:
$$w_{\text{sample}} = \min\left(1.0, \frac{\text{Matches Played}}{M_{\text{threshold}}}\right), \quad M_{\text{threshold}} \approx 8\text{–}10 \text{ matches}$$

- **Tier-Specific Team Priors**:
  - **Promoted / Newly Added Clubs** (Hull, Sunderland, Leeds, Coventry): Prior baseline = **1.95–2.10 xGC90** (`def_ratio` $\approx 1.30\text{–}1.40$).
  - **Established Mid-Table Clubs** (Everton, Fulham, Bournemouth): Prior baseline = **1.45–1.55 xGC90** (`def_ratio` $\approx 0.95\text{–}1.05$).
  - **Elite Defenses** (Arsenal, Man City): Prior baseline = **0.90–1.05 xGC90** (`def_ratio` $\approx 0.60\text{–}0.70$).

### Implementation Considerations & Trade-Offs
- **Pros**: Immediately stabilizes team defensive ratings and fixture difficulty multipliers during GW1–8; prevents the squad optimizer from stacking promoted defenders away at top-6 attacks based on small-sample clean sheet flukes.
- **Cons / Nuances**: Requires tagging newly promoted sides or initializing pre-season baseline ratings.

---

## 9. DefCon Eligibility Gate & Blowout Loss Decoupling

### Background & Motivation
In `simulator.py` (lines 302–318), outfield players receive **+2 bonus points** whenever simulated clearances, blocks, interceptions, and tackles (CBIT) reach $\ge 10$ actions for defenders. Furthermore, lines 352–355 award an additional **60% probability of 1–3 BPS bonus points** whenever `defcon_pts >= 2`.

Currently, this bonus triggers unconditionally of match score or goals conceded:
- Low-block defenders from promoted or relegation-threatened clubs face relentless shot volume and box entries, racking up 13–15 defensive actions per match (e.g., John Egan averaging 13.67 and Nobel Mendy averaging 15.08 in GW1–3).
- In simulated matches where Hull concedes 3, 4, or 5 goals away to Chelsea or Newcastle, Egan and Mendy still frequently walk away with **+2 DefCon points** and **+1 to +3 BPS bonus points**, earning 3–4 net points despite a defensive blowout.
- In 10,000-run simulation breakdowns, DefCon points account for **26.6% of Egan's total points (+3.09 pts)** and **20.5% of Mendy's total points (+2.65 pts)**, whereas Gabriel receives only **5.4% (+0.52 pts)** because Arsenal's high-possession dominance suppresses opponent shot volume.

### Proposed Feature
Introduce a realistic **Goals Conceded Eligibility Gate** for defensive contribution points and its associated BPS boost:

1. **DefCon Point Eligibility Gate**:
   - Award the +2 DefCon points **only if team goals conceded $\le 1$** (or $\le 2$ goals).
   - If a team concedes $\ge 3$ goals, the defensive unit is deemed breached and disqualified from earning positive contribution points.
2. **BPS Bonus Decoupling in Conceded Matches**:
   - In official Premier League BPS scoring, goals conceded heavily penalize a defender's net BPS tally (-4 BPS for every goal conceded).
   - Condition the `elif defcon_pts >= 2` bonus roll in `simulator.py` to require `goals_conceded <= 1`. Defenders on losing or heavily penetrated sides should not capture maximum bonus points over winning attackers or clean-sheet goalkeepers.

### Implementation Considerations & Trade-Offs
- **Pros**: Eliminates the perverse incentive where poor defensive units facing 20+ shots get rewarded with fantasy points during blowout losses; properly reserves DefCon bonuses for disciplined, resolute defensive stands (e.g., 0-0 draws or 1-0 smash-and-grab wins).
- **Cons / Nuances**: Needs to align with whichever specific competition rules or fantasy format is being targeted.

---

## 10. Defensive Contribution (CBIT) Sample Shrinkage & Opponent Pressure Rebalancing

### Background & Motivation
In `fpl_api.py` (lines 369–376), player-level defensive actions per 90 are regressed against a positional baseline using a 450-minute sample window (`def_sample_mins = 450.0`):
```python
pos_def_baseline = {"DEF": 7.6, "MID": 8.2, "FWD": 4.5}.get(position, 7.6)
def_weight = min(1.0, max(0.0, total_minutes / def_sample_mins))
regressed_def_contrib = (raw_def_contrib * def_weight) + (pos_def_baseline * (1.0 - def_weight))
scaled_def_contrib = round(regressed_def_contrib * (0.85 + 0.15 * opp_att_ratio), 2)
```

At 270 minutes (3 matches), `def_weight` is $270 / 450 = 0.60$. A defender with 41 actions in 3 games retains a regressed rate of **11.61 actions per 90**.

Furthermore, line 375 multiplies this rate by `(0.85 + 0.15 * opp_att_ratio)`. When playing elite attacks like Chelsea (`opp_att_ratio = 1.22`), the defender's projected action rate increases even further, making a $\ge 10$ action outcome virtually guaranteed (>60% probability) in simulated minutes. Combined with FPL's integer floor on goal concessions (`goals_conceded // 2`), defenders are under-penalized for conceding goals while heavily rewarded for facing shots.

### Proposed Feature
1. **Extend the DefCon Regression Horizon**:
   - Increase `def_sample_mins` from 450 minutes (~5 matches) to **900 minutes** (~10 matches) or **1,080 minutes** (~12 matches) during the opening third of the season.
   - A single 3-match siege (e.g., facing 25 shots against Man United) will not skew a defender's long-term expectation above sustainable Premier League levels (~7.0–8.5 CBIT/90).
2. **Rebalance or Remove Opponent Attacking Multiplier on Positive Points**:
   - Remove the `opp_att_ratio` multiplier on defensive contribution rate, or tie it inversely to expected goals conceded (high opponent pressure increases expected goals conceded faster than it produces net fantasy points).
3. **Calibrate Truncated Conceded Goals in the Simulator**:
   - In `simulator.py` (lines 279–281), when a clean sheet is lost, goals conceded are sampled from $1 + \text{Poisson}(\max(0.2, \text{team\_xGC} - 0.7))$.
   - Review whether high-xGC fixtures ($\text{xGC} > 2.0$) appropriately reflect multi-goal scorelines (3, 4, or 5 goals) to ensure the `-1 pt per 2 goals` penalty applies accurately in lopsided fixtures.

### Implementation Considerations & Trade-Offs
- **Pros**: Normalizes defender projections across different tactical setups; prevents promoted budget defenders from artificially outprojecting premium defenders like Gabriel, Saliba, or Van Dijk.
- **Cons / Nuances**: Requires testing across the full 600+ player element dataset to ensure mid-table defensive regulars who legitimately excel at clearances and blocks retain appropriate value.

---

## 11. Goalkeeper Modeling Improvements: Save Shrinkage, Tier Defense Blending & Empirical CS Adjustments [COMPLETED]

### Background & Motivation
In early gameweeks, Kjell Scherpen (Ipswich Town; 0 clean sheets, 10 goals conceded in 4 matches) was projected at **16.01 expected points** across 5 gameweeks, ranking above Antonín Kinský (Spurs; 2 clean sheets, 5 goals conceded in 4 matches, 14.80 xP).

Root-cause analysis pinpointed four compounding mathematical drivers:
1. **Unregressed Raw Save Volume**: Scherpen recorded 15 saves in 360 minutes (3.75 saves/90), while Kinsky recorded 9 saves (2.25 saves/90).
2. **Lack of Defensive Caliber Priors**: Spurs (1.66 raw xGC/90) and Ipswich (1.68 raw xGC/90) were treated as defensively equivalent in early fixtures.
3. **Save Inflation Against Elite Attacks**: Keepers playing against top attacks were scaled by full opponent attacking strength (e.g. Scherpen vs Man City at 4.76 saves/90), earning bonus save points despite conceding high volume.
4. **Ignoring Empirical Conversion & Clean Sheet Records**: Clean sheet probabilities relied solely on raw single-match Poisson xGC without accounting for actual historical conversion or clean sheets kept.

### Implemented Solutions (fpl_api.py & app.py)
1. **Bayesian Shrinkage on Goalkeeper Saves (`saves_per_90`)**:
   - Shrinks raw early-season saves/90 towards a 2.85 league baseline (and past multi-season records where $\ge 450$ minutes exist) over a 1,080-minute window (12 matches):
   $$\text{Regressed\_Saves} = w_{\text{mins}} \cdot \text{Raw\_Saves} + (1 - w_{\text{mins}}) \cdot \text{Prior\_Saves}$$
2. **Club-Tier Defensive Baseline Priors in `get_team_ratings()`**:
   - Categorized all Premier League clubs into defensive tiers (Arsenal 1.05, Man City 1.10, Liverpool 1.15, Spurs/Chelsea/Newcastle 1.30, Mid-table 1.40–1.45, Promoted/Struggling 1.70–1.75).
   - Regresses team defensive rating over 1,080 minutes, bringing Spurs to 1.42 xGC/90 and Ipswich to 1.73 xGC/90.
3. **Dampened Save Scaling & Plausibility Clamping**:
   - Dampened attack scaling on saves (`1.0 + 0.30 * (opp_att_ratio - 1.0)`) recognizing elite attacks produce goals rather than routine saves.
   - Clamped maximum save rate to $\le 3.50$ saves/90.
4. **Empirical Clean Sheet & Goals Conceded Ratios**:
   - Multiplies match xGC by an empirical conversion factor bounded between $[0.75, 1.35]$ based on actual goals conceded vs expected:
   $$\text{gc\_factor} = \text{clamp}(0.75, 1.35, w_{\text{mins}} \cdot \frac{\text{Actual\_GC}}{\text{Exp\_GC}} + (1 - w_{\text{mins}}))$$
   - Blends Poisson clean sheet probability with empirical clean sheet percentage.

### Verified Outcomes (10,000 Monte Carlo Iterations)
- **Kinsky (Spurs)**: 5-GW projection increased from 14.80 to **18.50 xP** (1-GW xP: **4.56 pts**, CS%: **51.0%** vs Aston Villa).
- **Scherpen (Ipswich Town)**: 5-GW projection normalized from 16.01 to **12.88 xP** (1-GW xP: **2.58 pts**, CS%: **14.0%** vs Everton).
- **Goalkeeper Rankings Restored**: Donnarumma (£5.5m, 21.26 xP), Raya (£6.0m, 21.23 xP), Kelleher (£5.0m, 20.33 xP), Pickford (£5.5m, 20.21 xP), and Kinsky (£4.5m, 18.50 xP) correctly occupy top tier; Scherpen ranks 20th among starters (12.88 xP).
- **Optimal Squad Selections**: Goalkeeper slots now feature reliable starting goalkeepers (Kinsky / Raya) paired with valid budget backups across all horizons (1-GW, 3-GW, 5-GW, and Template).

---

## 12. Team-Level Match Odds & Fixture Expected Goals Ticker [COMPLETED]

### Background & Motivation
FPL managers evaluate captaincy picks, rotation strategies, and long-term transfers by assessing fixture difficulty and expected goal volumes across upcoming match schedules. Previously, expected goals were calculated solely at the individual player level, making it difficult to evaluate team-level match probabilities, clean sheet odds, over/under goal trends, or club-level attacking fixture runs.

### Implemented Solutions
1. **Blended Team Fixture xG Model**:
   - For any matchup between Home team $H$ and Away team $A$:
     $$\text{xG}_H = \frac{(H.\text{xG90} \times A.\text{def\_ratio} \times 1.08) + (A.\text{xGC90} \times A.\text{gc\_factor} \times H.\text{att\_ratio} \times 1.10)}{2}$$
     $$\text{xG}_A = \frac{(A.\text{xG90} \times H.\text{def\_ratio} \times 0.92) + (H.\text{xGC90} \times H.\text{gc\_factor} \times A.\text{att\_ratio} \times 0.90)}{2}$$
2. **Match Odds & Scorelines Tool (`/match-odds`)**:
   - **Projected Match xG**: Displays projected home and away xG with total match goal projection.
   - **Bivariate Poisson Probability Matrix**: Computes probabilities for all scorelines $(i, j) \in [0..7] \times [0..7]$ via $P(i, j) = \frac{\lambda_H^i e^{-\lambda_H}}{i!} \times \frac{\lambda_A^j e^{-\lambda_A}}{j!}$.
   - **Win / Draw / Loss Odds**: Aggregates home win %, draw %, and away win % probabilities.
   - **Top 5 Most Probable Exact Scorelines**: Identifies exact score outcomes sorted by probability.
   - **Over / Under 2.5 Goals & Both Teams to Score (BTTS)**: Calculates betting/FPL-relevant goal volume indicators.
   - **Clean Sheet Probabilities**: Highlights home and away shutout percentages.
   - **Gameweek Selector**: Filters upcoming fixtures by gameweek.
3. **Fixture Expected Goals Ticker (`/fixture-ticker`)**:
   - **Ranked League Table**: Ranks all 20 Premier League clubs by projected expected goals.
   - **Horizon Filtering**: Toggles between Next 3 GWs, Next 5 GWs, and Next 8 GWs.
   - **Gameweek Breakdown**: Shows individual opponent badges (with Home/Away tag) and projected xG per match.
   - **Color-Coded Heatmap**: Visually highlights green/emerald runs ($\ge 2.0$ xG), neutral amber/yellow, and tough rose/red runs ($< 1.0$ xG).
   - **Summary Stats**: Displays Total Projected xG, Average xG/match, and Best Matchup indicators.

---

## 13. Custom Team Value & Sub-£100m Squad Budget Optimizer [COMPLETED]

### Background & Motivation
In Fantasy Premier League, many managers do not have exactly £100.0m available for squad selection. Early-season price drops, early transfers, or poor player value preservation frequently leave managers with team values below £100.0m (e.g. £94.5m–£98.5m). Previously, optimal squad selections were hard-coded to a static £100.0m limit, rendering the recommendations unusable or over-budget for managers with constrained squads.

### Implemented Solutions
1. **Dynamic Custom Budget Solver Engine (`/api/budget-optimizer`)**:
   - Solves for the optimal 15-player squad (2 GKP, 5 DEF, 5 MID, 3 FWD) matching any user-defined team value constraint (e.g. £70.0m to £115.0m).
   - Evaluates direct Starting XI points under all 7 valid FPL formations: 3-4-3, 3-5-2, 4-4-2, 4-3-3, 4-5-1, 5-3-2, 5-4-1.
   - Enforces the starting goalkeeper rule (`start_prob >= 50%` or `minutes >= 180 && start_prob >= 25%`) and valid goalkeeper pairing pricing strategies (premium + £4.0m reserve or rotating budget keepers).
   - Maximum 3 players per Premier League team strictly enforced.
   - Supports 1-GW, 3-GW, and 5-GW simulation horizons with instantaneous (<50ms) execution time.
2. **Interactive UI Tool (`/budget-optimizer`)**:
   - Numeric input and smooth range slider (£80.0m to £108.0m) with 0.1m precision.
   - Quick preset buttons for common sub-£100m budgets (£94.0m, £96.0m, £97.5m, £99.0m, £100.0m, £102.0m, £104.0m).
   - Authentic pitch formation view with club kit jerseys, FDR fixture timeline badges, captaincy armbands (C / VC), and ordered bench layout.
   - Table view toggle with sortable player metrics (Price, xP, PPM, Ownership %, Form).
   - Full integration with `PlayerModal` for detailed historical breakdown.
   - Added to navigation bar under the "Tools" dropdown.
3. **Python CLI Integration (`optimizer.py`)**:
   - Added command line arguments `--budget` and `--horizon` to `optimizer.py` (e.g. `python3 optimizer.py --budget 96.5 --horizon 3`).

---

## 14. Similar Price Alternative Recommendations in Player Projection Modal [COMPLETED]

### Background & Motivation
When exploring a player in FPL, managers frequently need to benchmark them against other viable assets at a similar price point (±£0.5m). Finding whether a player is the consensus template pick, an explosive high-ceiling differential, or whether an alternative offers higher expected points requires manually cross-referencing multiple tables.

### Implemented Solutions
1. **Player Alternatives Engine (`/api/player-alternatives`)**:
   - Analyzes all players in the same position within ±£0.5m of the viewed player's price (`[price - 0.5, price + 0.5]`).
   - Categorizes alternatives into 3 distinct strategies:
     - **1. Safe "Template" Pick**: Highest FPL ownership percentage (`selected_by_percent`) to protect overall rank and minimize volatility.
     - **2. High Upside "Haul" Potential**: Highest haul probability (`haul_prob >= 10 pts`) and 90th percentile ceiling (`ceiling`) for chasing rank or captaincy upside.
     - **3. Balanced "Optimized" Pick**: Highest expected points (`xp`). If the currently viewed player is already the #1 optimal pick at that price, the engine automatically recommends the **next most optimal player** at that price point.
   - Enforces unique recommendation diversity across the 3 options when candidate pool size permits.
   - Gracefully handles premium outliers (e.g. Haaland, Gabriel) with nearest adjacent price bracket fallbacks.
2. **Interactive UI in Player Modal (`PlayerModal.tsx`)**:
   - Three distinct strategy cards rendered directly inside the modal with strategy badges, price and cost difference (`+£0.5m`, `-£0.2m`), key highlighted metrics, points differential vs current player, and upcoming fixture FDR pills.
   - **Interactive Navigation**: Clicking any alternative card seamlessly switches the modal to inspect that player's projections, 5-GW history, and fixture schedule, with an instant "Back to [Original Player]" button for easy navigation.

---

## 15. Team Expected Goals Against (xGC) Defensive Ticker [COMPLETED]

### Background & Motivation
While the Team Expected Goals (xG) Ticker allows managers to target attacking returns for midfielders and forwards, targeting defensive assets (goalkeepers and defenders) requires analyzing the defensive counterpart: **Expected Goals Conceded (xGC)** and clean sheet potential. Evaluating fixtures solely by opponent rank or official FDR overlooks tactical matchups, home/away venue splits, and team defensive solidity.

### Implemented Solutions
1. **Defensive Projection Engine (`/api/fixture-xgc-ticker`)**:
   - Computes symmetric, fixture-level expected goals conceded ($xGC$) and clean sheet probabilities ($P(\text{CS}) = e^{-xGC} \times 100\%$) for all 20 Premier League clubs across multi-gameweek horizons (3, 5, and 8 GWs).
   - Accurately accounts for opponent attacking strength ($xG_{90}$, attack ratio), team defensive resilience ($xGC_{90}$, defensive ratio, goal concession factor), and venue weighting (home advantage vs away disadvantage).
   - Defaults to ranking clubs with the lowest total xGC at #1 (best defensive schedule).
2. **Interactive UI Tool (`/fixture-xgc-ticker` & `FixtureXgcTickerView.tsx`)**:
   - **Defensive-Reward Color Coding**: Inverts the color scale to reward defensive resilience and low expected concession:
     - $\le 0.85$ xGC: Deep Emerald (`bg-emerald-600 text-white`, Prime Clean Sheet Target)
     - $0.86\text{–}1.15$ xGC: Light Emerald (`bg-emerald-100 text-emerald-950`, Strong Matchup)
     - $1.16\text{–}1.45$ xGC: Slate (`bg-slate-100 text-slate-800`, Average Fixture)
     - $1.46\text{–}1.75$ xGC: Amber (`bg-amber-100 text-amber-950`, High Concession Risk)
     - $> 1.75$ xGC: Rose (`bg-rose-500 text-white`, Difficult Matchup)
   - **Controls & Filtering**:
     - Horizon selector for 3, 5, or 8 gameweeks.
     - Live club search filter.
     - Interactive table sorting by Total xGC, Average xGC, or any individual gameweek column with toggleable ascending/descending directions.
   - **Defensive Podium**:
     - Highlights the Top 3 best defensive schedules over the selected horizon, displaying total xGC, average xGC per match, and highest single-fixture clean sheet probability.
3. **Navigation Integration (`Navbar.tsx`)**:
   - Added `Fixture xGC ticker` to the desktop "Tools" dropdown menu and mobile navigation drawer with a dedicated `Shield` icon.

---

## 16. Rebranding to "FPL Hauls", Data Science Terminology & Namecheap Color System [COMPLETED]

### Background & Motivation
The platform transitioned its identity from "FPL Monte Carlo" to **"FPL Hauls"** to align directly with Fantasy Premier League culture and focus on high-impact gameweek hauls. Rather than using the specialized academic phrasing "Monte Carlo", the user experience was updated to more generic, accessible, and professional terminology: **"Data science"** and **"prediction models"**. The visual hierarchy was redesigned using the **Namecheap.com design palette** as a guide for headers, links, and icons.

### Implemented Solutions
1. **Brand Identity & Name Update**:
   - Updated site title and global brand mark to **FPL Hauls**.
   - Replaced logo icon with an energetic `Flame` mark in Namecheap Willpower Orange (`#FE5803`) and Comforting Orange (`#FF8C44`).
   - Rebranded sub-badges to **Data Science** and **Prediction Models**.
   - Updated legal disclaimers, terms of service, contact endpoints (`support@fplhauls.com`), and footer metadata.
2. **Terminology Modernization**:
   - Replaced all customer-facing occurrences of "Monte Carlo" across the entire codebase with "Data science" and "prediction models" (e.g., in Player Modal projection headers, distribution models, optimal squad horizon banners, and transfer engine summaries).
3. **Namecheap Color System Integration**:
   - **Headers**: Clean, high-contrast dark charcoal / slate typography (`text-slate-900` / `#2B2E34`).
   - **Links & Interactive States**: Primary links, navigation items, and hover states adopt Namecheap Willpower Orange (`text-[#FE5803]` / `hover:text-[#FE5803]`).
   - **Icons & Badges**: Soft warm orange pill badges (`bg-orange-50 text-[#FE5803] ring-1 ring-orange-500/20`), active tabs, and animated loaders (`text-[#FE5803]`).
   - **Primary Action Buttons**: Styled in bold Willpower Orange (`bg-[#FE5803] hover:bg-[#DE4902] text-white shadow-md shadow-orange-500/20`).







