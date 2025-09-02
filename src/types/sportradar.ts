// Enhanced TypeScript interfaces for Sportradar Soccer API

export interface Competition {
  id: string;
  name: string;
  gender: string;
  type: string;
  parent_id?: string;
  country_code?: string;
  category?: {
    id: string;
    name: string;
    country_code: string;
  };
}

export interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  year: string;
  competition_id: string;
  disabled?: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  country: string;
  country_code: string;
  abbreviation: string;
  qualifier: 'home' | 'away';
  gender?: string;
}

export interface Venue {
  id: string;
  name: string;
  city_name: string;
  country_name: string;
  capacity?: number;
}

export interface SportEventStatus {
  status: 'not_started' | 'live' | 'ended' | 'postponed' | 'cancelled';
  match_status: string;
  home_score?: number;
  away_score?: number;
  winner_id?: string;
  period_scores?: Array<{
    home_score: number;
    away_score: number;
    type: string;
    number: number;
  }>;
}

export interface SportEvent {
  id: string;
  start_time: string;
  start_time_confirmed: boolean;
  competitors: Competitor[];
  venue?: Venue;
  sport_event_status: SportEventStatus;
  sport_event_context?: {
    competition: Competition;
    season: Season;
  };
  coverage?: {
    live: boolean;
    type: string;
  };
}

export interface MatchStatistics {
  home: TeamStats;
  away: TeamStats;
  totals: {
    goals: number;
    both_teams_scored: boolean;
    over_2_5: boolean;
  };
}

export interface TeamStats {
  goals: number;
  shots_total: number;
  shots_on_target: number;
  corner_kicks: number;
  ball_possession: number;
  fouls: number;
  yellow_cards: number;
  red_cards: number;
}

export interface PredictionCriteria {
  both_teams_score: boolean;
  over_2_5_goals: boolean;
  confidence_score: number;
  factors: string[];
}

export interface OverUnderStatistics {
  competitor_id: string;
  matches_played: number;
  matches_over: number;
  matches_under: number;
  percentage_over: number;
  average_goals: number;
}

// API Response Types
export interface CompetitionsResponse {
  competitions: Competition[];
}

export interface LiveMatchesResponse {
  sport_events: SportEvent[];
  summaries?: MatchSummary[];
}

export interface MatchSummary {
  sport_event: SportEvent;
  sport_event_status: SportEventStatus;
  statistics?: {
    totals?: {
      competitors?: Array<{
        id: string;
        name: string;
        qualifier: 'home' | 'away';
        statistics: Record<string, number>;
      }>;
    };
  };
}

export interface MatchSummaryResponse {
  sport_event: SportEvent;
  sport_event_status: SportEventStatus;
  statistics?: any;
}

export interface SeasonScheduleResponse {
  sport_events: SportEvent[];
}

export interface StandingsResponse {
  standings: Array<{
    type: string;
    groups: Array<{
      id: string;
      name: string;
      group_standings: Array<{
        rank: number;
        competitor: Competitor;
        played: number;
        win: number;
        draw: number;
        loss: number;
        goals_for: number;
        goals_against: number;
        goal_difference: number;
        points: number;
        change?: number;
      }>;
    }>;
  }>;
}

export interface ScheduledMatchesResponse {
  sport_events: SportEvent[];
  summaries?: MatchSummary[];
}

// Prediction Types
export interface TeamForm {
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  recentMatches: number;
  bttsPercentage: number;
  over25Percentage: number;
}

export interface PredictionInput {
  home: TeamForm;
  away: TeamForm;
  leagueAdjustment?: number;
}

export interface PredictionResult {
  btts: number; // 0..1 probability
  over2p5: number; // 0..1 probability
  expectedGoalsTotal: number;
  confidence: number; // 0..100
}

// Transformed Match Data for UI
export interface TransformedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'scheduled' | 'finished';
  time: string;
  competition: string;
  venue?: string;
  prediction?: PredictionResult;
}