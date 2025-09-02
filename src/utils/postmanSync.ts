// Postman integration utilities
export interface PostmanEnvironment {
  base_url: string;
  api_key: string;
  soccer_version: string;
  locale: string;
  access_level: 'trial' | 'production';
  competition_id?: string;
  season_id?: string;
  match_id?: string;
}

export interface PostmanRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
}

/**
 * Generate Postman-compatible request from app configuration
 */
export const generatePostmanRequest = (
  endpoint: string,
  apiKey: string,
  baseUrl: string = 'https://api.sportradar.com'
): PostmanRequest => {
  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set('api_key', apiKey);

  return {
    method: 'GET',
    url: url.toString(),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'Lovable-Sports-App/1.0'
    },
    params: Object.fromEntries(url.searchParams)
  };
};

/**
 * Generate environment variables for Postman export
 */
export const generatePostmanEnvironment = (
  apiKey: string,
  accessLevel: 'trial' | 'production' = 'trial'
): PostmanEnvironment => {
  return {
    base_url: 'https://api.sportradar.com',
    api_key: apiKey,
    soccer_version: 'v4',
    locale: 'en',
    access_level: accessLevel,
    competition_id: 'sr:competition:17', // Premier League
    season_id: 'sr:season:118689',
    match_id: 'sr:match:49365133'
  };
};

/**
 * Convert app endpoint to Postman collection format
 */
export const endpointToPostmanFormat = (endpoint: string): string => {
  return endpoint
    .replace(/\/soccer\/trial\/v4\/en/, '/soccer/{{access_level}}/{{soccer_version}}/{{locale}}')
    .replace(/\/soccer\/production\/v4\/en/, '/soccer/{{access_level}}/{{soccer_version}}/{{locale}}')
    .replace(/api_key=[^&]+/, 'api_key={{api_key}}');
};

/**
 * Generate cURL command from app request
 */
export const generateCurlCommand = (
  endpoint: string,
  apiKey: string,
  baseUrl: string = 'https://api.sportradar.com'
): string => {
  const request = generatePostmanRequest(endpoint, apiKey, baseUrl);
  
  const headers = Object.entries(request.headers)
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(' ');
  
  return `curl -X ${request.method} "${request.url}" ${headers}`;
};

/**
 * Validate API key format for Sportradar
 */
export const validateSportradarApiKey = (apiKey: string): { 
  valid: boolean; 
  message: string; 
  tier?: 'trial' | 'production' 
} => {
  if (!apiKey) {
    return { valid: false, message: 'API key is required' };
  }
  
  if (apiKey.length < 20) {
    return { valid: false, message: 'API key appears too short' };
  }
  
  // Basic format validation (Sportradar keys are typically alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(apiKey)) {
    return { valid: false, message: 'API key contains invalid characters' };
  }
  
  // Trial keys are typically shorter than production keys
  const tier = apiKey.length < 40 ? 'trial' : 'production';
  
  return { 
    valid: true, 
    message: `Valid ${tier} API key format`, 
    tier 
  };
};

/**
 * Common Sportradar Soccer v4 endpoints used in app
 */
export const SPORTRADAR_ENDPOINTS = {
  competitions: '/soccer/{access_level}/v4/{locale}/competitions.json',
  liveMatches: '/soccer/{access_level}/v4/{locale}/summaries/{date}/summaries.json',
  matchSummary: '/soccer/{access_level}/v4/{locale}/matches/{match_id}/summary.json',
  seasonSchedule: '/soccer/{access_level}/v4/{locale}/seasons/{season_id}/schedules.json',
  seasonStandings: '/soccer/{access_level}/v4/{locale}/seasons/{season_id}/standings.json',
  overUnderStats: '/soccer/{access_level}/v4/{locale}/seasons/{season_id}/competitors/{competitor_id}/versus/{competitor_id2}/matches.json'
} as const;