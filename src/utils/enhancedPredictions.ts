// Enhanced Prediction Engine based on Hungarian documentation
import { TeamForm, PredictionInput, PredictionResult } from '../types/sportradar';

// Enhanced team form interface with more detailed statistics
export interface EnhancedTeamForm extends TeamForm {
  shotsPerMatch: number;
  shotsOnTargetPerMatch: number;
  cornersPerMatch: number;
  possessionPercentage: number;
  homeAdvantage?: number;
  awayForm?: number;
  leagueStrength: number;
}

// Enhanced prediction result with more detailed analysis
export interface EnhancedPredictionResult extends PredictionResult {
  bttsFactors: {
    homeAttackStrength: number;
    awayAttackStrength: number;
    homeDefenseWeakness: number;
    awayDefenseWeakness: number;
    recentForm: number;
  };
  over25Factors: {
    expectedHomeGoals: number;
    expectedAwayGoals: number;
    leagueAverage: number;
    formFactor: number;
  };
  riskAssessment: 'low' | 'medium' | 'high';
  recommendedStake: number; // 0-1 scale
}

// Mathematical utilities for advanced calculations
const poissonProbability = (lambda: number, k: number): number => {
  if (k < 0) return 0;
  if (lambda <= 0) return k === 0 ? 1 : 0;
  
  let result = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    result *= lambda / i;
  }
  return result;
};

const calculatePoissonCDF = (lambda: number, k: number): number => {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += poissonProbability(lambda, i);
  }
  return sum;
};

// Enhanced BTTS prediction using multiple factors
export function calculateEnhancedBTTS(
  homeForm: EnhancedTeamForm,
  awayForm: EnhancedTeamForm,
  leagueAdjustment = 1.0
): { probability: number; factors: any; confidence: number } {
  // 1. Attack strength calculation (goals per match adjusted for opposition)
  const homeAttackStrength = homeForm.avgGoalsFor * leagueAdjustment;
  const awayAttackStrength = awayForm.avgGoalsFor * leagueAdjustment;
  
  // 2. Defense weakness (goals conceded per match)
  const homeDefenseWeakness = homeForm.avgGoalsAgainst;
  const awayDefenseWeakness = awayForm.avgGoalsAgainst;
  
  // 3. Expected goals for each team using Poisson model
  const lambdaHome = Math.max(0.1, (homeAttackStrength + awayDefenseWeakness) / 2);
  const lambdaAway = Math.max(0.1, (awayAttackStrength + homeDefenseWeakness) / 2);
  
  // 4. BTTS probability calculation: P(Home > 0) * P(Away > 0)
  const pHomeScores = 1 - poissonProbability(lambdaHome, 0);
  const pAwayScores = 1 - poissonProbability(lambdaAway, 0);
  const bttsBaseProbability = pHomeScores * pAwayScores;
  
  // 5. Form adjustment based on recent BTTS percentage
  const formFactor = (homeForm.bttsPercentage + awayForm.bttsPercentage) / 200; // Convert to 0-1
  const formWeight = 0.3;
  const baseWeight = 0.7;
  
  const adjustedBTTS = (bttsBaseProbability * baseWeight) + (formFactor * formWeight);
  
  // 6. Shot-based confidence adjustment
  const shotsFactor = Math.min(1, (homeForm.shotsPerMatch + awayForm.shotsPerMatch) / 20);
  const confidenceBoost = shotsFactor * 10;
  
  const factors = {
    homeAttackStrength,
    awayAttackStrength,
    homeDefenseWeakness,
    awayDefenseWeakness,
    recentForm: formFactor,
    shotsFactor,
    lambdaHome,
    lambdaAway
  };
  
  const confidence = Math.min(100, 50 + confidenceBoost + (homeForm.recentMatches * 2));
  
  return {
    probability: Math.max(0, Math.min(1, adjustedBTTS)),
    factors,
    confidence
  };
}

