# Sportradar Soccer v4 - Postman Integration

This directory contains Postman environment templates that align with your app's configuration for seamless API testing.

## Quick Setup

1. **Import Environment Templates**:
   - Import `sportradar-trial.postman_environment.json` or `sportradar-production.postman_environment.json` into Postman
   - Update the `api_key` variable with your actual Sportradar API key

2. **Import Official Collection**:
   - Use the official Sportradar Soccer v4 collection: [Postman Collection Link](https://www.postman.com/sportradar-media-apis/sportradar-media-apis/collection/da46co8/sportradar-soccer-v4)

3. **Environment Variables**:
   - `base_url`: https://api.sportradar.com
   - `api_key`: Your API key (replace `{{YOUR_TRIAL_API_KEY}}` with actual key)
   - `soccer_version`: v4
   - `locale`: en
   - `access_level`: trial or production

## Key Endpoints to Test

### Core Endpoints (match your app)
- **Competitions**: `{{base_url}}/soccer/{{access_level}}/{{soccer_version}}/{{locale}}/competitions.json?api_key={{api_key}}`
- **Live Summaries**: `{{base_url}}/soccer/{{access_level}}/{{soccer_version}}/{{locale}}/summaries/{date}/summaries.json?api_key={{api_key}}`
- **Match Summary**: `{{base_url}}/soccer/{{access_level}}/{{soccer_version}}/{{locale}}/matches/{{match_id}}/summary.json?api_key={{api_key}}`

### Test in This Order
1. Competitions (simplest endpoint)
2. Daily summaries for today's date
3. Specific match summary
4. Season schedules and standings

## Rate Limiting (Trial Tier)
- **1 request per 90 seconds** in your app (conservative)
- **1000 requests per month** quota
- **1 concurrent request** max
- Monitor `x-ratelimit-*` headers in responses

## Debugging Tips
- Use the app's API Tester component alongside Postman
- Compare request/response headers between both tools
- Check proxy logs in your dev console when using `/api/sportradar` 
- Trial tier errors are common - respect the rate limits!

## Sync with Your App
Your local app configuration aligns with these Postman variables:
- App uses the same base URL and endpoints
- Same authentication method (query parameter)
- Identical rate limiting approach
- Error handling matches expected Sportradar responses