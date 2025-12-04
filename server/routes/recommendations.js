const express = require('express');
const axios = require('axios');
const { github, linkedin, unstop, adzuna } = require('../utils/apiIntegrations');
const CompanyCache = require('../models/CompanyCache');

const router = express.Router();

// List of all US states
const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
  'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma',
  'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming'
];

/**
 * @route   GET /api/recommendations/companies/:location
 * @desc    Get recommended companies hiring in a specific location (supports international locations)
 * @access  Public
 */
router.get('/companies/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { limit = 20 } = req.query;

    const companies = [];
    
    // 1. Fetch from GitHub API - get companies currently hiring in location
    try {
      const githubCompanies = await github.getHiringCompanies(location, limit);
      companies.push(...githubCompanies);
    } catch (error) {
      console.error('GitHub API error:', error.message);
    }

    // 2. Also try location-based search
    try {
      const githubLocationCompanies = await github.getCompaniesByLocation(location, limit);
      companies.push(...githubLocationCompanies);
    } catch (error) {
      console.error('GitHub location search error:', error.message);
    }

    // 3. Fetch from LinkedIn API (if key is configured)
    try {
      const linkedinCompanies = await linkedin.searchCompanies('technology', location);
      companies.push(...linkedinCompanies);
    } catch (error) {
      console.error('LinkedIn API error:', error.message);
    }

    // 4. Fetch from Unstop API (if key is configured)
    try {
      const unstopCompanies = await unstop.getCompanies(location);
      companies.push(...unstopCompanies);
    } catch (error) {
      console.error('Unstop API error:', error.message);
    }

    // Remove duplicates and limit results
    const uniqueCompanies = removeDuplicates(companies, 'name').slice(0, limit);

    // Enrich with cached data if available
    const enrichedCompanies = await Promise.all(
      uniqueCompanies.map(async (company) => {
        try {
          const cached = await CompanyCache.findOne({ 
            name: new RegExp(company.name, 'i') 
          });
          if (cached) {
            return {
              ...company,
              description: cached.description || company.description,
              websiteUrl: cached.websiteUrl || company.websiteUrl,
              logo: cached.logo || company.logo || company.avatar,
              industry: cached.industry || company.industry
            };
          }
        } catch (error) {
          // Continue if cache lookup fails
        }
        return company;
      })
    );

    res.json({
      location: location,
      companies: enrichedCompanies,
      totalResults: enrichedCompanies.length,
      sources: getActiveSources()
    });

  } catch (error) {
    console.error('Company recommendations error:', error);
    res.status(500).json({ message: 'Error fetching company recommendations' });
  }
});

/**
 * @route   GET /api/recommendations/jobs/:location
 * @desc    Get recommended jobs in a specific location (supports international locations)
 * @access  Public
 */
router.get('/jobs/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { skills = '', limit = 20 } = req.query;

    const jobs = [];
    const skillsArray = skills ? skills.split(',').map(s => s.trim()) : [];
    const skillsQuery = skillsArray.length > 0 ? skillsArray.join(' OR ') : 'developer';

    // 1. Use existing JSearch API (if configured) - supports international locations
    if (process.env.JSEARCH_API_KEY) {
      try {
        const jsearchJobs = await searchJSearchJobs(skillsQuery, location, limit);
        jobs.push(...jsearchJobs);
      } catch (error) {
        console.error('JSearch API error:', error.message);
      }
    }

    // 2. Fetch from Adzuna API (free tier available)
    if (adzuna.appId && adzuna.appKey) {
      try {
        const adzunaJobs = await adzuna.searchJobs(location, skillsArray.join(' '), limit);
        jobs.push(...adzunaJobs);
      } catch (error) {
        console.error('Adzuna API error:', error.message);
      }
    }

    // 3. Fetch from LinkedIn API (if key is configured)
    if (linkedin.apiKey && skillsArray.length > 0) {
      try {
        const linkedinJobs = await linkedin.searchJobs(skillsArray.join(','), location);
        jobs.push(...linkedinJobs);
      } catch (error) {
        console.error('LinkedIn Jobs API error:', error.message);
      }
    }

    // 4. Fetch from Unstop API (if key is configured)
    if (unstop.apiKey && skillsArray.length > 0) {
      try {
        const unstopJobs = await unstop.searchJobs(skillsArray.join(','), location);
        jobs.push(...unstopJobs);
      } catch (error) {
        console.error('Unstop Jobs API error:', error.message);
      }
    }

    // Remove duplicates and limit results
    const uniqueJobs = removeDuplicates(jobs, 'id').slice(0, limit);

    res.json({
      location: location,
      jobs: uniqueJobs,
      totalResults: uniqueJobs.length,
      skills: skillsArray,
      sources: getActiveSources()
    });

  } catch (error) {
    console.error('Job recommendations error:', error);
    res.status(500).json({ message: 'Error fetching job recommendations' });
  }
});

