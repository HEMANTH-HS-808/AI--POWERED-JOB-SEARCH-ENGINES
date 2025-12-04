# Deployment Guide - AI-Powered Job Search Engine

## 🚀 Deployment Options

### Option 1: Deploy to Render (Recommended - Free Tier Available)

#### Backend Deployment (Render)

1. **Create a Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `job-search-backend`
     - **Root Directory**: `server`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free

3. **Add Environment Variables**
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_gemini_api_key
   GITHUB_API_KEY=your_github_token
   CLIENT_URL=https://your-frontend-url.com
   ```

4. **Get MongoDB Connection String**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string
   - Add to Render environment variables

#### Frontend Deployment (Render)

1. **Deploy Frontend**
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `job-search-frontend`
     - **Root Directory**: `client`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`

2. **Add Environment Variable**
   ```
   REACT_APP_API_URL=https://your-backend-url.onrender.com
   ```

---

### Option 2: Deploy to Vercel + Railway

#### Backend on Railway

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Configure:
     - **Root Directory**: `server`
     - **Start Command**: `npm start`

3. **Add Environment Variables** (same as above)

4. **Add MongoDB**
   - Click "New" → "Database" → "Add MongoDB"
   - Copy connection string to environment variables

#### Frontend on Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Create React App
     - **Root Directory**: `client`
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`

3. **Add Environment Variable**
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

---

### Option 3: Deploy to Heroku

#### Backend Deployment

1. **Install Heroku CLI**
   ```bash
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create job-search-backend
   ```

3. **Add MongoDB**
   ```bash
   heroku addons:create mongolab:sandbox
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_secret
   heroku config:set GEMINI_API_KEY=your_key
   heroku config:set GITHUB_API_KEY=your_token
   ```

5. **Create Procfile in server directory**
   ```
   web: node server.js
   ```

6. **Deploy**
   ```bash
   git subtree push --prefix server heroku main
   ```

#### Frontend Deployment

1. **Create Frontend App**
   ```bash
   heroku create job-search-frontend
   ```

2. **Add Buildpack**
   ```bash
   heroku buildpacks:set mars/create-react-app
   ```

3. **Set Environment Variable**
   ```bash
   heroku config:set REACT_APP_API_URL=https://job-search-backend.herokuapp.com
   ```

4. **Deploy**
   ```bash
   git subtree push --prefix client heroku main
   ```

---

### Option 4: Deploy to AWS (Advanced)

#### Using AWS Elastic Beanstalk

1. **Install AWS CLI and EB CLI**
2. **Configure AWS credentials**
3. **Create Elastic Beanstalk application**
4. **Deploy backend and frontend separately**
5. **Configure RDS for MongoDB or use MongoDB Atlas**

---

## 🔧 Pre-Deployment Checklist

### Required API Keys

- [ ] **MongoDB URI** - Database connection
- [ ] **JWT Secret** - Authentication (generate random string)
- [ ] **Gemini API Key** - AI features (https://makersuite.google.com/app/apikey)
- [ ] **GitHub Token** - Company data (https://github.com/settings/tokens)

### Optional API Keys (for enhanced features)

- [ ] **JSearch API** - More job listings (https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
- [ ] **Adzuna API** - Additional jobs (https://developer.adzuna.com/)

### Configuration Files

1. **Update CORS in server/server.js**
   ```javascript
   const corsOptions = {
     origin: ['https://your-frontend-url.com'],
     credentials: true
   };
   ```

2. **Update API URL in client**
   - Set `REACT_APP_API_URL` environment variable

---

## 📝 Post-Deployment Steps

1. **Test the Application**
   - Visit your frontend URL
   - Try registering a new user
   - Test job search functionality
   - Test AI chatbot

2. **Create Admin User**
   - SSH into your backend server or use Railway/Render shell
   - Run: `node scripts/createAdmin.js`

3. **Monitor Logs**
   - Check backend logs for errors
   - Monitor API usage and rate limits

4. **Set Up Custom Domain (Optional)**
   - Configure DNS settings
   - Add SSL certificate (usually automatic on Render/Vercel)

---

## 🔒 Security Best Practices

1. **Never commit .env files**
2. **Use strong JWT secrets** (at least 32 characters)
3. **Enable rate limiting** (already configured)
4. **Use HTTPS only** (enforced by most platforms)
5. **Regularly rotate API keys**
6. **Monitor for suspicious activity**

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Server not starting
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check logs for specific errors

**Problem**: API calls failing
- Verify CORS settings
- Check API keys are valid
- Ensure rate limits not exceeded

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `REACT_APP_API_URL` is correct
- Check CORS configuration on backend
- Ensure backend is running

**Problem**: Build fails
- Clear node_modules and reinstall
- Check for syntax errors
- Verify all dependencies are in package.json

---

## 📊 Monitoring & Maintenance

### Free Monitoring Tools

1. **Render/Railway/Vercel Dashboards** - Built-in monitoring
2. **MongoDB Atlas** - Database monitoring
3. **Google Cloud Console** - Gemini API usage
4. **GitHub** - API rate limit status

### Regular Maintenance

- Monitor API usage and costs
- Update dependencies monthly
- Review and rotate API keys quarterly
- Backup database regularly (MongoDB Atlas does this automatically)

---

## 💰 Cost Estimates

### Free Tier (Recommended for Testing)

- **Render**: Free (with limitations)
- **MongoDB Atlas**: Free (512MB storage)
- **Vercel**: Free (100GB bandwidth)
- **Gemini API**: Free tier available
- **GitHub API**: 5000 requests/hour with token

**Total**: $0/month

### Production Tier

- **Render**: $7/month (starter)
- **MongoDB Atlas**: $9/month (shared cluster)
- **Vercel**: Free (usually sufficient)
- **Gemini API**: Pay as you go
- **GitHub API**: Free

**Total**: ~$16-25/month

---

## 🎉 Success!

Your AI-Powered Job Search Engine is now live! Share the URL and start helping students find their dream jobs.

For support, check the documentation or open an issue on GitHub.
