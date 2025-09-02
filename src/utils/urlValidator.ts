// URL validation utility for Sportradar API endpoints
// This helps prevent 404 errors by validating endpoint structure before requests

export interface EndpointValidation {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

// Sportradar API endpoint patterns
const SPORTRADAR_PATTERNS = {
  competitions: /^\/competitions\.json$/,
  competitionInfo: /^\/soccer\/trial\/v4\/en\/competitions\/[^\/]+\/info\.json$/,
  liveMatches: /^\/soccer\/trial\/v4\/en\/sport_events\/live\/summaries\.json$/,
  dailySchedule: /^\/soccer\/trial\/v4\/en\/schedules\/\d{4}-\d{2}-\d{2}\/summaries\.json$/,
  matchSummary: /^\/soccer\/trial\/v4\/en\/sport_events\/[^\/]+\/summary\.json$/,
  seasonSchedule: /^\/soccer\/trial\/v4\/en\/seasons\/[^\/]+\/schedules\.json$/,
  seasonStandings: /^\/soccer\/trial\/v4\/en\/seasons\/[^\/]+\/standings\.json$/,
  seasonStatistics: /^\/soccer\/trial\/v4\/en\/seasons\/[^\/]+\/statistics\.json$/,
  headToHead: /^\/soccer\/trial\/v4\/en\/competitors\/[^\/]+\/versus\/[^\/]+\/matches\.json$/,
};

// Common endpoint corrections
const ENDPOINT_CORRECTIONS = {
  '/summaries.json': '/soccer/trial/v4/en/sport_events/live/summaries.json',
  '/sport_event/live/summaries.json': '/soccer/trial/v4/en/sport_events/live/summaries.json',
  '/schedules/live/summaries.json': '/soccer/trial/v4/en/sport_events/live/summaries.json',
  '/competition.json': '/soccer/trial/v4/en/competitions.json',
  '/live/summaries.json': '/soccer/trial/v4/en/sport_events/live/summaries.json',
};

/**
 * Validates a Sportradar API endpoint URL structure
 * @param endpoint - The endpoint path to validate
 * @returns Validation result with suggestions if invalid
 */
export function validateSportradarEndpoint(endpoint: string): EndpointValidation {
  // Check if endpoint matches any known pattern
  for (const [name, pattern] of Object.entries(SPORTRADAR_PATTERNS)) {
    if (pattern.test(endpoint)) {
      return { isValid: true };
    }
  }

  // Check for common corrections
  const correction = ENDPOINT_CORRECTIONS[endpoint as keyof typeof ENDPOINT_CORRECTIONS];
  if (correction) {
    return {
      isValid: false,
      error: `Invalid endpoint: ${endpoint}`,
      suggestion: `Did you mean: ${correction}?`
    };
  }

  // Check for common mistakes
  if (endpoint.includes('/sport_event/') && !endpoint.includes('/sport_events/')) {
    return {
      isValid: false,
      error: 'Resource name should be plural',
      suggestion: endpoint.replace('/sport_event/', '/sport_events/')
    };
  }

  if (!endpoint.endsWith('.json')) {
    return {
      isValid: false,
      error: 'Endpoint must end with .json',
      suggestion: `${endpoint}.json`
    };
  }

  return {
    isValid: false,
    error: `Unknown endpoint pattern: ${endpoint}`,
    suggestion: 'Check Sportradar API documentation for valid endpoints'
  };
}

/**
 * Validates base URL format for Sportradar API
 * @param baseURL - The base URL to validate
 * @returns Validation result
 */
export function validateBaseURL(baseURL: string): EndpointValidation {
  const validPatterns = [
    /^\/api\/sportradar\/soccer\/trial\/v4\/en$/, // Development proxy
    /^https:\/\/api\.sportradar\.com\/soccer\/trial\/v4\/en$/, // Production
    /^https:\/\/api\.sportradar\.com\/soccer\/production\/v4\/en$/, // Production (paid)
  ];

  const isValid = validPatterns.some(pattern => pattern.test(baseURL));

  if (!isValid) {
    return {
      isValid: false,
      error: `Invalid base URL format: ${baseURL}`,
      suggestion: 'Expected format: https://api.sportradar.com/soccer/trial/v4/en or /api/sportradar/soccer/trial/v4/en (for proxy)'
    };
  }

  return { isValid: true };
}

/**
 * Logs endpoint validation results in development mode
 * @param endpoint - The endpoint being validated
 * @param validation - The validation result
 */
export function logEndpointValidation(endpoint: string, validation: EndpointValidation): void {
  if (import.meta.env.MODE !== 'development') return;

  if (validation.isValid) {
    console.log('✅ Endpoint validation passed:', endpoint);
  } else {
    console.warn('⚠️ Endpoint validation failed:', {
      endpoint,
      error: validation.error,
      suggestion: validation.suggestion,
      timestamp: new Date().toISOString()
    });
  }
}