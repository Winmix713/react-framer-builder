import React from 'react';
import { Target, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { EnhancedPredictionResult } from '../../utils/enhancedPredictions';

interface EnhancedPredictionCardProps {
  prediction: EnhancedPredictionResult;
  homeTeam: string;
  awayTeam: string;
  showAdvancedMetrics?: boolean;
}

const EnhancedPredictionCard: React.FC<EnhancedPredictionCardProps> = ({
  prediction,
  homeTeam,
  awayTeam,
  showAdvancedMetrics = false
}) => {
  const bttsPercentage = Math.round(prediction.btts * 100);
  const over25Percentage = Math.round(prediction.over2p5 * 100);
  const stakePercentage = Math.round(prediction.recommendedStake * 100);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-700 bg-green-100 border-green-200';
      case 'medium': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'high': return 'text-red-700 bg-red-100 border-red-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'bg-green-500';
    if (probability >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            {homeTeam} vs {awayTeam}
          </h3>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(prediction.riskAssessment)}`}>
          {prediction.riskAssessment.toUpperCase()} RISK
        </div>
      </div>

      {/* Main Predictions */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-white ${getProbabilityColor(prediction.btts)}`}>
            BTTS {bttsPercentage}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Both Teams Score</div>
        </div>
        <div className="text-center">
          <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold text-white ${getProbabilityColor(prediction.over2p5)}`}>
            O2.5 {over25Percentage}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Over 2.5 Goals</div>
        </div>
      </div>

      {/* Confidence and Expected Goals */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <div className={`text-lg font-bold ${getConfidenceColor(prediction.confidence)}`}>
            {prediction.confidence}%
          </div>
          <div className="text-xs text-gray-600">Confidence</div>
        </div>
        <div>
          <div className="text-lg font-bold text-gray-900">
            {prediction.expectedGoalsTotal.toFixed(1)}
          </div>
          <div className="text-xs text-gray-600">Expected Goals</div>
        </div>
        <div>
          <div className="text-lg font-bold text-purple-600">
            {stakePercentage}%
          </div>
          <div className="text-xs text-gray-600">Recommended Stake</div>
        </div>
      </div>

      {showAdvancedMetrics && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-1">
            <Info className="h-4 w-4" />
            <span>Advanced Metrics</span>
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <div className="font-medium text-gray-700">BTTS Factors:</div>
              <div className="space-y-1 text-gray-600">
                <div>Home Attack: {prediction.bttsFactors.homeAttackStrength.toFixed(2)}</div>
                <div>Away Attack: {prediction.bttsFactors.awayAttackStrength.toFixed(2)}</div>
                <div>Recent Form: {(prediction.bttsFactors.recentForm * 100).toFixed(1)}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-gray-700">Over 2.5 Factors:</div>
              <div className="space-y-1 text-gray-600">
                <div>Expected Home: {prediction.over25Factors.expectedHomeGoals.toFixed(2)}</div>
                <div>Expected Away: {prediction.over25Factors.expectedAwayGoals.toFixed(2)}</div>
                <div>League Avg: {prediction.over25Factors.leagueAverage.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedPredictionCard;