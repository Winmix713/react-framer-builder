import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback } from 'react';
import { getAPIInstance } from '../services/sportradarAPI';
import APIMonitor from '../services/apiMonitor';
import { format } from 'date-fns';
import { TransformedMatch, MatchSummary } from '../types/sportradar';

// Environment configuration
const isDevelopment = import.meta.env.MODE === 'development';

// Custom hook to detect page visibility
const usePageVisibility = (): boolean => {
  const [isVisible, setIsVisible] = useState(() => 
    typeof document !== 'undefined' ? !document.visibilityState.includes('hidden') : true
  );
  
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      setIsVisible(!document.visibilityState.includes('hidden'));
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
};

// Custom hook to detect online status
const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
};

// Optimized API key management
const getApiKey = (): string | undefined => {
  const envKey = import.meta.env.VITE_SPORTRADAR_API_KEY;
  const localStorageKey = typeof window !== 'undefined' 
    ? localStorage.getItem('sportradar_api_key') 
    : null;
  
  const apiKey = localStorageKey || envKey;
  
  if (isDevelopment) {
    console.log('🔑 API Key Debug:', {
      hasLocalStorageKey: !!localStorageKey,
      hasEnvKey: !!envKey,
      envKeyLength: envKey?.length || 0,
      envKeyPreview: envKey ? `${envKey.substring(0, 8)}...${envKey.substring(envKey.length - 4)}` : 'None',
      finalKeyLength: apiKey?.length || 0,
      finalKeyPreview: apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'None',
      timestamp: new Date().toISOString()
    });
  }
  
  // Validate API key format
  if (apiKey && apiKey.length < 20) {
    console.error('🚨 Invalid API key format detected');
    return undefined;
  }
  
  return apiKey;
};

// Query configuration objects for reusability
export const getQueryConfigs = (apiKey?: string) => ({
  liveMatches: {
    queryKey: ['live-matches', { apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getLiveSummaries(),
    enabled: !!apiKey,
    staleTime: 10 * 60 * 1000, // 10 minutes - extended for trial API
    retry: 3,
  },
  
  competitions: {
    queryKey: ['competitions', { apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getCompetitions(),
    enabled: !!apiKey,
    staleTime: 2 * 60 * 60 * 1000, // 2 hours for trial keys
    gcTime: 2 * 60 * 60 * 1000, // 2 hours for trial keys
    retry: 2,
    select: (data: any) => data.competitions,
  },
  
  dailyMatches: (dateStr: string) => ({
    queryKey: ['daily-matches', { date: dateStr, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getDailySummaries(dateStr),
    enabled: !!apiKey,
    staleTime: 8 * 60 * 60 * 1000, // 8 hours for trial keys
    gcTime: 8 * 60 * 60 * 1000, // 8 hours for trial keys
    retry: 2,
  }),
  
  matchSummary: (matchId: string) => ({
    queryKey: ['match-summary', { matchId, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getMatchSummary(matchId),
    enabled: !!apiKey && !!matchId,
    staleTime: 5 * 60 * 1000, // 5 minutes for trial keys
    retry: 2,
  }),
  
  seasonSchedule: (seasonId: string) => ({
    queryKey: ['season-schedule', { seasonId, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getSeasonSchedule(seasonId),
    enabled: !!apiKey && !!seasonId,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    select: (data: any) => data.sport_events,
  }),
  
  seasonStandings: (seasonId: string) => ({
    queryKey: ['season-standings', { seasonId, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getSeasonStandings(seasonId),
    enabled: !!apiKey && !!seasonId,
    staleTime: 4 * 60 * 60 * 1000, // 4 hours for trial keys
    gcTime: 4 * 60 * 60 * 1000, // 4 hours for trial keys
    retry: 2,
  }),
  
  seasonOverUnder: (seasonId: string) => ({
    queryKey: ['season-over-under', { seasonId, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getSeasonOverUnderStats(seasonId),
    enabled: !!apiKey && !!seasonId,
    staleTime: 12 * 60 * 60 * 1000, // 12 hours
    gcTime: 12 * 60 * 60 * 1000, // 12 hours
    retry: 2,
    select: (data: any) => data.season_over_under_statistics,
  }),
  
  headToHead: (homeId: string, awayId: string) => ({
    queryKey: ['head-to-head', { homeId, awayId, apiKey }],
    queryFn: () => getAPIInstance(apiKey!).getCompetitorVsCompetitor(homeId, awayId),
    enabled: !!apiKey && !!homeId && !!awayId,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  }),
  
  apiTest: {
    queryKey: ['api-test', { apiKey }],
    queryFn: () => getAPIInstance(apiKey!).testConnection(),
    enabled: !!apiKey,
    retry: 0, // No retries for API test to prevent rate limit abuse
    staleTime: 30 * 60 * 1000, // 30 minutes for trial keys
    gcTime: 30 * 60 * 1000, // 30 minutes for trial keys
  },
});

// Enhanced error handler
const createErrorHandler = (context: string) => (error: Error) => {
  if (isDevelopment) {
    console.error(`${context} fetch error:`, error);
  }
  // Itt további hibakezelési logika lehet (toast, logging service, stb.)
};

// Enhanced hooks with optimized polling and error handling
export const useLiveMatches = (enablePolling = true) => {
  const isVisible = usePageVisibility();
  const isOnline = useOnlineStatus();
  const apiKey = getApiKey();
  
  // Disable all automatic polling for trial API
  const config = getQueryConfigs(apiKey).liveMatches;
  
  return useQuery({
    ...config,
    refetchInterval: false, // Disabled for trial API
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Allow initial mount
    refetchOnReconnect: false,
    
  });
};

export const useCompetitions = () => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).competitions;
  
  return useQuery({
    ...config,
    
  });
};

export const useDailyMatches = (date: Date) => {
  const dateStr = format(date, 'yyyy-MM-dd');
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).dailyMatches(dateStr);
  
  return useQuery({
    ...config,
    
  });
};

export const useScheduledMatches = (dateISO: string) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).dailyMatches(dateISO);
  
  return useQuery({
    ...config,
    enabled: !!apiKey && !!dateISO,
    
  });
};

export const useMatchSummary = (matchId: string, enablePolling = true) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).matchSummary(matchId);
  
  return useQuery({
    ...config,
    refetchInterval: enablePolling ? 30000 : undefined, // 30 seconds for live matches
    
  });
};

export const useSeasonSchedule = (seasonId: string) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).seasonSchedule(seasonId);
  
  return useQuery({
    ...config,
    
  });
};

export const useSeasonStandings = (seasonId: string) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).seasonStandings(seasonId);
  
  return useQuery({
    ...config,
    
  });
};

export const useSeasonOverUnder = (seasonId: string) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).seasonOverUnder(seasonId);
  
  return useQuery({
    ...config,
    
  });
};

export const useHeadToHead = (homeId: string, awayId: string) => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).headToHead(homeId, awayId);
  
  return useQuery({
    ...config,
    
  });
};

