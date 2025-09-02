import React, { useState } from 'react';
import { useSeasonStandings, useCompetitions } from '../../hooks/useSportradarData';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';

const StandingsTable: React.FC = () => {
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  
  const { data: competitions, isLoading: competitionsLoading } = useCompetitions();
  const { data: standingsData, isLoading: standingsLoading, error } = useSeasonStandings(selectedSeason);

  // Filter to major European competitions
  const majorCompetitions = competitions?.filter(comp => 
    ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League']
      .some(league => comp.name.includes(league))
  ) || [];

  const standings = standingsData?.standings?.[0]?.groups?.[0]?.group_standings || [];

  const getPositionIcon = (change?: number) => {
    if (!change || change === 0) return <Minus className="h-3 w-3 text-gray-400" />;
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-500" />;
    return <TrendingDown className="h-3 w-3 text-red-500" />;
  };

  const getPositionColor = (rank: number) => {
    if (rank <= 4) return 'bg-green-50 border-l-4 border-green-500';
    if (rank <= 6) return 'bg-blue-50 border-l-4 border-blue-500';
    if (rank >= standings.length - 2) return 'bg-red-50 border-l-4 border-red-500';
    return 'bg-white';
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Standings
          </h3>
          <p className="text-red-600">
            Unable to fetch standings data. Please check your API configuration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">League Standings</h2>
        <p className="text-gray-600">
          Current league positions and team performance statistics
        </p>
      </div>

      {/* Competition Selection */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Competition
          </label>
          <select
            value={selectedCompetition}
            onChange={(e) => {
              setSelectedCompetition(e.target.value);
              setSelectedSeason(''); // Reset season when competition changes
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={competitionsLoading}
          >
            <option value="">Choose a competition...</option>
            {majorCompetitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.name} ({comp.category?.country_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Season ID (Manual Entry)
          </label>
          <input
            type="text"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            placeholder="Enter season ID (e.g., sr:season:118689)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {!selectedSeason ? (
        <div className="bg-blue-50 rounded-xl p-8 text-center">
          <Trophy className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Select a Competition and Season
          </h3>
          <p className="text-gray-600">
            Choose a competition and enter a season ID to view the current standings
          </p>
        </div>
      ) : standingsLoading ? (
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <LoadingSpinner size="lg" message="Loading standings..." />
        </div>
      ) : standings.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Standings Available
          </h3>
          <p className="text-gray-600">
            Standings data is not available for this season or competition
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {standingsData?.standings?.[0]?.groups?.[0]?.name || 'League Table'}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    W
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    D
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    L
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GF
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GA
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GD
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((team: any, index: number) => (
                  <tr
                    key={team.competitor.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${getPositionColor(team.rank)}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-gray-900">
                          {team.rank}
                        </span>
                        {getPositionIcon(team.change)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {team.competitor.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {team.competitor.abbreviation}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.played}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                      {team.win}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-yellow-600 font-medium">
                      {team.draw}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">
                      {team.loss}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.goals_for}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {team.goals_against}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                      <span className={`font-medium ${
                        team.goal_difference > 0 ? 'text-green-600' : 
                        team.goal_difference < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {team.goal_difference > 0 ? '+' : ''}{team.goal_difference}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {team.points}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Champions League</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Europa League</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Relegation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StandingsTable;