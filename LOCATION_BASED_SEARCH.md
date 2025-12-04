# Location-Based Job and Company Search

## Overview

The system now supports location-based search for jobs and companies in **any location worldwide**, including international cities like Bangalore, Mumbai, London, Toronto, etc.

## GitHub API Key Integration

GitHub API key integration:
- **Get your key from**: https://github.com/settings/tokens
- **Rate Limit**: 5,000 requests/hour (with API key)
- **Add to**: `server/.env` file as `GITHUB_API_KEY=your_token_here`

## New Features

### 1. International Location Support
- ✅ Support for any city, state, or country
- ✅ Automatic country code detection (India, UK, Canada, Australia, US)
- ✅ Works with locations like:
  - **India**: Bangalore, Mumbai, Delhi, Hyderabad, Chennai, Pune
  - **UK**: London, Manchester, Birmingham
  - **Canada**: Toronto, Vancouver, Montreal
  - **Australia**: Sydney, Melbourne, Brisbane
  - **US**: All 50 states (existing support)

### 2. Company Search by Location
- Uses GitHub API to find companies with presence in specified locations
- Fetches company details including:
  - Company name and description
  - Website URL
  - Logo/avatar
  - Location information
  - Public repositories count
  - Last updated timestamp

### 3. Job Search by Location
- Integrates multiple APIs:
  - **GitHub API** (active) - Company information
  - **JSearch API** (if configured) - Job listings
  - **Adzuna API** (if configured) - Free job search
  - **LinkedIn API** (placeholder) - Ready for API key
  - **Unstop API** (placeholder) - Ready for API key

## API Endpoints

### Get Companies Hiring in a Location

```
GET /api/recommendations/companies/:location?limit=20
```

**Examples:**
```bash
# Get companies in Bangalore
GET /api/recommendations/companies/Bangalore?limit=20

# Get companies in Mumbai
GET /api/recommendations/companies/Mumbai?limit=20

# Get companies in London
GET /api/recommendations/companies/London?limit=20
```

**Response:**
```json
{
  "location": "Bangalore",
  "companies": [
    {
      "name": "company-name",
      "displayName": "Company Name",
      "description": "Company description",
      "avatar": "https://avatars.githubusercontent.com/...",
      "url": "https://github.com/company-name",
      "websiteUrl": "https://company.com",
      "location": "Bangalore, India",
      "publicRepos": 150,
      "followers": 5000,
      "source": "github",
      "hiring": true,
      "lastUpdated": "2024-01-15T10:30:00Z"
    }
  ],
  "totalResults": 20,
  "sources": ["github", "linkedin", "unstop"]
}
```

### Get Jobs in a Location

```
GET /api/recommendations/jobs/:location?skills=react,python&limit=20
```

**Examples:**
```bash
# Get jobs in Bangalore for React developers
GET /api/recommendations/jobs/Bangalore?skills=react,python&limit=20

# Get jobs in Mumbai
GET /api/recommendations/jobs/Mumbai?skills=javascript&limit=20
```

**Response:**
```json
{
  "location": "Bangalore",
  "jobs": [
    {
      "id": "job-123",
      "title": "Senior React Developer",
      "company": "Tech Company",
      "location": "Bangalore, India",
      "description": "Job description...",
      "applyUrl": "https://...",
      "postedDate": "2024-01-15",
      "source": "jsearch"
    }
  ],
  "totalResults": 20,
  "skills": ["react", "python"],
  "sources": ["github", "jsearch", "adzuna"]
}
```

### Search Jobs with Location Filter

```
GET /api/jobs/search?skills=react,python&location=Bangalore&limit=20
```

**Example:**
```bash
GET /api/jobs/search?skills=react,python&location=Bangalore&limit=20
```

## Supported Locations

### India
- Bangalore
- Mumbai
- Delhi
- Hyderabad
- Chennai
- Pune
- Any city in India

