# Job Search Engine - Project Architecture & Technologies

## 🛠️ Core Technologies Overview

### Backend Technologies
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Web framework for building RESTful APIs
- **MongoDB**: NoSQL database for storing user data and company cache
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB
- **JWT (JSON Web Tokens)**: For secure user authentication
- **bcryptjs**: For hashing passwords securely
- **Axios**: HTTP client for making API calls to external services
- **Google Gemini AI**: For AI-powered job matching, resume analysis, and chatbot

### Frontend Technologies
- **React.js**: JavaScript library for building user interfaces
- **React Router**: For client-side routing and navigation
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Framer Motion**: Animation library for smooth UI transitions
- **Axios**: HTTP client for API communication
- **React Hot Toast**: For displaying notifications
- **Lucide React**: Icon library
- **React Markdown**: For rendering markdown content (chatbot responses)

---

## 📁 Project Structure & File Purposes

### Root Level Files

#### `package.json`
**Technology**: npm package configuration
**Purpose**: Root package file that manages scripts to run both client and server concurrently. Uses `concurrently` to start both frontend and backend together.

#### `README.md`
**Technology**: Markdown documentation
**Purpose**: Main project documentation explaining what the project does, how to set it up, and how to use it.

---

## 🖥️ Backend Files (`/server`)

### Core Server Files

#### `server.js`
**Technology**: Express.js, Node.js
**Purpose**: Main entry point of the backend server. Sets up Express app, connects to MongoDB, configures middleware (CORS, JSON parsing, authentication), and registers all API routes. This is where the server starts listening on a port.

#### `package.json` (server)
**Technology**: npm package configuration
**Purpose**: Defines all backend dependencies (Express, Mongoose, JWT, Gemini AI, etc.) and scripts for running the server.

---

### Routes (`/server/routes`)

Routes handle HTTP requests and define API endpoints.

#### `auth.js`
**Technology**: Express.js, JWT, bcryptjs
**Purpose**: Handles user authentication endpoints:
- User registration (sign up)
- User login
- Password hashing and verification
- JWT token generation and validation
- User session management

#### `jobs.js`
**Technology**: Express.js, Axios, Google Gemini AI
**Purpose**: Core job search functionality:
- Searches jobs from multiple sources (LinkedIn, Naukri, Unstop, GitHub, JSearch)
- Aggregates jobs from different APIs
- Uses Gemini AI to rank jobs based on skill matching
- Validates and fixes job application URLs
- Returns location-specific job results

#### `ai.js`
**Technology**: Express.js, Google Gemini AI
**Purpose**: AI-powered features:
- Chatbot endpoint for career advice (uses Gemini 2.0 Flash)
- Resume image analysis using Gemini Vision API
- Extracts skills, experience, education from resume images
- Provides job recommendations based on resume analysis
- Manages chat sessions for continuous conversations

#### `recommendations.js`
**Technology**: Express.js, Axios
**Purpose**: Provides location-based recommendations:
- Recommends companies hiring in specific locations
- Recommends jobs in specific locations
- Aggregates data from GitHub, LinkedIn, Unstop APIs
- Supports international locations (India, US, UK, etc.)

#### `users.js`
**Technology**: Express.js, MongoDB/Mongoose
**Purpose**: User profile management:
- Get current user profile
- Update user profile information
- Save favorite companies
- Manage user resume data
- Handle user preferences

#### `admin.js`
**Technology**: Express.js, MongoDB/Mongoose
**Purpose**: Admin-only functionality:
- Admin dashboard with statistics
- User management (view, delete users)
- Company cache management
- System statistics and analytics
- Protected routes requiring admin role

---

### Models (`/server/models`)

Models define database schemas using Mongoose.

#### `User.js`
**Technology**: Mongoose, MongoDB
**Purpose**: Defines the user data structure:
- User credentials (email, password)
- User profile (name, skills, experience)
- Saved companies
- Resume analysis data (image URL, AI analysis results)
- User role (user/admin)
- Authentication tokens

#### `CompanyCache.js`
**Technology**: Mongoose, MongoDB
**Purpose**: Caches company information to reduce API calls:
- Company name, description, logo
- Website URL
- Location information
- Last fetched timestamp
- Reduces redundant API requests

---

### Middleware (`/server/middleware`)

Middleware functions run between request and response.

#### `auth.js`
**Technology**: JWT, Express.js
**Purpose**: Authentication middleware:
- Verifies JWT tokens from request headers
- Extracts user information from tokens
- Protects routes that require authentication
- Adds user data to request object for use in routes

