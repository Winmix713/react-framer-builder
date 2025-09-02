import React from 'react';
import { Target, TrendingUp } from 'lucide-react';
import { PredictionResult } from '../../types/sportradar';

interface PredictionBadgeProps {
  prediction: PredictionResult;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const PredictionBadge: React.FC<PredictionBadgeProps> = ({ 
  prediction, 
  size = 'md', 
  showDetails = false 
}) => {
  const bttsPercentage = Math.round(prediction.btts * 100);
  const over25Percentage = Math.round(prediction.over2p5 * 100);
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 60) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getBTTSColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getOver25Color = (percentage: number) => {
    if (percentage >= 70) return 'bg-purple-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3'
  };

  if (size === 'sm') {
    return (
      <div className="flex items-center space-x-2">
        <div className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${getBTTSColor(bttsPercentage)} text-white font-medium`}>
          BTTS {bttsPercentage}%
        </div>
        <div className={`inline-flex items-center rounded-full ${sizeClasses[size]} ${getOver25Color(over25Percentage)} text-white font-medium`}>
          O2.5 {over25Percentage}%
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${getConfidenceColor(prediction.confidence)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4" />
          <span className="font-semibold">Prediction</span>
        </div>
        <span className="text-sm font-bold">
          {prediction.confidence}% Confidence
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center">
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getBTTSColor(bttsPercentage)} text-white`}>
            BTTS {bttsPercentage}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Both Teams Score</div>
        </div>
        <div className="text-center">
          <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${getOver25Color(over25Percentage)} text-white`}>
            O2.5 {over25Percentage}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Over 2.5 Goals</div>
        </div>
      </div>

      {showDetails && (
        <div className="border-t pt-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <TrendingUp className="h-3 w-3" />
            <span>Expected Goals: {prediction.expectedGoalsTotal.toFixed(1)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PredictionBadge;