import React from 'react';
import { useLiveMatches } from '../../hooks/useSportradarData';
import { predictBTTSAndOver2p5, calculateTeamForm, getMatchPredictionFactors } from '../../utils/predictions';
import PredictionBadge from '../Predictions/PredictionBadge';
import { Activity, Clock, Target, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const LiveMatches: React.FC = () => {
  const { data: liveData, isLoading, error } = useLiveMatches();

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Matches</h2>
          <p className="text-gray-600">Loading current live matches...</p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Live Data
          </h3>
          <p className="text-red-600">
            Unable to fetch live match data. Please check your API configuration.
          </p>
        </div>
      </div>
    );
  }

  const liveMatches = liveData?.summaries || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Live Matches</h2>
          <p className="text-gray-600">
            Real-time match analysis with BTTS & Over 2.5 predictions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          <span>Auto-updating every 30 seconds</span>
        </div>
      </div>

      {liveMatches.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Live Matches
          </h3>
          <p className="text-gray-600">
            There are currently no live matches. Check back during match days.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {liveMatches.map((match: any) => {
            // Create mock team form data for demonstration
            const homeForm = calculateTeamForm([]);
            const awayForm = calculateTeamForm([]);
            const prediction = predictBTTSAndOver2p5({ 
              home: homeForm, 
              away: awayForm,
              leagueAdjustment: 1.0 
            });
            const factors = getMatchPredictionFactors(prediction, homeForm, awayForm);
            
            const homeScore = match.sport_event_status?.home_score || 0;
            const awayScore = match.sport_event_status?.away_score || 0;
            const totalGoals = homeScore + awayScore;
            const matchStatus = match.sport_event_status?.match_status || '';

            const getConfidenceColor = (score: number) => {
              if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
              if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
              return 'text-red-600 bg-red-50 border-red-200';
            };

            return (
              <div
                key={match.sport_event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                      {match.sport_event.sport_event_context?.competition?.name}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-red-600">LIVE</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {matchStatus}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900">
                        {match.sport_event.competitors?.[0]?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Home
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mx-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {homeScore}
                        </div>
                      </div>
                      <div className="text-2xl font-light text-gray-400">-</div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-gray-900">
                          {awayScore}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {match.sport_event.competitors?.[1]?.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Away
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PredictionBadge prediction={prediction} showDetails />

                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-600">Total Goals</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {totalGoals}
                        </div>
                        <div className="text-sm text-gray-500">
                          {totalGoals > 2.5 ? 'Over 2.5 ✓' : 'Under 2.5'}
                        </div>
                      </div>
                    </div>

                    {factors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Analysis Factors:
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {factors.map((factor, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveMatches;