# API Integration Guide

This document explains the API integrations for job and company recommendations across all US states.

## Overview

The system integrates with multiple APIs to provide comprehensive job and company recommendations:

1. **GitHub API** (Free, works without key) - Primary source for company data
2. **LinkedIn API** (Placeholder - requires manual API key)
3. **Unstop API** (Placeholder - requires manual API key)
4. **JSearch API** (Existing integration)

## GitHub API Integration

### Features
- **Free to use** - No API key required (60 requests/hour)
- **With API key** - 5,000 requests/hour (optional)
- Fetches company/organization information from GitHub
- Searches companies by state location
- Provides company logos, descriptions, and metadata

### Setup
1. **Without API Key** (Recommended for testing):
   - Works immediately, no setup required
   - Rate limit: 60 requests/hour per IP

2. **With API Key** (Recommended for production):
   - Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
   - Generate new token (classic)
   - Select scope: `public_repo` (read-only)
   - Add to `.env`: `GITHUB_API_KEY=your_token_here`

### Usage Examples

```javascript
// Get company info
const company = await github.getCompanyInfo('microsoft');

// Search companies in a state
const companies = await github.getCompaniesByState('California', 20);

// Search organizations
const orgs = await github.searchOrganizations('technology', 'CA');
```

## LinkedIn API Integration (Placeholder)

### Status
- Code structure is ready
- Requires manual API key setup
- Leave `LINKEDIN_API_KEY` empty in `.env` until you have credentials

### Setup (When Available)
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Get API credentials
4. Add to `.env`: `LINKEDIN_API_KEY=your_key_here`

### Implementation Notes
- The code includes placeholder methods for:
  - `searchCompanies(query, state)` - Search for companies
  - `searchJobs(skills, state)` - Search for jobs
- Update the API endpoints and request structure based on LinkedIn's actual API documentation

## Unstop API Integration (Placeholder)

### Status
- Code structure is ready
- Requires manual API key setup
- Leave `UNSTOP_API_KEY` empty in `.env` until you have credentials

### Setup (When Available)
1. Contact Unstop or visit their API documentation
2. Get your API key
3. Add to `.env`: `UNSTOP_API_KEY=your_key_here`

### Implementation Notes
- The code includes placeholder methods for:
  - `searchJobs(skills, state)` - Search for jobs/internships
  - `getCompanies(state)` - Get companies hiring
- Update the API endpoints and request structure based on Unstop's actual API documentation

## API Endpoints

### Recommendations Endpoints

#### Get Companies by State
```
GET /api/recommendations/companies/:state?limit=20
```
**Example:**
```
GET /api/recommendations/companies/California?limit=20
```

**Response:**
```json
{
  "state": "California",
  "companies": [
    {
      "name": "company-name",
      "displayName": "Company Name",
      "avatar": "https://...",
      "url": "https://github.com/company-name",
      "location": "California",
      "source": "github"
    }
  ],
  "totalResults": 20,
  "sources": ["github", "linkedin", "unstop"]
}
```

#### Get Jobs by State
```
GET /api/recommendations/jobs/:state?skills=react,python&limit=20
```
**Example:**
```
GET /api/recommendations/jobs/California?skills=react,python&limit=20
```

**Response:**
```json
{
  "state": "California",
  "jobs": [
    {
      "id": "job-id",
      "title": "Software Engineer",
      "company": "Company Name",
      "location": "San Francisco, CA",
      "description": "...",
      "source": "jsearch"
    }
  ],
  "totalResults": 20,
  "skills": ["react", "python"],
  "sources": ["jsearch", "linkedin", "unstop"]
}
```

#### Get All States
```
GET /api/recommendations/states
```

**Response:**
```json
{
  "states": ["Alabama", "Alaska", ...],
  "total": 50
}
```

#### Get Companies (All States or Filtered)
```
GET /api/recommendations/companies?state=California&limit=20
```

## Error Handling

All API integrations include comprehensive error handling:

1. **GitHub API**: Falls back gracefully if organization not found
2. **LinkedIn API**: Returns empty array if key not configured
3. **Unstop API**: Returns empty array if key not configured
4. **JSearch API**: Falls back to mock data if API fails

## Rate Limiting

- **GitHub (no key)**: 60 requests/hour per IP
- **GitHub (with key)**: 5,000 requests/hour
- **LinkedIn**: Depends on your API plan
- **Unstop**: Depends on your API plan
- **JSearch**: Depends on your RapidAPI plan

## Best Practices

1. **Use GitHub API key in production** to avoid rate limit issues
2. **Cache company data** using the CompanyCache model
3. **Combine results** from multiple APIs for better coverage
4. **Handle errors gracefully** - the system continues working even if one API fails
5. **Monitor API usage** to stay within rate limits

## Testing

Test the integrations:

```bash
# Test GitHub API (no key required)
curl http://localhost:5000/api/recommendations/companies/California

# Test with skills
curl http://localhost:5000/api/recommendations/jobs/California?skills=react

# Get all states
curl http://localhost:5000/api/recommendations/states
```

## Future Enhancements

- Add caching layer for API responses
- Implement request queuing for rate limit management
- Add API usage analytics
- Support for international locations
- Add more API integrations as needed