export const useAPITest = () => {
  const apiKey = getApiKey();
  const config = getQueryConfigs(apiKey).apiTest;
  
  return useQuery({
    ...config,
    
  });
};

// Type-safe match status mapping
const MATCH_STATUS_MAP = {
  live: new Set(['live', '1st_half', '2nd_half', 'overtime', 'penalties']),
  finished: new Set(['closed', 'ended', 'aet', 'ft']),
} as const;

const mapMatchStatus = (status?: string): 'live' | 'scheduled' | 'finished' => {
  if (!status) return 'scheduled';
  
  if (MATCH_STATUS_MAP.live.has(status)) return 'live';
  if (MATCH_STATUS_MAP.finished.has(status)) return 'finished';
  return 'scheduled';
};

// Enhanced utility function with proper typing
export const transformMatchData = (match: MatchSummary): TransformedMatch => {
  const competitors = match.sport_event?.competitors || [];
  const home = competitors.find(c => c.qualifier === 'home');
  const away = competitors.find(c => c.qualifier === 'away');
  
  const homeScore = match.sport_event_status?.home_score;
  const awayScore = match.sport_event_status?.away_score;
  const status = match.sport_event_status?.status;
  
  return {
    id: match.sport_event?.id || '',
    homeTeam: home?.name || 'TBD',
    awayTeam: away?.name || 'TBD',
    homeScore,
    awayScore,
    status: mapMatchStatus(status),
    time: match.sport_event?.start_time || new Date().toISOString(),
    competition: match.sport_event?.sport_event_context?.competition?.name || 'Unknown',
    venue: match.sport_event?.venue 
      ? `${match.sport_event.venue.name}, ${match.sport_event.venue.city_name}`
      : undefined,
  };
};

// Hook for invalidating specific queries
export const useQueryInvalidation = () => {
  const queryClient = useQueryClient();
  
  const invalidateQueries = (queryKeys: string[]) => {
    queryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };
  
  const invalidateLiveData = () => {
    invalidateQueries(['live-matches', 'match-summary']);
  };
  
  return { invalidateQueries, invalidateLiveData };
};