#### `admin.js`
**Technology**: Express.js
**Purpose**: Authorization middleware:
- Checks if user has admin role
- Protects admin-only routes
- Ensures only admins can access admin features
- Works after auth middleware to check user role

---

### Utilities (`/server/utils`)

Utility files contain reusable functions and integrations.

#### `apiIntegrations.js`
**Technology**: Axios, HTTP requests
**Purpose**: Centralized API integration layer:
- **GitHubAPI**: Fetches company data from GitHub (free, uses provided API key)
- **LinkedInAPI**: Searches jobs from LinkedIn (unofficial free API)
- **NaukriAPI**: Searches jobs from Naukri.com (India's largest job portal)
- **UnstopAPI**: Searches internships and student jobs
- **AdzunaAPI**: Alternative job search API (free tier)
- Handles API errors gracefully with fallbacks

#### `demoStorage.js`
**Technology**: JavaScript (in-memory storage)
**Purpose**: Demo mode storage when MongoDB is not connected:
- Stores user data in memory
- Provides demo users (regular and admin)
- Allows testing without database setup
- Simulates database operations

---

### Scripts (`/server/scripts`)

#### `createAdmin.js`
**Technology**: Node.js, MongoDB/Mongoose
**Purpose**: Utility script to create admin users in the database. Can be run manually to set up admin accounts.

---

### Test/Utility Files

#### `test-gemini-api.js`
**Technology**: Google Gemini AI SDK
**Purpose**: Test script to verify Gemini API key is working correctly. Helps diagnose API connection issues.

#### `list-gemini-models.js`
**Technology**: Google Gemini AI SDK
**Purpose**: Lists available Gemini models to check which ones are accessible with the API key.

#### `verify-api-keys.js`
**Technology**: Node.js
**Purpose**: Verifies that all required API keys are configured in the environment.

---

## 🎨 Frontend Files (`/client`)

### Core Application Files

#### `src/index.js`
**Technology**: React.js
**Purpose**: Entry point of the React application. Renders the root App component into the DOM and sets up the application.

#### `src/App.js`
**Technology**: React.js, React Router
**Purpose**: Main application component that defines all routes:
- Public routes (Home, Login, Register, Job Search)
- Protected routes (Profile, Resume Upload, Chatbot, Admin)
- Route protection using ProtectedRoute component
- Application-wide routing configuration

#### `src/index.css`
**Technology**: Tailwind CSS, CSS
**Purpose**: Global styles and Tailwind CSS configuration:
- Custom CSS classes
- Markdown content styling (for chatbot)
- Global theme colors and utilities
- Base styles for the application

---

### Pages (`/client/src/pages`)

Pages are the main view components for different routes.

#### `Home.js`
**Technology**: React.js, Framer Motion, React Router
**Purpose**: Landing page of the application:
- Hero section with search functionality
- Features showcase
- Statistics display
- Call-to-action buttons
- Navigation to job search

#### `JobSearch.js`
**Technology**: React.js, Axios, React Router
**Purpose**: Job search interface:
- Skill-based job search
- Location filtering
- Job results display
- Save companies functionality
- Apply button with external links
- Job filtering options

#### `Login.js`
**Technology**: React.js, Axios, React Router
**Purpose**: User login page:
- Email and password input
- Form validation
- Authentication API calls
- Redirect after successful login
- Error handling and display

#### `Register.js`
**Technology**: React.js, Axios, React Router
**Purpose**: User registration page:
- User sign-up form
- Input validation
- Registration API calls
- Redirect to login after registration
- Error handling

#### `Profile.js`
**Technology**: React.js, Axios
**Purpose**: User profile management:
- Display user information
- Edit profile details
- Upload resume photo
- Manage saved companies
- Update skills and experience

#### `ResumeUpload.js`
**Technology**: React.js, Axios
**Purpose**: Resume analysis page:
- Drag-and-drop file upload
- Image preview
- Resume analysis using Gemini Vision API
- Display extracted information (skills, experience, education)
- Show job recommendations based on resume
- Display resume score and tips

#### `Chatbot.js`
**Technology**: React.js, Axios, React Markdown
**Purpose**: AI career advisor chatbot:
- Chat interface with message history
- Continuous conversation using session management
- Markdown rendering for formatted responses
- Uses Gemini 2.0 Flash for AI responses
- Career advice and job-related questions

#### `CompanyDetails.js`
**Technology**: React.js, Axios, React Router
**Purpose**: Company information page:
- Display company details
- Show company description and logo
- Generate AI-powered career path
- Save company to favorites
- View company website

#### `Admin.js`
**Technology**: React.js, Axios
**Purpose**: Admin dashboard (admin-only):
- View system statistics
- Manage users (view, delete)
- Manage company cache
- Admin-only features and controls

---

### Components (`/client/src/components`)

Reusable UI components.

#### `Navbar.js`
**Technology**: React.js, React Router, Lucide React
**Purpose**: Navigation bar component:
- Application navigation links
- User authentication status
- Logout functionality
- Responsive mobile menu
- Admin link (visible only to admins)

#### `ProtectedRoute.js`
**Technology**: React.js, React Router
**Purpose**: Route protection component:
- Checks if user is authenticated
- Redirects to login if not authenticated
- Protects routes that require login
- Wraps protected pages

---

### Contexts (`/client/src/contexts`)

React Context API for global state management.

#### `AuthContext.js`
**Technology**: React.js, Context API, Axios
**Purpose**: Global authentication state:
- Manages user authentication state
- Provides login/logout functions
- Stores current user data
- Makes auth state available to all components
- Handles token storage and retrieval

---

### Utilities (`/client/src/utils`)

#### `api.js`
**Technology**: Axios
**Purpose**: Centralized API client:
- Configures base URL for API calls
- Sets up request interceptors (adds auth tokens)
- Sets up response interceptors (handle errors)
- Provides reusable API methods
- Handles authentication headers automatically

---

### Configuration Files

#### `tailwind.config.js`
**Technology**: Tailwind CSS
**Purpose**: Tailwind CSS configuration:
- Custom color theme
- Custom spacing and sizing
- Custom breakpoints
- Application-specific design tokens

#### `postcss.config.js`
**Technology**: PostCSS
**Purpose**: PostCSS configuration for processing CSS with Tailwind and Autoprefixer.

#### `public/index.html`
**Technology**: HTML
**Purpose**: Main HTML template for the React app. Contains meta tags, title, and root div where React renders.

#### `public/manifest.json`
**Technology**: Web App Manifest
**Purpose**: PWA (Progressive Web App) configuration for mobile app-like experience.

---

## 📚 Documentation Files

### Setup & Configuration
- **`API_KEYS_SETUP.md`**: Instructions for setting up API keys
- **`ADMIN_SETUP.md`**: Guide for setting up admin accounts
- **`CHATBOT_SETUP.md`**: Chatbot configuration guide
- **`API_INTEGRATION_GUIDE.md`**: Guide for integrating external APIs

### Status & Testing
- **`DEPLOYMENT_STATUS.md`**: Deployment information
- **`FINAL_STATUS.md`**: Project completion status
- **`QUICK_TEST.md`**: Quick testing guide
- **`LOCATION_BASED_SEARCH.md`**: Location search feature documentation

---

## 🔄 Data Flow

1. **User Request** → Frontend (React) makes API call via `api.js`
2. **API Call** → Backend `server.js` receives request
3. **Route Handler** → Appropriate route file (`jobs.js`, `auth.js`, etc.) processes request
4. **Middleware** → `auth.js` or `admin.js` middleware checks permissions
5. **Business Logic** → Route uses utilities (`apiIntegrations.js`) or models (`User.js`)
6. **External APIs** → `apiIntegrations.js` calls external services (GitHub, LinkedIn, etc.)
7. **AI Processing** → Gemini AI analyzes and ranks jobs/resumes
8. **Database** → Mongoose models interact with MongoDB
9. **Response** → Data sent back to frontend
10. **UI Update** → React components re-render with new data

---

## 🔐 Security Features

- **JWT Tokens**: Secure authentication without storing sessions
- **Password Hashing**: bcryptjs for secure password storage
- **CORS**: Cross-origin resource sharing protection
- **Helmet**: Security headers
- **Rate Limiting**: Prevents API abuse
- **Protected Routes**: Authentication and authorization middleware

---

## 🚀 Key Features

1. **Multi-Source Job Aggregation**: Combines jobs from LinkedIn, Naukri, Unstop, GitHub
2. **AI-Powered Matching**: Gemini AI ranks jobs based on skills
3. **Resume Analysis**: AI extracts and analyzes resume content
4. **Location-Based Search**: Finds jobs in specific cities (Mysore, Bangalore, etc.)
5. **Career Chatbot**: AI advisor for job-related questions
6. **Admin Panel**: User and system management
7. **Company Caching**: Reduces API calls by caching company data

---

This architecture provides a scalable, maintainable, and feature-rich job search platform with AI-powered matching and multi-source job aggregation.

