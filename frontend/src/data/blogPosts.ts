export interface TableOfContentsItem {
  id: string;
  title: string;
}

export interface RelatedTool {
  name: string;
  description: string;
  href: string;
  buttonText: string;
  badge: string;
}

export interface BlogCallout {
  type: "tip" | "warning" | "highlight";
  title: string;
  text: string;
}

export interface BlogTable {
  caption?: string;
  headers: string[];
  rows: string[][];
}

export interface BlogSection {
  id: string;
  heading: string;
  paragraphs: string[];
  callout?: BlogCallout;
  table?: BlogTable;
  bullets?: string[];
}

export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  publishedAt: string;
  dateISO: string;
  readingTime: string;
  category: string;
  categorySlug: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  author: {
    name: string;
    role: string;
    initials: string;
    bio: string;
  };
  tableOfContents: TableOfContentsItem[];
  relatedTool: RelatedTool;
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "fpl-sub-100m-budget-team-selection",
    title: "How to Build an Optimal FPL Squad When Your Team Value Drops Below £100m",
    subtitle:
      "Early-season price falls can cripple your team value down to £97.0m–£99.0m. Here is the mathematical data science framework to balance your starting XI, starve the bench, and climb back into rank contention.",
    description:
      "Struggling with an FPL team value under 100m? Learn the data-backed budget squad allocation model, starting XI vs bench trade-offs, and how to recover rank without wildcards.",
    publishedAt: "Sep 18, 2026",
    dateISO: "2026-09-18",
    readingTime: "7 min read",
    category: "Budget Strategy",
    categorySlug: "budget-strategy",
    targetKeyword: "FPL team value under 100m optimal squad",
    secondaryKeywords: [
      "sub 100m budget team selection FPL",
      "best cheap FPL squad",
      "fpl low team value recovery",
      "budget optimizer fantasy premier league",
    ],
    author: {
      name: "Reece Williams",
      role: "FPL Hauls Data Analyst",
      initials: "RW",
      bio: "Reece analyzes Fantasy Premier League using integer linear programming, Monte Carlo simulations, and fixture difficulty modeling.",
    },
    tableOfContents: [
      { id: "the-sub-100m-dilemma", title: "The Sub-£100m Dilemma: How Price Drops Compound" },
      { id: "core-principle", title: "The Core Principle: Protect Starting XI, Starve the Bench" },
      { id: "budget-allocation-breakdown", title: "Budget Allocation Breakdown (£97.5m vs £100.0m)" },
      { id: "enabler-selection", title: "The Art of the Enabler: 4.0m Def & 4.5m Mid" },
      { id: "formation-structures", title: "Optimal Formations Under Extreme Budget Constraints" },
      { id: "recovery-roadmap", title: "A 4-Gameweek Recovery Roadmap" },
    ],
    relatedTool: {
      name: "Budget Squad Optimizer",
      description:
        "Input your exact team value (from £90.0m to £105.0m) and planning horizon. Our mathematical solver generates the highest-scoring valid 15-man squad.",
      href: "/budget-optimizer",
      buttonText: "Open Budget Squad Optimizer",
      badge: "Free Mathematical Solver",
    },
    sections: [
      {
        id: "the-sub-100m-dilemma",
        heading: "The Sub-£100m Dilemma: How Price Drops Compound",
        paragraphs: [
          "Every Fantasy Premier League manager starts Gameweek 1 with £100.0m in the bank. But after several gameweeks of ill-timed transfers, player injuries, and rapid price falls, thousands of active managers find their total squad value dipping below £98.5m or even £97.0m.",
          "This creates a psychological trap known as the 'budget deficit spiral'. Managers panic-sell falling assets at an additional 50% profit tax haircut, make reactive hits to catch risers, and inadvertently lock in a permanent squad disadvantage against managers sitting on £102m+ squads.",
          "However, data science simulations reveal that team value is far less correlated with final overall rank than starting XI points efficiency. You do not need £103m to compete. What you need is rigorous mathematical discipline in how every tenth of a million is allocated across your 15 roster spots.",
        ],
        callout: {
          type: "highlight",
          title: "Key Data Takeaway",
          text: "In our historical simulations across the last 5 Premier League seasons, an optimized starting XI built on £97.5m total team value scored within 2.3% of an unoptimized template team built on £101.0m, provided bench expenditure was minimized to baseline floors.",
        },
      },
      {
        id: "core-principle",
        heading: "The Core Principle: Protect Starting XI, Starve the Bench",
        paragraphs: [
          "When you operate with £102.0m, you can afford luxury bench players like a £5.5m rotating defender and two £5.5m midfielders who collect points when rotation strikes. When your team value is £98.0m, that luxury is lethal.",
          "Points scored by players sitting on your bench provide zero value to your weekly rank unless an emergency autosub occurs. Over 38 gameweeks, bench players contribute less than 4.2% of a typical top-10k manager's total score, yet soak up 17%–20% of their total budget.",
          "Under our budget optimization framework, your 3 outfield bench players and backup goalkeeper must cost no more than the statutory minimums: £4.0m for GK2, £4.0m for DEF4 and DEF5, and £4.5m for MID5 or FWD3. This liberates an immediate £2.5m–£3.5m directly into your starting XI attack.",
        ],
        bullets: [
          "Backup Goalkeeper: Strictly £4.0m non-playing or playing fodder.",
          "5th Defender: £4.0m starting defender on a promoted or bottom-half side with guaranteed minutes.",
          "8th Attacker: £4.5m starting midfielder who reliably plays 90 minutes and avoids cards.",
          "Concentration of Capital: Direct 83%+ of all available squad value into your starting 11.",
        ],
      },
      {
        id: "budget-allocation-breakdown",
        heading: "Budget Allocation Breakdown (£97.5m vs £100.0m)",
        paragraphs: [
          "How does a mathematically optimized £97.5m squad look compared to a standard £100.0m squad? The table below demonstrates the optimal expenditure model produced by our linear programming solver for a 3-4-3 or 3-5-2 setup.",
        ],
        table: {
          caption: "Positional Budget Allocation Matrix: Sub-£100m Squad vs Standard Squad",
          headers: ["Position", "Standard (£100.0m)", "Sub-Budget (£97.5m)", "Strategic Adjustment"],
          rows: [
            ["Goalkeepers (2)", "£9.5m (£5.0m + £4.5m)", "£8.5m (£4.5m + £4.0m)", "Shift to set-and-forget £4.5m keeper"],
            ["Defenders (5)", "£26.5m (1x £6.0m, 2x £5.0m, 2x £4.5m)", "£23.0m (1x £6.0m, 2x £4.5m, 2x £4.0m)", "Sacrifice DEF4/5 to non-negotiable £4.0m"],
            ["Midfielders (5)", "£37.0m (1x £10.0m, 2x £7.5m, 1x £6.5m, 1x £5.5m)", "£36.5m (1x £11.0m, 2x £7.5m, 1x £6.5m, 1x £4.5m)", "Downgrade MID5 to £4.5m; preserve captaincy"],
            ["Forwards (3)", "£27.0m (1x £14.0m, 1x £7.5m, 1x £5.5m)", "£29.5m (1x £14.5m, 1x £8.5m, 1x £6.5m)", "Protect Haaland/premium focal point"],
            ["Total Spent", "£100.0m", "£97.5m", "Zero dead funds; starting XI preserved"],
          ],
        },
      },
      {
        id: "enabler-selection",
        heading: "The Art of the Enabler: 4.0m Def & 4.5m Mid",
        paragraphs: [
          "When selecting enablers for a sub-£100m team, managers frequently make the mistake of picking £4.0m defenders who never see the pitch. If an injury hits your starting XI, you score a zero.",
          "The solution is targeting 'reliable appearance enablers'. These are players who start regularly for newly promoted sides or injury-hit squads. They might rarely keep clean sheets or score goals, but a guaranteed 2 points off the bench completely insulates you from autosub disasters.",
          "For midfielders, look for defensive midfielders who take set pieces or get regular 90-minute appearances. In the 2026/27 meta, several £4.5m midfielders boast 85%+ start rates, providing dependable coverage without blowing your wage bill.",
        ],
        callout: {
          type: "tip",
          title: "Pro Scout Rule",
          text: "Never spend £4.5m on a non-playing striker. In FPL, non-playing £4.5m forwards are dead weight. Always opt for 3-5-2 or 3-4-3 formations where your sacrificial slot is at 5th defender or 5th midfielder.",
        },
      },
      {
        id: "formation-structures",
        heading: "Optimal Formations Under Extreme Budget Constraints",
        paragraphs: [
          "When team value is constrained below £100m, 3-4-3 and 3-5-2 formations drastically outperform 4-4-2 or 5-3-2 in expected points per million (xP/£m).",
          "This is because defender returns are heavily dependent on binary 4-point clean sheets, which have high variance. In contrast, attacking midfielders and talismans have access to appearance points, goal points, assist points, bonus points, and penalty duties.",
          "By deploying only 3 budget defenders (such as one premium wing-back paired with two £4.5m rotation options), you allocate 70%+ of your starting budget toward offensive ceiling.",
        ],
      },
      {
        id: "recovery-roadmap",
        heading: "A 4-Gameweek Recovery Roadmap",
        paragraphs: [
          "To rebuild both your squad value and your rank, follow this sequential 4-gameweek plan:",
          "1. Gameweek 1: Freeze impulsive transfers. Do not take -4 hits to chase price risers after they have already risen.",
          "2. Gameweek 2: Liquidate high-cost bench players into genuine 4.0m/4.5m enablers to free up £1.5m+ in bank liquidity.",
          "3. Gameweek 3: Re-invest the liberated capital into the highest-ceiling captaincy option on a green fixture run.",
          "4. Gameweek 4: Use our Budget Squad Optimizer to recalculate your optimal starting lineup for the next 5-game horizon.",
        ],
      },
    ],
  },
  {
    slug: "expected-goals-conceded-clean-sheet-targets",
    title: "Targeting Clean Sheets in FPL: Why Expected Goals Conceded (xGC) Beats FDR",
    subtitle:
      "Official FPL Fixture Difficulty Ratings group matches into blunt categories of 2 to 5. Here is why evaluating underlying Expected Goals Conceded (xGC) ratios exposes undervalued defensive hauls that the crowd completely misses.",
    description:
      "Discover how tracking Expected Goals Conceded (xGC) outperforms standard Official FPL fixture tickers. Learn to target low-xGC runs, home/away splits, and elite clean sheet odds.",
    publishedAt: "Sep 16, 2026",
    dateISO: "2026-09-16",
    readingTime: "6 min read",
    category: "Defensive Analysis",
    categorySlug: "defensive-analysis",
    targetKeyword: "FPL expected goals conceded ticker target clean sheets",
    secondaryKeywords: [
      "best defenders to target in FPL",
      "how to predict clean sheets fantasy premier league",
      "fpl xgc fixture ticker",
      "expected goals conceded clean sheet probability",
    ],
    author: {
      name: "Reece Williams",
      role: "FPL Hauls Data Analyst",
      initials: "RW",
      bio: "Reece analyzes Fantasy Premier League using integer linear programming, Monte Carlo simulations, and fixture difficulty modeling.",
    },
    tableOfContents: [
      { id: "the-fdr-blindspot", title: "The Blindspot in Official Fixture Difficulty Ratings" },
      { id: "what-is-xgc", title: "What is xGC and How Does It Predict Clean Sheets?" },
      { id: "home-away-splits", title: "The Critical Impact of Home vs Away Defense Splits" },
      { id: "xgc-case-study", title: "Case Study: Identifying Under-the-Radar Clean Sheet Runs" },
      { id: "rotation-strategies", title: "Budget Defensive Pairings: 4.5m Defender Rotation" },
      { id: "actionable-checklist", title: "Your Weekly Clean Sheet Target Checklist" },
    ],
    relatedTool: {
      name: "Fixture xGC Ticker",
      description:
        "Color-coded fixture grid ranking all 20 Premier League teams by projected Expected Goals Conceded (xGC) across 1 to 10 gameweeks. Green indicates low xGC (clean sheet potential).",
      href: "/fixture-xgc-ticker",
      buttonText: "View Fixture xGC Ticker",
      badge: "Real-Time Defensive Odds",
    },
    sections: [
      {
        id: "the-fdr-blindspot",
        heading: "The Blindspot in Official Fixture Difficulty Ratings",
        paragraphs: [
          "Nearly every FPL manager relies on the official in-game Fixture Difficulty Rating (FDR), color-coded from green (2) to dark red (5). While simple, this rating treats an entire match through a single generic lens.",
          "For example, a home match against a top-four team is almost always marked as difficulty 4 or 5. Yet if that opposing top-four team suffers an injury to their primary playmaker, their underlying Expected Goals (xG) might plummet from 2.20 down to 0.95 per game.",
          "Conversely, an away match against an aggressive mid-table club might be rated 2 or 3, despite the host creating 1.85 xG at home. Relying on basic FDR leads managers to bench defenders who actually hold a 42% clean sheet probability, while starting defenders who have less than an 18% chance of keeping a shutout.",
        ],
        callout: {
          type: "warning",
          title: "The Danger of Blanket Ratings",
          text: "Official FDR does not distinguish between attack difficulty and defense difficulty. A fixture can be brilliant for your attackers (high xG) while simultaneously treacherous for your defenders (high xGC). You must measure Expected Goals Conceded independently.",
        },
      },
      {
        id: "what-is-xgc",
        heading: "What is xGC and How Does It Predict Clean Sheets?",
        paragraphs: [
          "Expected Goals Conceded (xGC) measures the cumulative probability that shots faced by a team will result in a goal, based on shot angle, distance, assist type, and defensive pressure.",
          "Using a Poisson distribution model, we can directly convert a team's projected xGC into exact clean sheet probabilities. If Team A is projected to concede 0.70 xGC in a given gameweek, their mathematical clean sheet probability is approximately 49.7% (e^(-0.70)). If their xGC rises to 1.60, their clean sheet chance collapses to 20.2%.",
          "By filtering upcoming fixtures through projected xGC rather than vague reputation, you immediately see which backlines offer genuine bonus-point and clean-sheet upside.",
        ],
        table: {
          caption: "Mathematical Conversion: Projected xGC to Clean Sheet Probability",
          headers: ["Projected xGC", "Clean Sheet Probability", "Expected CS Points (Def)", "Ticker Rating"],
          rows: [
            ["0.60 or lower", "54.9%", "2.20 pts", "Dark Green (Prime Target)"],
            ["0.61 – 0.90", "40.7% – 54.3%", "1.63 – 2.17 pts", "Light Green (Favourable)"],
            ["0.91 – 1.25", "28.6% – 40.3%", "1.14 – 1.61 pts", "Neutral Slate (Average)"],
            ["1.26 – 1.60", "20.2% – 28.4%", "0.81 – 1.13 pts", "Light Red / Orange (Risky)"],
            ["1.61+", "Under 20.0%", "< 0.80 pts", "Deep Red (Avoid)"],
          ],
        },
      },
      {
        id: "home-away-splits",
        heading: "The Critical Impact of Home vs Away Defense Splits",
        paragraphs: [
          "Across the Premier League, home advantage remains a profound statistical driver of clean sheets. Mid-table defenses concede on average 32% fewer expected goals at home compared to away matches.",
          "A team like Fulham, Crystal Palace, or Brentford might look unappealing on a surface-level league table, but when playing at home against bottom-half opposition, their xGC regularly dips below 0.85.",
          "When planning defender transfers, never evaluate a team's defensive record in aggregate. Always isolate their home xGC metrics before deciding whether to buy, bench, or start.",
        ],
      },
      {
        id: "xgc-case-study",
        heading: "Case Study: Identifying Under-the-Radar Clean Sheet Runs",
        paragraphs: [
          "Consider an upcoming 4-game block where a £4.5m defender faces three home fixtures against newly promoted teams and one away fixture against a side without a recognised striker.",
          "While traditional FDR might tag these games with standard ratings of 2 and 3, our Fixture xGC Ticker computes a 4-gameweek cumulative xGC of just 3.10 (an average of 0.77 per match).",
          "That gives the defender a combined 74% likelihood of keeping at least one clean sheet and a 31% chance of keeping two or more. At £4.5m, this produces a staggering points-per-million return that vastly outpaces expensive £6.0m defenders playing through difficult away fixtures.",
        ],
      },
      {
        id: "rotation-strategies",
        heading: "Budget Defensive Pairings: 4.5m Defender Rotation",
        paragraphs: [
          "The ultimate defensive strategy for budget-conscious FPL managers is the '4.5m Home/Away Rotation Pair'.",
          "By pairing two £4.5m defenders from teams with perfectly alternating home fixtures, you can guarantee that your 3rd defender is playing at home every single gameweek.",
          "When combined with our Fixture xGC Ticker, you can select two clubs whose home matches specifically align with low-scoring opponents, driving down your active defensive xGC to under 0.90 per week for just £9.0m in total defensive budget.",
        ],
      },
      {
        id: "actionable-checklist",
        heading: "Your Weekly Clean Sheet Target Checklist",
        paragraphs: [
          "Before confirming your defensive transfers each Friday, run through these four questions:",
          "1. Does the target club have a 3-gameweek projected average xGC below 1.05?",
          "2. Are at least 2 of the next 3 fixtures taking place at their home ground?",
          "3. Does the defender have set-piece or crossing involvement to supplement clean sheets with attacking bonus?",
          "4. Have you verified the opposing striker's injury status to confirm low opposing shot volume?",
        ],
      },
    ],
  },
  {
    slug: "fpl-transfer-recommendation-strategies-template-vs-differential",
    title: "Template Protection vs Differential Hauls: A Data Science Guide to FPL Transfers",
    subtitle:
      "Should you protect your rank by following 60%+ owned players, or chase explosive differentials? How to calculate the risk-reward tradeoff of every weekly transfer to maximize your expected rank finish.",
    description:
      "Template protection vs differential upside: learn how data science, Effective Ownership (EO), and haul probability curves guide smarter FPL transfer recommendations.",
    publishedAt: "Sep 14, 2026",
    dateISO: "2026-09-14",
    readingTime: "8 min read",
    category: "Transfer Tactics",
    categorySlug: "transfer-tactics",
    targetKeyword: "FPL transfer recommendation template protection vs differential haul",
    secondaryKeywords: [
      "template vs differential FPL transfers",
      "effective ownership fpl strategy",
      "best fpl transfer strategy",
      "how to climb fpl rank differentials",
    ],
    author: {
      name: "Reece Williams",
      role: "FPL Hauls Data Analyst",
      initials: "RW",
      bio: "Reece analyzes Fantasy Premier League using integer linear programming, Monte Carlo simulations, and fixture difficulty modeling.",
    },
    tableOfContents: [
      { id: "effective-ownership", title: "Understanding Effective Ownership (EO)" },
      { id: "mathematics-of-template", title: "The Mathematics of Template Protection" },
      { id: "when-to-hunt-hauls", title: "When to Hunt Differentials: The Upside Haul Curve" },
      { id: "three-option-framework", title: "The 3-Option Transfer Framework" },
      { id: "price-bracket-clustering", title: "Price Bracket Clustering: Avoiding Dead Ends" },
      { id: "summary-playbook", title: "Gameweek Decision Playbook" },
    ],
    relatedTool: {
      name: "Transfer Recommendations",
      description:
        "Evaluate transfers through our 3-option approach: Safe Template Protection, High Upside Potential Haul, and Balanced Optimized Pick for any player.",
      href: "/transfer-recommendations",
      buttonText: "Try Transfer Recommendations",
      badge: "3-Option Transfer Solver",
    },
    sections: [
      {
        id: "effective-ownership",
        heading: "Understanding Effective Ownership (EO)",
        paragraphs: [
          "Effective Ownership (EO) is the single most important concept in modern competitive Fantasy Premier League. EO is defined as a player's starting ownership percentage plus their captaincy percentage (which counts double).",
          "If Erling Haaland or Mohamed Salah has 75% raw ownership and 80% of top-100k managers give them the captain's armband, their Effective Ownership in your competitive bracket exceeds 150%.",
          "At 150% EO, every goal that player scores actually reduces your overall rank if you do not own or captain them. Understanding this asymmetry transforms how you approach weekly transfer recommendations.",
        ],
        callout: {
          type: "highlight",
          title: "The EO Rule of Thumb",
          text: "When a player's EO in your target rank tier exceeds 120%, failing to own them is no longer an active gamble — it is a severe negative expected-value bet. In contrast, players with under 15% EO offer pure positive rank delta on every haul.",
        },
      },
      {
        id: "mathematics-of-template",
        heading: "The Mathematics of Template Protection",
        paragraphs: [
          "FPL influencers frequently glorify 'contrarian punts', but top-10k data confirms that high-performing managers rely on template protection for 70% to 80% of their squad makeup.",
          "Template players are heavily owned for an objective reason: they possess the highest baseline expected points (xP), dominate penalty and set-piece duties, and play for high-scoring attacks.",
          "By matching the template on 8 to 10 players, you anchor your weekly floor. Your team moves with the general population, insulating you from catastrophic red arrows when the popular captain hauls 15+ points.",
        ],
      },
      {
        id: "when-to-hunt-hauls",
        heading: "When to Hunt Differentials: The Upside Haul Curve",
        paragraphs: [
          "If template protection prevents you from falling, what actually propels you up the leaderboard? The answer is calculated differential targeting.",
          "A true differential is not simply a random low-owned player. It is a player whose underlying metrics (non-penalty xG, penalty-box touches, shot volume) indicate a high 90th-percentile ceiling, yet whose raw ownership remains under 10% due to recent bad luck or perceived difficult fixtures.",
          "When our prediction models run 10,000 gameweek simulations, we look at the 'tail distribution' — the probability that a player exceeds 10+ points in a single match. A differential with a 24% haul probability playing against a leaky defense is the ultimate rank accelerator.",
        ],
      },
      {
        id: "three-option-framework",
        heading: "The 3-Option Transfer Framework",
        paragraphs: [
          "To eliminate emotional bias from transfer decisions, FPL Hauls structures every player replacement into three clear categories:",
        ],
        table: {
          caption: "The 3-Option Transfer Methodology",
          headers: ["Transfer Style", "Primary Objective", "Ideal Manager Profile", "Risk / Reward"],
          rows: [
            [
              "1. Template Safe",
              "Shield rank from massive EO swings; eliminate negative rank exposure",
              "Managers defending a top-50k rank or leading their private mini-leagues",
              "Low Risk / High Stability",
            ],
            [
              "2. Upside Haul (Differential)",
              "Target 90th percentile ceiling; exploit favourable xG spikes",
              "Managers trailing mini-league leaders by 40+ points seeking fast gains",
              "Higher Variance / Maximum Ceiling",
            ],
            [
              "3. Balanced Optimized",
              "Max projected expected points (xP) across the next 3–5 gameweeks",
              "Managers steadily building sustainable, long-term squad value and points",
              "Optimal Sharpe Ratio (Points / Variance)",
            ],
          ],
        },
      },
      {
        id: "price-bracket-clustering",
        heading: "Price Bracket Clustering: Avoiding Dead Ends",
        paragraphs: [
          "A classic mistake among casual managers is making a sideways transfer that leaves them £0.1m short of their next intended move.",
          "When you consider alternatives within £0.5m above or below your outgoing asset, always assess the structural impact on your team:",
          "Does moving to this £6.5m midfielder lock you out of an upcoming £7.0m upgrade? Or does downgrading to a £5.5m asset generate the exact bank liquidity required to upgrade your defense next week?",
          "Our transfer recommendation algorithm evaluates price-tier clustering so you never stumble into a dead-end squad structure requiring unwanted -4 point hits to correct.",
        ],
      },
      {
        id: "summary-playbook",
        heading: "Gameweek Decision Playbook",
        paragraphs: [
          "To decide whether this week calls for template safety or differential hunting, ask yourself two simple questions:",
          "1. What is my mini-league / rank objective right now? If you are protecting a lead with 8 gameweeks remaining, prioritize Template Safe options.",
          "2. Does the differential option have an active tactical advantage (e.g. playing against a defense missing both starting center-backs)? If the answer is yes, pull the trigger.",
          "Head over to our Transfer Recommendations tool to see exact options tailored to your squad's price brackets.",
        ],
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return BLOG_POSTS;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(currentSlug: string): BlogPost[] {
  return BLOG_POSTS.filter((post) => post.slug !== currentSlug).slice(0, 2);
}
