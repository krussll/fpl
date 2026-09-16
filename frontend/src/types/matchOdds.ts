export interface ScorelineProbability {
  home_goals: number;
  away_goals: number;
  score: string;
  probability: number;
  percentage: number;
}

export interface MatchProjection {
  id: number;
  gameweek: number;
  kickoff_time: string;
  home_team: {
    id: number;
    name: string;
    short_name: string;
    fdr: number;
    xg: number;
    clean_sheet_pct: number;
    att_ratio: number;
    def_ratio: number;
  };
  away_team: {
    id: number;
    name: string;
    short_name: string;
    fdr: number;
    xg: number;
    clean_sheet_pct: number;
    att_ratio: number;
    def_ratio: number;
  };
  total_match_xg: number;
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    over_25: number;
    under_25: number;
    over_15: number;
    under_15: number;
    over_35: number;
    under_35: number;
    btts_yes: number;
    btts_no: number;
  };
  top_scorelines: ScorelineProbability[];
  score_matrix: number[][]; // 5x5 matrix of [home][away] percentages
}

export interface MatchOddsResponse {
  current_gameweek: number;
  selected_gameweek: number;
  available_gameweeks: number[];
  matches: MatchProjection[];
}
