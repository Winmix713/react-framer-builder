import { SportEvent, MatchStatistics, PredictionCriteria, TeamForm } from '../types/sportradar';
import { predictBTTSAndOver2p5, calculateTeamForm } from './predictions';

export class PredictionEngine {
  // Legacy method - kept for backward compatibility
  static analyzeBTTSAndOver25(matchData: any): PredictionCriteria {
    // Use new prediction engine
    const homeForm = calculateTeamForm([]);
    const awayForm = calculateTeamForm([]);
    const prediction = predictBTTSAndOver2p5({ home: homeForm, away: awayForm });

    return {
      both_teams_score: prediction.btts > 0.5,
      over_2_5_goals: prediction.over2p5 > 0.5,
      confidence_score: prediction.confidence,
      factors: []
    };
  }

  static calculateTeamBTTSPercentage(teamMatches: any[]): number {
    if (!teamMatches || teamMatches.length === 0) return 0;
    
    const bttsMatches = teamMatches.filter(match => {
      const homeScore = match.sport_event_status?.home_score || 0;
      const awayScore = match.sport_event_status?.away_score || 0;
      return homeScore > 0 && awayScore > 0;
    });

    return (bttsMatches.length / teamMatches.length) * 100;
  }

  static calculateOver25Percentage(teamMatches: any[]): number {
    if (!teamMatches || teamMatches.length === 0) return 0;
    
    const over25Matches = teamMatches.filter(match => {
      const homeScore = match.sport_event_status?.home_score || 0;
      const awayScore = match.sport_event_status?.away_score || 0;
      return (homeScore + awayScore) > 2.5;
    });

    return (over25Matches.length / teamMatches.length) * 100;
  }

  static getMatchPrediction(
    homeTeamBTTS: number,
    awayTeamBTTS: number,
    homeTeamOver25: number,
    awayTeamOver25: number
  ): PredictionCriteria {
    const avgBTTS = (homeTeamBTTS + awayTeamBTTS) / 2;
    const avgOver25 = (homeTeamOver25 + awayTeamOver25) / 2;
    
    const factors: string[] = [];
    let confidence = 0;

    if (avgBTTS > 60) {
      factors.push(`High BTTS probability (${avgBTTS.toFixed(1)}%)`);
      confidence += 25;
    }

    if (avgOver25 > 60) {
      factors.push(`High Over 2.5 probability (${avgOver25.toFixed(1)}%)`);
      confidence += 25;
    }

    if (homeTeamBTTS > 70 && awayTeamBTTS > 70) {
      factors.push('Both teams have strong BTTS records');
      confidence += 20;
    }

    if (homeTeamOver25 > 70 && awayTeamOver25 > 70) {
      factors.push('Both teams involved in high-scoring games');
      confidence += 20;
    }

    return {
      both_teams_score: avgBTTS > 50,
      over_2_5_goals: avgOver25 > 50,
      confidence_score: Math.min(confidence, 100),
      factors
    };
  }
}