// Enhanced Over 2.5 prediction with Poisson distribution
export function calculateEnhancedOver25(
  homeForm: EnhancedTeamForm,
  awayForm: EnhancedTeamForm,
  leagueAdjustment = 1.0
): { probability: number; factors: any; confidence: number; expectedGoals: number } {
  // 1. Calculate expected goals using enhanced model
  const homeAttack = homeForm.avgGoalsFor * leagueAdjustment;
  const awayAttack = awayForm.avgGoalsFor * leagueAdjustment;
  const homeDefense = homeForm.avgGoalsAgainst;
  const awayDefense = awayForm.avgGoalsAgainst;
  
  // 2. Poisson parameters for each team
  const lambdaHome = Math.max(0.1, (homeAttack + awayDefense) / 2);
  const lambdaAway = Math.max(0.1, (awayAttack + homeDefense) / 2);
  
  // 3. Calculate P(Total Goals > 2.5) using Poisson distribution
  let pTotalLe2 = 0;
  for (let homeGoals = 0; homeGoals <= 5; homeGoals++) {
    for (let awayGoals = 0; awayGoals <= 5; awayGoals++) {
      if (homeGoals + awayGoals <= 2) {
        pTotalLe2 += poissonProbability(lambdaHome, homeGoals) * poissonProbability(lambdaAway, awayGoals);
      }
    }
  }
  
  const over25BaseProbability = 1 - pTotalLe2;
  
  // 4. Form adjustment based on recent Over 2.5 percentage
  const formFactor = (homeForm.over25Percentage + awayForm.over25Percentage) / 200;
  const formWeight = 0.25;
  const baseWeight = 0.75;
  
  const adjustedOver25 = (over25BaseProbability * baseWeight) + (formFactor * formWeight);
  
  // 5. League strength adjustment
  const leagueBonus = homeForm.leagueStrength > 0.8 ? 0.05 : 0;
  const finalProbability = Math.max(0, Math.min(1, adjustedOver25 + leagueBonus));
  
  const expectedGoals = lambdaHome + lambdaAway;
  
  const factors = {
    expectedHomeGoals: lambdaHome,
    expectedAwayGoals: lambdaAway,
    leagueAverage: (homeForm.avgGoalsFor + homeForm.avgGoalsAgainst + awayForm.avgGoalsFor + awayForm.avgGoalsAgainst) / 4,
    formFactor,
    leagueBonus
  };
  
  // Confidence based on data quality and prediction strength
  let confidence = 60;
  if (homeForm.recentMatches >= 10 && awayForm.recentMatches >= 10) confidence += 15;
  if (Math.abs(finalProbability - 0.5) > 0.2) confidence += 15;
  if (expectedGoals > 3.0 || expectedGoals < 2.0) confidence += 10;
  
  return {
    probability: finalProbability,
    factors,
    confidence: Math.min(100, confidence),
    expectedGoals
  };
}

// Combined prediction with risk assessment
export function calculateEnhancedPrediction(
  homeForm: EnhancedTeamForm,
  awayForm: EnhancedTeamForm,
  leagueAdjustment = 1.0
): EnhancedPredictionResult {
  const bttsResult = calculateEnhancedBTTS(homeForm, awayForm, leagueAdjustment);
  const over25Result = calculateEnhancedOver25(homeForm, awayForm, leagueAdjustment);
  
  // Risk assessment based on confidence and probability spread
  const avgConfidence = (bttsResult.confidence + over25Result.confidence) / 2;
  const probabilitySpread = Math.abs(bttsResult.probability - over25Result.probability);
  
  let riskAssessment: 'low' | 'medium' | 'high';
  if (avgConfidence > 80 && probabilitySpread < 0.3) {
    riskAssessment = 'low';
  } else if (avgConfidence > 60 && probabilitySpread < 0.5) {
    riskAssessment = 'medium';
  } else {
    riskAssessment = 'high';
  }
  
  // Recommended stake based on Kelly Criterion principles
  const edgeStrength = Math.max(bttsResult.probability, over25Result.probability) - 0.5;
  const recommendedStake = Math.max(0, Math.min(1, edgeStrength * (avgConfidence / 100)));
  
  return {
    btts: bttsResult.probability,
    over2p5: over25Result.probability,
    expectedGoalsTotal: over25Result.expectedGoals,
    confidence: avgConfidence,
    bttsFactors: bttsResult.factors,
    over25Factors: over25Result.factors,
    riskAssessment,
    recommendedStake
  };
}