/**
 * @route   GET /api/recommendations/states
 * @desc    Get list of all US states
 * @access  Public
 */
router.get('/states', (req, res) => {
  res.json({
    states: US_STATES,
    total: US_STATES.length
  });
});

/**
 * @route   GET /api/recommendations/companies
 * @desc    Get recommended companies across all states or filtered
 * @access  Public
 */
router.get('/companies', async (req, res) => {
  try {
    const { state, limit = 20 } = req.query;

    if (state) {
      // Redirect to state-specific endpoint
      return res.redirect(`/api/recommendations/companies/${state}`);
    }

    // If no state specified, return companies from multiple popular states
    const popularStates = ['California', 'New York', 'Texas', 'Washington', 'Massachusetts'];
    const allCompanies = [];

    for (const stateName of popularStates) {
      try {
        const companies = await github.getCompaniesByState(stateName, Math.ceil(limit / popularStates.length));
        allCompanies.push(...companies);
      } catch (error) {
        console.error(`Error fetching companies for ${stateName}:`, error.message);
      }
    }

    const uniqueCompanies = removeDuplicates(allCompanies, 'name').slice(0, limit);

    res.json({
      companies: uniqueCompanies,
      totalResults: uniqueCompanies.length,
      states: popularStates,
      sources: getActiveSources()
    });

  } catch (error) {
    console.error('Companies recommendations error:', error);
    res.status(500).json({ message: 'Error fetching company recommendations' });
  }
});

/**
 * Helper function to search jobs using JSearch API (supports international locations)
 */
async function searchJSearchJobs(query, location, limit) {
  // Determine country code from location
  const countryCode = getCountryCodeFromLocation(location);
  
  const options = {
    method: 'GET',
    url: 'https://jsearch.p.rapidapi.com/search',
    params: {
      query: `${query} developer`,
      page: 1,
      num_pages: 1,
      country: countryCode,
      location: location,
      employment_types: 'FULLTIME,PARTTIME,INTERN'
    },
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  };

  const response = await axios.request(options);
  return (response.data.data || []).slice(0, limit).map(job => ({
    id: job.job_id,
    title: job.job_title,
    company: job.employer_name,
    location: job.job_city && job.job_state 
      ? `${job.job_city}, ${job.job_state}` 
      : job.job_city || location,
    description: job.job_description,
    requirements: job.job_highlights?.Qualifications || [],
    benefits: job.job_highlights?.Benefits || [],
    applyUrl: job.job_apply_link,
    postedDate: job.job_posted_at_datetime_utc,
    employmentType: job.job_employment_type,
    remote: job.job_is_remote || false,
    logo: job.employer_logo,
    source: 'jsearch'
  }));
}

/**
 * Helper function to get country code from location
 */
function getCountryCodeFromLocation(location) {
  const locationLower = location.toLowerCase();
  if (locationLower.includes('bangalore') || locationLower.includes('mumbai') || 
      locationLower.includes('delhi') || locationLower.includes('hyderabad') ||
      locationLower.includes('chennai') || locationLower.includes('pune') ||
      locationLower.includes('india')) {
    return 'IN';
  }
  if (locationLower.includes('london') || locationLower.includes('uk') ||
      locationLower.includes('united kingdom')) {
    return 'GB';
  }
  if (locationLower.includes('toronto') || locationLower.includes('vancouver') ||
      locationLower.includes('canada')) {
    return 'CA';
  }
  if (locationLower.includes('sydney') || locationLower.includes('melbourne') ||
      locationLower.includes('australia')) {
    return 'AU';
  }
  return 'US'; // Default to US
}

/**
 * Helper function to validate state
 */
function isValidState(state) {
  const normalized = state.toLowerCase().trim();
  return US_STATES.some(s => 
    s.toLowerCase() === normalized || 
    getStateAbbreviation(s).toLowerCase() === normalized
  );
}

/**
 * Helper function to get state abbreviation
 */
function getStateAbbreviation(state) {
  const stateMap = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const normalized = state.toLowerCase().trim();
  return stateMap[normalized] || (state.length === 2 ? state.toUpperCase() : state);
}

/**
 * Helper function to remove duplicate items
 */
function removeDuplicates(array, key) {
  const seen = new Set();
  return array.filter(item => {
    const value = item[key];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

/**
 * Helper function to get active API sources
 */
function getActiveSources() {
  const sources = ['github']; // GitHub is always available (free)
  
  if (process.env.LINKEDIN_API_KEY) {
    sources.push('linkedin');
  }
  
  if (process.env.UNSTOP_API_KEY) {
    sources.push('unstop');
  }
  
  if (process.env.JSEARCH_API_KEY) {
    sources.push('jsearch');
  }
  
  if (process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY) {
    sources.push('adzuna');
  }
  
  return sources;
}

module.exports = router;