### United Kingdom
- London
- Manchester
- Birmingham
- Any UK city

### Canada
- Toronto
- Vancouver
- Montreal
- Any Canadian city

### Australia
- Sydney
- Melbourne
- Brisbane
- Any Australian city

### United States
- All 50 states (existing support)
- Any US city

## Free API Integrations

### 1. GitHub API ✅ (Active)
- **Status**: Active with provided API key
- **Rate Limit**: 5,000 requests/hour
- **Features**: Company information, organization search, location-based search

### 2. Adzuna API (Optional - Free Tier)
- **Setup**: Get free API keys from https://developer.adzuna.com/
- **Add to .env**:
  ```env
  ADZUNA_APP_ID=your_app_id
  ADZUNA_APP_KEY=your_app_key
  ```
- **Features**: Job search by location and skills

### 3. LinkedIn API (Placeholder)
- **Status**: Code ready, requires API key
- **Add to .env**: `LINKEDIN_API_KEY=your_key`

### 4. Unstop API (Placeholder)
- **Status**: Code ready, requires API key
- **Add to .env**: `UNSTOP_API_KEY=your_key`

## Testing

### Test Company Search
```bash
# Test with Bangalore
curl http://localhost:5000/api/recommendations/companies/Bangalore

# Test with Mumbai
curl http://localhost:5000/api/recommendations/companies/Mumbai
```

### Test Job Search
```bash
# Test jobs in Bangalore
curl "http://localhost:5000/api/recommendations/jobs/Bangalore?skills=react"

# Test jobs in Mumbai
curl "http://localhost:5000/api/recommendations/jobs/Mumbai?skills=python"
```

### Test Job Search with Location Filter
```bash
curl "http://localhost:5000/api/jobs/search?skills=react,python&location=Bangalore"
```

## Implementation Details

### GitHub API Methods

1. **getCompaniesByLocation(location, limit)**
   - Searches GitHub organizations by location
   - Returns companies with GitHub presence in the location

2. **getHiringCompanies(location, limit)**
   - Searches for companies with recent activity
   - Fetches detailed company information
   - Marks companies as "hiring: true"

3. **searchOrganizations(query, location)**
   - General organization search with location filter
   - Supports any location worldwide

### Country Code Detection

The system automatically detects country codes from location names:
- India cities → `IN`
- UK cities → `GB`
- Canada cities → `CA`
- Australia cities → `AU`
- Default → `US`

## Environment Variables

Update your `server/.env` file:

```env
# GitHub API (Get from https://github.com/settings/tokens)
GITHUB_API_KEY=your_github_personal_access_token_here

# Optional: Adzuna API (free tier)
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Optional: LinkedIn API
LINKEDIN_API_KEY=

# Optional: Unstop API
UNSTOP_API_KEY=

# Existing APIs
JSEARCH_API_KEY=your_jsearch_key
```

## Usage Examples

### Frontend Integration

```javascript
// Search companies in Bangalore
const response = await api.get('/recommendations/companies/Bangalore?limit=20');
const companies = response.data.companies;

// Search jobs in Mumbai
const jobsResponse = await api.get('/recommendations/jobs/Mumbai?skills=react,python');
const jobs = jobsResponse.data.jobs;

// Search jobs with location filter
const searchResponse = await api.get('/jobs/search?skills=react&location=Bangalore');
const searchResults = searchResponse.data.jobs;
```

## Next Steps

1. ✅ GitHub API is active and working
2. 🔄 Add Adzuna API keys for free job search (optional)
3. 🔄 Add LinkedIn API key when available (optional)
4. 🔄 Add Unstop API key when available (optional)

## Notes

- GitHub API works immediately without additional setup
- All location searches use GitHub API as primary source
- Other APIs (Adzuna, LinkedIn, Unstop) are optional enhancements
- The system gracefully handles missing API keys
- Results are deduplicated across all sources