// Team form calculator with enhanced statistics
export function calculateEnhancedTeamForm(
  recentMatches: any[],
  seasonStats?: any,
  leagueStrength = 0.7
): EnhancedTeamForm {
  if (!recentMatches || recentMatches.length === 0) {
    return {
      avgGoalsFor: 1.0,
      avgGoalsAgainst: 1.0,
      recentMatches: 0,
      bttsPercentage: 50,
      over25Percentage: 50,
      shotsPerMatch: 10,
      shotsOnTargetPerMatch: 4,
      cornersPerMatch: 5,
      possessionPercentage: 50,
      leagueStrength
    };
  }
  
  let totalGoalsFor = 0;
  let totalGoalsAgainst = 0;
  let totalShots = 0;
  let totalShotsOnTarget = 0;
  let totalCorners = 0;
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
    
    // Extract statistics if available
    const stats = match.statistics?.totals?.competitors?.find((c: any) => 
      isHome ? c.qualifier === 'home' : c.qualifier === 'away'
    );
    
    if (stats) {
      totalShots += stats.statistics?.shots_total || 0;
      totalShotsOnTarget += stats.statistics?.shots_on_target || 0;
      totalCorners += stats.statistics?.corner_kicks || 0;
    }
    
    // BTTS and Over 2.5 checks
    if (homeScore > 0 && awayScore > 0) bttsCount++;
    if ((homeScore + awayScore) > 2.5) over25Count++;
  });
  
  const matchCount = recentMatches.length;
  
  return {
    avgGoalsFor: totalGoalsFor / matchCount,
    avgGoalsAgainst: totalGoalsAgainst / matchCount,
    recentMatches: matchCount,
    bttsPercentage: (bttsCount / matchCount) * 100,
    over25Percentage: (over25Count / matchCount) * 100,
    shotsPerMatch: totalShots / matchCount,
    shotsOnTargetPerMatch: totalShotsOnTarget / matchCount,
    cornersPerMatch: totalCorners / matchCount,
    possessionPercentage: seasonStats?.average_ball_possession || 50,
    leagueStrength
  };
}

// Prediction validation and quality scoring
export function validatePredictionQuality(
  homeForm: EnhancedTeamForm,
  awayForm: EnhancedTeamForm
): { isValid: boolean; quality: 'low' | 'medium' | 'high'; warnings: string[] } {
  const warnings: string[] = [];
  let qualityScore = 100;
  
  // Check sample size
  if (homeForm.recentMatches < 5 || awayForm.recentMatches < 5) {
    warnings.push('Insufficient recent match data (< 5 matches)');
    qualityScore -= 30;
  }
  
  // Check for extreme values that might indicate data issues
  if (homeForm.avgGoalsFor > 5 || awayForm.avgGoalsFor > 5) {
    warnings.push('Unusually high goals per match detected');
    qualityScore -= 20;
  }
  
  if (homeForm.avgGoalsAgainst > 5 || awayForm.avgGoalsAgainst > 5) {
    warnings.push('Unusually high goals conceded detected');
    qualityScore -= 20;
  }
  
  // Check for missing statistics
  if (!homeForm.shotsPerMatch || !awayForm.shotsPerMatch) {
    warnings.push('Missing shot statistics');
    qualityScore -= 15;
  }
  
  let quality: 'low' | 'medium' | 'high';
  if (qualityScore >= 80) quality = 'high';
  else if (qualityScore >= 60) quality = 'medium';
  else quality = 'low';
  
  return {
    isValid: qualityScore >= 40,
    quality,
    warnings
  };
}

// Prediction comparison with historical accuracy
export function comparePredictionWithHistory(
  prediction: EnhancedPredictionResult,
  historicalData?: Array<{ btts: boolean; over25: boolean; confidence: number }>
): { adjustedConfidence: number; historicalAccuracy?: number } {
  if (!historicalData || historicalData.length === 0) {
    return { adjustedConfidence: prediction.confidence };
  }
  
  // Calculate historical accuracy for similar confidence levels
  const similarPredictions = historicalData.filter(
    h => Math.abs(h.confidence - prediction.confidence) <= 10
  );
  
  if (similarPredictions.length === 0) {
    return { adjustedConfidence: prediction.confidence };
  }
  
  const bttsCorrect = similarPredictions.filter(h => 
    (prediction.btts > 0.5) === h.btts
  ).length;
  
  const over25Correct = similarPredictions.filter(h => 
    (prediction.over2p5 > 0.5) === h.over25
  ).length;
  
  const historicalAccuracy = ((bttsCorrect + over25Correct) / (similarPredictions.length * 2)) * 100;
  
  // Adjust confidence based on historical performance
  const adjustmentFactor = (historicalAccuracy - 50) / 50; // -1 to 1
  const adjustedConfidence = Math.max(0, Math.min(100, 
    prediction.confidence + (adjustmentFactor * 20)
  ));
  
  return {
    adjustedConfidence,
    historicalAccuracy
  };
}