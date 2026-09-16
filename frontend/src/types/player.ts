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

export interface PlayerHistoryMatch {
  round: number;
  fixture_id?: number;
  opponent_id: number;
  opponent_name: string;
  opponent_short: string;
  was_home: boolean;
  team_h_score?: number | null;
  team_a_score?: number | null;
  total_points: number;
  minutes: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  bonus: number;
  bps: number;
  defensive_contribution: number;
  starts: number;
  expected_goals?: string;
  expected_assists?: string;
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
  history?: PlayerHistoryMatch[];
}

export interface SquadCaptainInfo {
  id: number;
  name: string;
  full_name: string;
  team: string;
  position: string;
  price: number;
  xp: number;
  doubled_xp?: number;
  selected_by_percent?: number;
  opponent?: string;
  fdr?: number;
}

export interface SquadPlayer extends Player {
  is_starter?: boolean;
  bench_order?: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
}

export interface OptimalSquad {
  id: string;
  gameweek: number;
  horizon: number | string;
  mode?: string;
  title: string;
  formation: string;
  budget: number;
  total_cost: number;
  bank_remaining: number;
  starting_xi_xp: number;
  total_match_xp: number;
  full_squad_xp: number;
  starting_xi_ownership?: number;
  total_squad_ownership?: number;
  total_ownership?: number;
  captain: SquadCaptainInfo;
  vice_captain: SquadCaptainInfo;
  formation_lines: {
    gkp: SquadPlayer[];
    def: SquadPlayer[];
    mid: SquadPlayer[];
    fwd: SquadPlayer[];
  };
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  notes?: string[];
}

export interface TransferAlternative {
  player_out: SquadPlayer;
  player_in: Player;
  xp_gain: number;
  ownership_gain: number;
  ceiling_gain: number;
  haul_prob_gain: number;
  cost_diff: number;
  new_bank: number;
}

export interface TransferRecommendation {
  type: "points_optimized" | "template_protection" | "haul_potential";
  title: string;
  badge: string;
  description: string;
  player_out: SquadPlayer;
  player_in: Player;
  xp_gain: number;
  ownership_gain: number;
  ceiling_gain: number;
  haul_prob_gain: number;
  cost_diff: number;
  new_bank: number;
  rationale: string;
  key_stat: string;
  alternatives: TransferAlternative[];
}

export interface UserTeamManager {
  id: number;
  name: string;
  team_name: string;
  overall_points: number;
  overall_rank: number | null;
  current_event: number;
  total_transfers?: number;
}

export interface UserTeamSquad {
  starters: SquadPlayer[];
  bench: SquadPlayer[];
  formation: string;
  formation_lines: {
    gkp: SquadPlayer[];
    def: SquadPlayer[];
    mid: SquadPlayer[];
    fwd: SquadPlayer[];
  };
  captain: SquadCaptainInfo;
  vice_captain: SquadCaptainInfo;
  starting_xi_xp: number;
  starting_xi_ownership: number;
  total_cost: number;
  bank: number;
}

export interface UserTeamTransferResponse {
  manager: UserTeamManager;
  squad: UserTeamSquad;
  recommendations: {
    points_optimized: TransferRecommendation;
    template_protection: TransferRecommendation;
    haul_potential: TransferRecommendation;
  };
  player_replacements: Record<number, TransferAlternative[]>;
  horizon: number;
}


