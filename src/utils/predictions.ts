// Advanced prediction engine for BTTS and Over 2.5 goals

import { TeamForm, PredictionInput, PredictionResult } from '../types/sportradar';

// Mathematical utilities for Poisson distribution
const factorial = (n: number): number => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

const pois = (lambda: number, k: number): number => {
  return (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k);
};

// Main prediction function using Poisson model
export function predictBTTSAndOver2p5(input: PredictionInput): PredictionResult {
  const { home, away, leagueAdjustment = 1.0 } = input;
  
  // Calculate expected goals for each team
  const lambdaHome = Math.max(0.05, (home.avgGoalsFor + away.avgGoalsAgainst) / 2) * leagueAdjustment;
  const lambdaAway = Math.max(0.05, (away.avgGoalsFor + home.avgGoalsAgainst) / 2) * leagueAdjustment;
  
  // BTTS calculation: 1 - P(home=0) - P(away=0) + P(both=0)
  const pHome0 = pois(lambdaHome, 0);
  const pAway0 = pois(lambdaAway, 0);
  const pBoth0 = pHome0 * pAway0;
  const btts = 1 - pHome0 - pAway0 + pBoth0;
  
  // Over 2.5 calculation: 1 - P(total goals <= 2)
  let pTotalLe2 = 0;
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2 - i; j++) {
      pTotalLe2 += pois(lambdaHome, i) * pois(lambdaAway, j);
    }
  }
  const over2p5 = 1 - pTotalLe2;
  
  // Calculate confidence based on data quality and consistency
  const confidence = calculateConfidence(home, away, btts, over2p5);
  
  return {
    btts: Math.max(0, Math.min(1, btts)),
    over2p5: Math.max(0, Math.min(1, over2p5)),
    expectedGoalsTotal: lambdaHome + lambdaAway,
    confidence
  };
}

function calculateConfidence(home: TeamForm, away: TeamForm, btts: number, over2p5: number): number {
  let confidence = 50; // Base confidence
  
  // Increase confidence based on sample size
  const minMatches = Math.min(home.recentMatches, away.recentMatches);
  if (minMatches >= 10) confidence += 20;
  else if (minMatches >= 5) confidence += 10;
  
  // Increase confidence for consistent patterns
  if (home.bttsPercentage > 60 && away.bttsPercentage > 60) confidence += 15;
  if (home.over25Percentage > 60 && away.over25Percentage > 60) confidence += 15;
  
  // Adjust based on prediction strength
  if (btts > 0.7 || over2p5 > 0.7) confidence += 10;
  if (btts > 0.8 || over2p5 > 0.8) confidence += 5;
  
  return Math.min(100, Math.max(0, confidence));
}

// Utility functions for team form analysis
export function calculateTeamForm(recentMatches: any[]): TeamForm {
  if (!recentMatches || recentMatches.length === 0) {
    return {
      avgGoalsFor: 1.0,
      avgGoalsAgainst: 1.0,
      recentMatches: 0,
      bttsPercentage: 50,
      over25Percentage: 50
    };
  }
  
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;
  let bttsCount = 0;
  let over25Count = 0;
  
  recentMatches.forEach(match => {
    const homeScore = match.sport_event_status?.home_score || 0;
    const awayScore = match.sport_event_status?.away_score || 0;
    const isHome = match.sport_event.competitors?.[0]?.qualifier === 'home';
    
    if (isHome) {
      totalGoalsFor += homeScore;
      totalGoalsAgainst += awayScore;
    } else {
      totalGoalsFor += awayScore;
      totalGoalsAgainst += homeScore;
    }
    
    // BTTS check
    if (homeScore > 0 && awayScore > 0) {
      bttsCount++;
    }
    
    // Over 2.5 check
    if ((homeScore + awayScore) > 2.5) {
      over25Count++;
    }
  });
  
  const matchCount = recentMatches.length;
  
  return {
    avgGoalsFor: totalGoalsFor / matchCount,
    avgGoalsAgainst: totalGoalsAgainst / matchCount,
    recentMatches: matchCount,
    bttsPercentage: (bttsCount / matchCount) * 100,
    over25Percentage: (over25Count / matchCount) * 100
  };
}

export function getMatchPredictionFactors(prediction: PredictionResult, home: TeamForm, away: TeamForm): string[] {
  const factors: string[] = [];
  
  if (prediction.btts > 0.6) {
    factors.push(`High BTTS probability (${(prediction.btts * 100).toFixed(1)}%)`);
  }
  
  if (prediction.over2p5 > 0.6) {
    factors.push(`High Over 2.5 probability (${(prediction.over2p5 * 100).toFixed(1)}%)`);
  }
  
  if (home.bttsPercentage > 70 && away.bttsPercentage > 70) {
    factors.push('Both teams have strong BTTS records');
  }
  
  if (home.over25Percentage > 70 && away.over25Percentage > 70) {
    factors.push('Both teams involved in high-scoring games');
  }
  
  if (prediction.expectedGoalsTotal > 3.0) {
    factors.push(`High expected goals (${prediction.expectedGoalsTotal.toFixed(1)})`);
  }
  
  if (home.avgGoalsFor > 2.0 || away.avgGoalsFor > 2.0) {
    factors.push('Strong attacking teams');
  }
  
  return factors;
}