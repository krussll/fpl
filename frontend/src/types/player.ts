export interface PlayerFixture {
  event: number;
  opponent: string;
  opponent_name: string;
  is_home: boolean;
  fdr: number;
  match_xp: number;
  cs_prob: number;
  defcon_prob: number;
}

export interface Player {
  id: number;
  name: string;
  full_name: string;
  team: string;
  team_id: number;
  position: "GKP" | "DEF" | "MID" | "FWD" | string;
  price: number;
  minutes: number;
  status: string;
  form: number;
  selected_by_percent: number;
  npxg90?: number;
  xa90?: number;
  def_contrib90?: number;
  saves90?: number;
  start_prob?: number;
  xp: number;
  ppm: number;
  sigma?: number;
  floor: number;
  median?: number;
  ceiling: number;
  haul_prob: number;
  defcon_prob: number;
  cs_prob?: number;
  fixtures?: PlayerFixture[];
  distribution?: Record<string, number>;
  fixtures_5?: PlayerFixture[];
  five_gw?: Player;
}
