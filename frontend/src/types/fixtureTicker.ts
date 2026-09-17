export interface TeamFixtureTickerItem {
  gameweek: number;
  fixture_id: number;
  opponent_id: number;
  opponent_name: string;
  opponent_short: string;
  is_home: boolean;
  display: string; // e.g. "SUN (H)"
  fdr: number;
  projected_xg: number;
}

export interface TeamTickerRow {
  team_id: number;
  team_name: string;
  short_name: string;
  base_xg90: number;
  base_xgc90: number;
  fixtures: TeamFixtureTickerItem[];
  total_xg: number;
  avg_xg: number;
}

export interface FixtureTickerResponse {
  current_gameweek: number;
  horizons: number[];
  selected_horizon: number;
  teams: TeamTickerRow[];
}

export interface TeamFixtureXgcTickerItem {
  gameweek: number;
  fixture_id: number;
  opponent_id: number;
  opponent_name: string;
  opponent_short: string;
  is_home: boolean;
  display: string; // e.g. "SUN (H)"
  fdr: number;
  projected_xgc: number;
  clean_sheet_prob?: number;
}

export interface TeamXgcTickerRow {
  team_id: number;
  team_name: string;
  short_name: string;
  base_xg90: number;
  base_xgc90: number;
  fixtures: TeamFixtureXgcTickerItem[];
  total_xgc: number;
  avg_xgc: number;
}

export interface FixtureXgcTickerResponse {
  current_gameweek: number;
  horizons: number[];
  selected_horizon: number;
  teams: TeamXgcTickerRow[];
}

