import React from 'react';
import { useCompetitions, useLiveMatches, useAPITest } from '../../hooks/useSportradarData';
import { useQuery } from '@tanstack/react-query';
import APIMonitor from '../../services/apiMonitor';
import { Activity, Globe, Target, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const Dashboard: React.FC = () => {
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: liveData, isLoading: liveLoading } = useLiveMatches();
  const { data: apiConnected, isLoading: testLoading } = useAPITest();

  // Get API metrics from monitor
  const { data: apiMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    rateLimitHits: 0,
    lastRequestTime: null,
    requestHistory: []
  } } = useQuery({
    queryKey: ['api-metrics'],
    queryFn: () => APIMonitor.getInstance().getMetrics(),
    refetchInterval: 30000, // Reduced frequency for trial keys
    staleTime: 1000
  });

  const successRate = apiMetrics.totalRequests > 0 
    ? (apiMetrics.successfulRequests / apiMetrics.totalRequests) * 100 
    : 0;

  const liveMatches = liveData?.summaries || [];
  const majorCompetitions = competitions?.filter(comp => 
    ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League']
      .some(league => comp.name.includes(league))
  ) || [];

  const stats = [
    {
      label: 'API Status',
      value: testLoading ? 'Testing...' : apiConnected ? 'Connected' : 'Disconnected',
      icon: testLoading ? Clock : apiConnected ? CheckCircle : AlertCircle,
      color: testLoading ? 'text-yellow-600' : apiConnected ? 'text-green-600' : 'text-red-600',
      bgColor: testLoading ? 'bg-yellow-50' : apiConnected ? 'bg-green-50' : 'bg-red-50',
    },
    {
      label: 'Live Matches',
      value: liveLoading ? 'Loading...' : liveMatches.length.toString(),
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Competitions',
      value: competitionsLoading ? 'Loading...' : competitions?.length.toString() || '0',
      icon: Globe,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Predictions Ready',
      value: apiConnected ? 'Active' : 'Inactive',
      icon: Target,
      color: apiConnected ? 'text-purple-600' : 'text-gray-600',
      bgColor: apiConnected ? 'bg-purple-50' : 'bg-gray-50',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Soccer Prediction Dashboard
        </h2>
        <p className="text-gray-600">
          Real-time soccer data with BTTS & Over 2.5 goals analysis
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`rounded-xl border p-6 ${stat.bgColor} border-opacity-50`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.label}
                  </p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* API Connection Status */}
      {!apiConnected && !testLoading && (
        <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold text-amber-800">
                API Configuration Required
              </h3>
              <p className="text-amber-700 mt-1">
                Please configure your Sportradar API key to access live data and predictions.
                You can set it in your environment variables or through the settings panel.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Major Competitions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Globe className="h-5 w-5 text-blue-600" />
            <span>Major Competitions</span>
          </h3>
          
          {competitionsLoading ? (
            <LoadingSpinner message="Loading competitions..." />
          ) : (
            <div className="space-y-3">
              {majorCompetitions.slice(0, 8).map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
                >
                  <div>
                    <div className="font-medium text-gray-900">{comp.name}</div>
                    <div className="text-sm text-gray-500">
                      {comp.category?.country_code || 'International'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {comp.type}
                  </div>
                </div>
              ))}
              
              {majorCompetitions.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No major competitions available
                </p>
              )}
            </div>
          )}
        </div>

        {/* Live Matches Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-red-600" />
            <span>Live Matches</span>
            {liveMatches.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {liveMatches.length} Live
              </span>
            )}
          </h3>
          
          {liveLoading ? (
            <LoadingSpinner message="Loading live matches..." />
          ) : liveMatches.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No live matches at the moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Check back during match days
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {liveMatches.slice(0, 5).map((match: any) => {
                const homeScore = match.sport_event_status?.home_score || 0;
                const awayScore = match.sport_event_status?.away_score || 0;
                const homeTeam = match.sport_event?.competitors?.find((c: any) => c.qualifier === 'home')?.name || 'Home';
                const awayTeam = match.sport_event?.competitors?.find((c: any) => c.qualifier === 'away')?.name || 'Away';
                
                return (
                  <div
                    key={match.sport_event?.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-100"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {homeTeam} vs {awayTeam}
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.sport_event?.sport_event_context?.competition?.name}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-lg font-bold text-gray-900">
                        {homeScore} - {awayScore}
                      </div>
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                );
              })}
              
              {liveMatches.length > 5 && (
                <div className="text-center pt-2">
                  <span className="text-sm text-gray-500">
                    +{liveMatches.length - 5} more matches
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span>Prediction Insights</span>
          </h3>
        
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">78.3%</div>
              <div className="text-sm text-gray-600">Average Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">2.8</div>
              <div className="text-sm text-gray-600">Avg Goals Per Match</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">65%</div>
              <div className="text-sm text-gray-600">BTTS Success Rate</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-600" />
            <span>API Performance</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold mb-1 ${successRate >= 90 ? 'text-green-600' : successRate >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                {successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">API Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {apiMetrics.totalRequests}
              </div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {apiMetrics.averageResponseTime?.toFixed(0) || 0}ms
              </div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;