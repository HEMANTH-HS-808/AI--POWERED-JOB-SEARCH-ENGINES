# SkillSync Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## Quick Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
npm run install-server

# Install client dependencies
npm run install-client
```

### 2. Environment Configuration

#### Server Environment (.env in /server directory)

Create `server/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
GEMINI_API_KEY=your_gemini_api_key_here
JSEARCH_API_KEY=your_rapidapi_jsearch_key_here

# GitHub API Key (Optional - increases rate limit from 60 to 5000 requests/hour)
# Get free token at: https://github.com/settings/tokens
GITHUB_API_KEY=your_github_personal_access_token_here

# LinkedIn API Key (Optional - for LinkedIn job and company data)
# Get API key from: https://www.linkedin.com/developers/apps
LINKEDIN_API_KEY=

# Unstop API Key (Optional - for Unstop jobs and internships)
# Get API key from: https://unstop.com/api (or contact Unstop for API access)
UNSTOP_API_KEY=

NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

#### Client Environment (.env in /client directory)

Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_APP_NAME=SkillSync
```

### 3. API Keys Setup

#### Google Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your server `.env` file as `GEMINI_API_KEY`

#### JSearch API Key (Optional - for real job data)
1. Go to [RapidAPI JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Subscribe to the free plan
3. Get your API key
4. Add it to your server `.env` file as `JSEARCH_API_KEY`

#### GitHub API Key (Optional - Free, increases rate limit)
**GitHub API works without a key, but adding one increases rate limits:**
- Without key: 60 requests/hour
- With key: 5,000 requests/hour

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scope: `public_repo` (read-only access to public repositories)
4. Copy the token and add it to your server `.env` file as `GITHUB_API_KEY`

**Note:** The GitHub API is used for company information and state-based company recommendations. It works without a key but with lower rate limits.

#### LinkedIn API Key (Optional - Manual setup required)
**Placeholder ready - add your LinkedIn API key when available:**
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Create a new app
3. Get your API credentials
4. Add the API key to your server `.env` file as `LINKEDIN_API_KEY`

**Note:** Leave empty if you don't have a LinkedIn API key yet. The code includes placeholders for future integration.

#### Unstop API Key (Optional - Manual setup required)
**Placeholder ready - add your Unstop API key when available:**
1. Contact Unstop or visit their API documentation
2. Get your API key
3. Add it to your server `.env` file as `UNSTOP_API_KEY`

**Note:** Leave empty if you don't have an Unstop API key yet. The code includes placeholders for future integration.

**Important:** The app works with GitHub API (free, no key required) and mock data for other services. All API keys are optional except for full functionality.

### 4. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/skillsync`

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Replace `MONGODB_URI` in server `.env`

### 5. Start Development Servers

```bash
# Start both client and server concurrently
npm run dev

# Or start individually:
# Server only (http://localhost:5000)
npm run server

# Client only (http://localhost:3000)
npm run client
```

## Demo Account

For testing purposes, you can create a demo account or use these credentials:

- **Email:** demo@skillsync.com
- **Password:** demo123

## Features Overview

### 🔍 Job Search
- Search jobs by skills (React, Python, etc.)
- Filter by location, employment type
- State-based job recommendations for all 50 US states
- Save favorite companies

### 🌎 State-Based Recommendations
- Get recommended companies in any US state
- Get recommended jobs by state
- Integrates with GitHub API (free) for company data
- Supports LinkedIn and Unstop APIs (when keys are added)

### 🤖 AI Career Advisor
- Get personalized learning paths
- Skill gap analysis
- Company-specific recommendations

### 👤 User Profile
- Manage your skills
- Track saved companies
- Update profile information

### 🏢 Company Details
- View company information
- Get AI-powered career guidance
- Save companies for later

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access (for Atlas)

2. **API Key Issues**
   - Verify API keys are correct
   - Check API quotas/limits
   - App works with mock data if keys are missing

3. **Port Conflicts**
   - Change ports in `.env` files if needed
   - Default: Server (5000), Client (3000)

4. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

### Development Tips

- Use browser dev tools for debugging
- Check server logs for API errors
- MongoDB Compass for database inspection
- React DevTools for component debugging

## Production Deployment

### Environment Variables for Production

Update these for production deployment:

```env
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=your_production_client_url
```

### Build Commands

```bash
# Build client for production
cd client && npm run build

# Start production server
cd server && npm start
```

## Project Structure

```
skillsync/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── utils/         # Utility functions
├── server/                # Node.js backend
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   └── server.js         # Entry point
└── package.json          # Root package.json
```

## Support

If you encounter issues:

1. Check this setup guide
2. Review error messages carefully
3. Ensure all dependencies are installed
4. Verify environment variables are set correctly

Happy coding! 🚀