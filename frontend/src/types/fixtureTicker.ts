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
