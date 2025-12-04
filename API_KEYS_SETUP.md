# API Keys Setup Guide

## Where to Add API Keys

All API keys should be added to the **`.env` file** in the `server/` directory.

### File Location
```
JOB SEARCH ENGINE 2.0/
└── server/
    └── .env          ← Create this file here
```

## Step-by-Step Instructions

### 1. Create the .env File

1. Navigate to the `server/` folder in your project
2. Create a new file named `.env` (note the dot at the beginning)
3. Copy the contents from `server/.env.example` or use the template below

### 2. Add Your API Keys

Open `server/.env` and add your API keys:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/skillsync

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# ============================================
# API KEYS
# ============================================

# GitHub API Key (Get your own from https://github.com/settings/tokens)
GITHUB_API_KEY=your_github_personal_access_token_here

# Google Gemini API (for AI features)
GEMINI_API_KEY=your_gemini_api_key_here

# JSearch API (for job search)
JSEARCH_API_KEY=your_rapidapi_jsearch_key_here

# Adzuna API (Free tier - for job search)
ADZUNA_APP_ID=your_adzuna_app_id_here
ADZUNA_APP_KEY=your_adzuna_app_key_here

# LinkedIn API (Optional)
LINKEDIN_API_KEY=

# Unstop API (Optional)
UNSTOP_API_KEY=
```

## API Key Details

### ✅ GitHub API Key
- **Purpose**: Fetch company data and information
- **Get it from**: https://github.com/settings/tokens
- **Add to .env**: `GITHUB_API_KEY=your_token_here`
- **Note**: Optional but recommended for higher rate limits

### 🔑 Google Gemini API Key
- **Purpose**: AI-powered career path recommendations
- **Get it from**: https://makersuite.google.com/app/apikey
- **Add to .env**: `GEMINI_API_KEY=your_key_here`

### 🔑 JSearch API Key
- **Purpose**: Real job listings from multiple sources
- **Get it from**: https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
- **Add to .env**: `JSEARCH_API_KEY=your_key_here`

### 🔑 Adzuna API Keys (Free Tier)
- **Purpose**: Additional job search source
- **Get it from**: https://developer.adzuna.com/
- **You need**: Both App ID and App Key
- **Add to .env**:
  ```env
  ADZUNA_APP_ID=your_app_id
  ADZUNA_APP_KEY=your_app_key
  ```

### 🔑 LinkedIn API Key (Optional)
- **Purpose**: LinkedIn job and company data
- **Get it from**: https://www.linkedin.com/developers/apps
- **Add to .env**: `LINKEDIN_API_KEY=your_key_here`
- **Note**: Leave empty if you don't have it yet

### 🔑 Unstop API Key (Optional)
- **Purpose**: Unstop jobs and internships
- **Get it from**: Contact Unstop or visit their API documentation
- **Add to .env**: `UNSTOP_API_KEY=your_key_here`
- **Note**: Leave empty if you don't have it yet

## Quick Setup

### Minimum Required (App works with these):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=your_secret_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Note**: GitHub API key is already in the code, so location-based search works immediately!

### Recommended (For full functionality):
```env
# Add these for better features:
GEMINI_API_KEY=your_gemini_key
JSEARCH_API_KEY=your_jsearch_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key
```

## File Structure

```
server/
├── .env              ← Create this file (add your API keys here)
├── .env.example      ← Example template (already created)
├── server.js
├── package.json
└── ...
```

## Important Notes

1. **Never commit `.env` to Git** - It contains sensitive keys
2. **The `.env` file is already in `.gitignore`** - Your keys are safe
3. **GitHub API works immediately** - No setup needed (key is in code)
4. **Other APIs are optional** - App works without them (uses mock data)

## Testing Your API Keys

After adding keys, restart your server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run server
```

Check the console for:
- ✅ "Server running on port 5000"
- ✅ No API key errors

## Troubleshooting

### Problem: API keys not working
- **Solution**: Make sure `.env` file is in `server/` directory (not root)
- **Solution**: Restart the server after adding keys
- **Solution**: Check for typos in variable names (must match exactly)

### Problem: Can't find .env file
- **Solution**: Create it manually in `server/` folder
- **Solution**: Make sure it's named `.env` (with the dot)

### Problem: GitHub API not working
- **Solution**: The key is already in code, no action needed
- **Solution**: If you want to override, add `GITHUB_API_KEY=...` to `.env`

## Example .env File

Here's a complete example:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=my_super_secret_jwt_key_12345

# GitHub API (Get from https://github.com/settings/tokens)
GITHUB_API_KEY=your_github_token_here

# AI Features
GEMINI_API_KEY=AIzaSyExample123456789

# Job Search
JSEARCH_API_KEY=abc123def456ghi789
ADZUNA_APP_ID=12345678
ADZUNA_APP_KEY=abcdefghijklmnop

# Optional APIs (leave empty if not available)
LINKEDIN_API_KEY=
UNSTOP_API_KEY=
```

## Next Steps

1. ✅ Create `server/.env` file
2. ✅ Add your API keys
3. ✅ Restart the server
4. ✅ Test location-based search (works immediately with GitHub API!)

