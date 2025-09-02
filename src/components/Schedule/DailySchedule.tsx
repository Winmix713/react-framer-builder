import React, { useState } from 'react';
import { useScheduledMatches } from '../../hooks/useSportradarData';
import { predictBTTSAndOver2p5, calculateTeamForm, getMatchPredictionFactors } from '../../utils/predictions';
import PredictionBadge from '../Predictions/PredictionBadge';
import { Calendar, Clock, MapPin, Target, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DailySchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: dailyData, isLoading, error } = useScheduledMatches(dateStr);

  const matches = dailyData?.summaries || [];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(new Date(e.target.value));
  };

  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Schedule
          </h3>
          <p className="text-red-600">
            Unable to fetch daily schedule. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Daily Schedule</h2>
          <p className="text-gray-600">
            Analyze matches for BTTS & Over 2.5 goals opportunities
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={format(selectedDate, 'yyyy-MM-dd')}
            onChange={handleDateChange}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="animate-pulse">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Matches Scheduled
          </h3>
          <p className="text-gray-600">
            No matches found for {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map((match: any) => {
            // Create mock team form data for demonstration
            // In production, this would come from recent match analysis
            const homeForm = calculateTeamForm([]);
            const awayForm = calculateTeamForm([]);
            const prediction = predictBTTSAndOver2p5({ 
              home: homeForm, 
              away: awayForm,
              leagueAdjustment: 1.0 
            });
            const factors = getMatchPredictionFactors(prediction, homeForm, awayForm);
            
            const startTime = match.sport_event?.start_time ? 
              format(parseISO(match.sport_event.start_time), 'HH:mm') : 'TBD';
            const isFinished = match.sport_event_status?.status === 'ended';
            const homeScore = match.sport_event_status?.home_score || 0;
            const awayScore = match.sport_event_status?.away_score || 0;

            const getStatusColor = () => {
              switch (match.sport_event_status?.status) {
                case 'live': return 'text-red-600 bg-red-50';
                case 'ended': return 'text-green-600 bg-green-50';
                case 'postponed': return 'text-yellow-600 bg-yellow-50';
                case 'cancelled': return 'text-gray-600 bg-gray-50';
                default: return 'text-blue-600 bg-blue-50';
              }
            };

            return (
              <div
                key={match.sport_event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-medium text-gray-900">
                      {match.sport_event.sport_event_context?.competition?.name}
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                      {match.sport_event_status?.status?.toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6">
                    <div className="flex-1">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {match.sport_event.competitors?.[0]?.name}
                      </div>
                      <div className="text-sm text-gray-500">Home</div>
                    </div>
                    
                    <div className="flex items-center space-x-4 mx-6">
                      {isFinished || match.sport_event_status?.status === 'live' ? (
                        <>
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
                        </>
                      ) : (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{startTime}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 text-right">
                      <div className="text-lg font-semibold text-gray-900 mb-1">
                        {match.sport_event.competitors?.[1]?.name}
                      </div>
                      <div className="text-sm text-gray-500">Away</div>
                    </div>
                  </div>

                  {match.sport_event.venue && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                      <MapPin className="h-4 w-4" />
                      <span>{match.sport_event.venue.name}, {match.sport_event.venue.city_name}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PredictionBadge prediction={prediction} showDetails />

                      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-gray-600">Goals Status</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {homeScore + awayScore} Total
                        </div>
                        <div className={`text-sm mt-1 ${
                          (homeScore + awayScore) > 2.5 ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {(homeScore + awayScore) > 2.5 ? 'Over 2.5 ✓' : 'Under 2.5'}
                        </div>
                      </div>
                    </div>

                    {factors.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {factors.slice(0, 3).map((factor, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
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

export default DailySchedule;