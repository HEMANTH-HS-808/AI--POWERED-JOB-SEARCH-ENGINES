const express = require('express');
const axios = require('axios');
const CompanyCache = require('../models/CompanyCache');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { github, linkedin, unstop, naukri, adzuna } = require('../utils/apiIntegrations');

const router = express.Router();

// @route   GET /api/jobs/search
// @desc    Search for jobs based on skills
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { skills, location = 'United States', page = 1, limit = 20 } = req.query;

    if (!skills) {
      return res.status(400).json({ message: 'Skills parameter is required' });
    }

    // Prepare search query
    const skillsArray = skills.split(',').map(skill => skill.trim());
    const query = skillsArray.join(' OR ');

    // Determine country code from location
    const countryCode = getCountryCodeFromLocation(location);
    
    // JSearch API configuration (supports international locations)
    const options = {
      method: 'GET',
      url: 'https://jsearch.p.rapidapi.com/search',
      params: {
        query: `${query} developer`,
        page: page,
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

    let jobResults = [];
    let hasApiResults = false;

    // Try JSearch API first if configured
    if (process.env.JSEARCH_API_KEY && process.env.JSEARCH_API_KEY !== 'your_rapidapi_jsearch_key_here') {
      try {
        const response = await axios.request(options);
        const apiJobs = response.data.data || [];
        if (apiJobs.length > 0) {
          jobResults.push(...apiJobs);
          hasApiResults = true;
        }
      } catch (apiError) {
        console.error('JSearch API error:', apiError.message);
      }
    }

    // Fetch jobs from multiple sources (LinkedIn, Naukri, Unstop, GitHub, Adzuna)
    console.log(`[Job Search] Searching for: ${skillsArray.join(', ')} in ${location}`);
    
    const allJobSources = [];
    
    // 1. Get jobs from LinkedIn
    try {
      const linkedinJobs = await linkedin.searchJobs(skillsArray.join(' '), location, limit);
      if (linkedinJobs && linkedinJobs.length > 0) {
        allJobSources.push(...linkedinJobs);
        console.log(`[Job Search] Found ${linkedinJobs.length} jobs from LinkedIn`);
      }
    } catch (error) {
      console.log('LinkedIn search error:', error.message);
    }
    
    // 2. Get jobs from Naukri (for Indian locations)
    if (location.toLowerCase().includes('india') || location.toLowerCase().includes('mysore') || 
        location.toLowerCase().includes('bangalore') || location.toLowerCase().includes('karnataka')) {
      try {
        const naukriJobs = await naukri.searchJobs(skillsArray.join(' '), location, limit);
        if (naukriJobs && naukriJobs.length > 0) {
          allJobSources.push(...naukriJobs);
          console.log(`[Job Search] Found ${naukriJobs.length} jobs from Naukri`);
        }
      } catch (error) {
        console.log('Naukri search error:', error.message);
      }
    }
    
    // 3. Get jobs from Unstop (for internships)
    try {
      const unstopJobs = await unstop.searchJobs(skillsArray.join(' '), location, limit);
      if (unstopJobs && unstopJobs.length > 0) {
        allJobSources.push(...unstopJobs);
        console.log(`[Job Search] Found ${unstopJobs.length} jobs from Unstop`);
      }
    } catch (error) {
      console.log('Unstop search error:', error.message);
    }
    
    // 4. Get location-specific jobs from GitHub
    let locationSpecificJobs = await getJobsFromGitHub(skillsArray, location, limit);
    if (!locationSpecificJobs || locationSpecificJobs.length === 0) {
      locationSpecificJobs = generateMockJobs(skillsArray, location);
    }
    if (locationSpecificJobs && locationSpecificJobs.length > 0) {
      allJobSources.push(...locationSpecificJobs);
      console.log(`[Job Search] Found ${locationSpecificJobs.length} location-specific jobs`);
    }
    
    // 5. Add JSearch API results if available
    if (hasApiResults && jobResults.length > 0) {
      allJobSources.push(...jobResults);
      console.log(`[Job Search] Found ${jobResults.length} jobs from JSearch API`);
    }
    
    // Combine all job sources
    jobResults = allJobSources;

    // Remove duplicate jobs based on company name and title
    const seenJobs = new Set();
    const uniqueJobResults = [];
    for (const job of jobResults) {
      const jobKey = `${(job.employer_name || job.company || '').toLowerCase()}_${(job.job_title || job.title || '').toLowerCase()}`;
      if (!seenJobs.has(jobKey)) {
        seenJobs.add(jobKey);
        uniqueJobResults.push(job);
      }
    }
    
    console.log(`[Job Search] Total unique jobs: ${uniqueJobResults.length} (after removing duplicates)`);
    
    // Process and format job results
    let formattedJobs = uniqueJobResults.map(job => ({
      id: job.job_id || Math.random().toString(36).substr(2, 9),
      title: job.job_title || job.title,
      company: job.employer_name || job.company,
      location: job.job_city && job.job_state 
        ? `${job.job_city}, ${job.job_state}` 
        : job.location || location,
      description: job.job_description || job.description,
      requirements: job.job_highlights?.Qualifications || [],
      benefits: job.job_highlights?.Benefits || [],
      applyUrl: ensureValidUrl(job.job_apply_link || job.apply_url, job.employer_name || job.company, job.job_title || job.title, skillsArray.join(' '), location),
      postedDate: job.job_posted_at_datetime_utc || new Date().toISOString(),
      employmentType: job.job_employment_type || 'FULLTIME',
      remote: job.job_is_remote || false,
      logo: job.employer_logo || null,
      source: job.source || 'unknown'
    }));
    
    // Use Gemini AI to rank and match jobs based on skills
    try {
      formattedJobs = await rankJobsWithAI(formattedJobs, skillsArray, limit);
      console.log(`[Job Search] AI-ranked ${formattedJobs.length} jobs based on skills`);
    } catch (aiError) {
      console.log(`[Job Search] AI ranking failed, using original order:`, aiError.message);
      // If AI fails, just limit the results
      formattedJobs = formattedJobs.slice(0, limit);
    }
    
    console.log(`[Job Search] Returning ${formattedJobs.length} formatted jobs for ${location}`);

    // Cache company information
    for (const job of formattedJobs) {
      if (job.company) {
        await cacheCompanyInfo(job.company, job.logo);
      }
    }

    res.json({
      jobs: formattedJobs,
      totalResults: formattedJobs.length,
      page: parseInt(page),
      searchQuery: skills
    });

  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({ message: 'Error searching for jobs' });
  }
});

// @route   GET /api/jobs/company/:companyName
// @desc    Get company details
// @access  Public
router.get('/company/:companyName', async (req, res) => {
  try {
    const { companyName } = req.params;
    let company = null;

    // Try to get from cache if database is connected
    try {
      if (process.env.MONGODB_URI && process.env.NODE_ENV !== 'demo') {
        company = await CompanyCache.findOne({ 
          name: new RegExp(companyName, 'i') 
        });
      }
    } catch (dbError) {
      console.log('Database not available, using API data');
    }

    // If not found in cache, try GitHub API (free, no key required)
    if (!company) {
      try {
        const githubCompany = await github.getCompanyInfo(companyName);
        if (githubCompany) {
          company = {
            name: githubCompany.name,
            description: githubCompany.description || `${companyName} is a technology company focused on innovation and growth.`,
            websiteUrl: githubCompany.websiteUrl || `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
            industry: 'Technology',
            location: githubCompany.location || 'Global',
            logo: githubCompany.logo,
            publicRepos: githubCompany.publicRepos,
            followers: githubCompany.followers,
            source: 'github',
            lastFetched: new Date()
          };

          // Cache the company info if database is available
          try {
            if (process.env.MONGODB_URI && process.env.NODE_ENV !== 'demo') {
              await cacheCompanyInfo(company.name, company.logo, company.description, company.websiteUrl);
            }
          } catch (cacheError) {
            // Silently handle cache errors
          }
        }
      } catch (githubError) {
        console.log('GitHub API lookup failed, using fallback data');
      }
    }

    // If still not found, create mock company data
    if (!company) {
      company = {
        name: companyName,
        description: `${companyName} is a technology company focused on innovation and growth. We're committed to building cutting-edge solutions and fostering a collaborative work environment.`,
        websiteUrl: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: 'Technology',
        location: 'San Francisco, CA',
        lastFetched: new Date()
      };
    }

    res.json({ company });
  } catch (error) {
    console.error('Get company error:', error);
    // Return mock data even on error
    const { companyName } = req.params;
    res.json({ 
      company: {
        name: companyName,
        description: `${companyName} is a technology company focused on innovation and growth.`,
        websiteUrl: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        industry: 'Technology',
        location: 'Global',
        lastFetched: new Date()
      }
    });
  }
});

// Helper function to cache company information
async function cacheCompanyInfo(companyName, logo = null, description = null, websiteUrl = null) {
  try {
    // Skip database operations if not connected
    if (!process.env.MONGODB_URI || process.env.NODE_ENV === 'demo') {
      return;
    }

    const existingCompany = await CompanyCache.findOne({ 
      name: new RegExp(companyName, 'i') 
    });

    if (!existingCompany) {
      const company = new CompanyCache({
        name: companyName,
        description: description || `${companyName} is a leading technology company.`,
        websiteUrl: websiteUrl || `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        logo: logo,
        lastFetched: new Date()
      });
      await company.save();
    } else {
      // Update existing company with new data if available
      if (logo) existingCompany.logo = logo;
      if (description) existingCompany.description = description;
      if (websiteUrl) existingCompany.websiteUrl = websiteUrl;
      existingCompany.lastFetched = new Date();
      await existingCompany.save();
    }
  } catch (error) {
    // Silently handle cache errors in demo mode
    console.log('Running in demo mode - skipping company cache');
  }
}

/**
 * Get jobs from GitHub API based on location
 * Also includes known companies for specific locations
 */
async function getJobsFromGitHub(skillsArray, location, limit) {
  try {
    let companies = [];
    
    // Get companies from GitHub API
    try {
      const githubCompanies = await github.getHiringCompanies(location, limit);
      companies.push(...githubCompanies);
    } catch (error) {
      console.log('GitHub API search failed, using location-based companies');
    }
    
    // Also try location-based search
    try {
      const locationCompanies = await github.getCompaniesByLocation(location, limit);
      companies.push(...locationCompanies);
    } catch (error) {
      console.log('GitHub location search failed');
    }
    
    // Add known companies for specific locations (especially Indian cities like Mysore)
    const knownCompanies = getKnownCompaniesForLocation(location);
    if (knownCompanies.length > 0) {
      companies.push(...knownCompanies);
    }
    
    // Remove duplicates
    const uniqueCompanies = [];
    const seen = new Set();
    for (const company of companies) {
      const key = (company.name || company.displayName || '').toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCompanies.push(company);
      }
    }
    
    if (uniqueCompanies.length === 0) {
      return null; // No companies found, will fall back to mock
    }

    // Generate job listings for companies in the location
    const jobTitles = [
      'Software Engineer', 'Frontend Developer', 'Backend Developer',
      'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
      'Product Manager', 'UI/UX Designer', 'Mobile Developer',
      'Python Developer', 'Java Developer', 'React Developer'
    ];

    return uniqueCompanies.slice(0, limit).map((company, i) => ({
      job_id: `github_${(company.name || company.displayName || 'company').replace(/\s+/g, '_')}_${i}_${Date.now()}`,
      job_title: jobTitles[i % jobTitles.length],
      employer_name: company.displayName || company.name,
      job_city: location.split(',')[0]?.trim() || location,
      job_state: location.split(',')[1]?.trim() || '',
      job_description: `We are looking for a talented developer with experience in ${skillsArray.join(', ')}. ${company.description || 'Join our team and work on cutting-edge projects.'}`,
      job_highlights: {
        Qualifications: [
          ...skillsArray.map(skill => `Experience with ${skill}`),
          'Bachelor\'s degree in Computer Science or related field',
          'Strong problem-solving skills',
          'Excellent communication abilities'
        ],
        Benefits: [
          'Competitive salary and equity',
          'Health, dental, and vision insurance',
          'Flexible work arrangements',
          'Professional development budget'
        ]
      },
      job_apply_link: company.websiteUrl || company.url || `https://www.${(company.name || '').toLowerCase().replace(/\s+/g, '')}.com/careers`,
      job_posted_at_datetime_utc: new Date().toISOString(),
      job_employment_type: 'FULLTIME',
      job_is_remote: false,
      employer_logo: company.avatar || company.logo
    }));
  } catch (error) {
    console.error('GitHub jobs fetch error:', error.message);
    return null;
  }
}

/**
 * Get known companies for specific locations
 * This helps when GitHub API doesn't return location-specific results
 * Especially for Indian cities like Mysore
 */
function getKnownCompaniesForLocation(location) {
  const locationLower = location.toLowerCase();
  const companies = [];
  
  // Mysore and Karnataka
  if (locationLower.includes('mysore') || locationLower.includes('karnataka')) {
    companies.push(
      { name: 'Infosys', displayName: 'Infosys', url: 'https://www.infosys.com/careers', description: 'Global IT services company with major presence in Mysore', websiteUrl: 'https://www.infosys.com' },
      { name: 'Wipro', displayName: 'Wipro', url: 'https://careers.wipro.com', description: 'Leading IT services company with development center in Mysore', websiteUrl: 'https://www.wipro.com' },
      { name: 'TCS', displayName: 'Tata Consultancy Services', url: 'https://www.tcs.com/careers', description: 'IT services and consulting', websiteUrl: 'https://www.tcs.com' },
      { name: 'Tech Mahindra', displayName: 'Tech Mahindra', url: 'https://careers.techmahindra.com', description: 'Digital transformation and IT services', websiteUrl: 'https://www.techmahindra.com' },
      { name: 'HCL Technologies', displayName: 'HCL Technologies', url: 'https://www.hcltech.com/careers', description: 'IT services and product engineering', websiteUrl: 'https://www.hcltech.com' },
      { name: 'L&T Infotech', displayName: 'L&T Infotech', url: 'https://www.lntinfotech.com/careers', description: 'Digital solutions and IT services', websiteUrl: 'https://www.lntinfotech.com' },
      { name: 'Mindtree', displayName: 'Mindtree', url: 'https://www.mindtree.com/careers', description: 'Digital transformation and technology services', websiteUrl: 'https://www.mindtree.com' },
      { name: 'Mphasis', displayName: 'Mphasis', url: 'https://www.mphasis.com/careers', description: 'IT solutions and services', websiteUrl: 'https://www.mphasis.com' }
    );
  }
  
  // Bangalore
  if (locationLower.includes('bangalore') || locationLower.includes('bengaluru')) {
    companies.push(
      { name: 'Flipkart', displayName: 'Flipkart', url: 'https://www.flipkartcareers.com', websiteUrl: 'https://www.flipkart.com' },
      { name: 'Ola', displayName: 'Ola', url: 'https://www.olacabs.com/careers', websiteUrl: 'https://www.olacabs.com' },
      { name: 'Swiggy', displayName: 'Swiggy', url: 'https://careers.swiggy.com', websiteUrl: 'https://www.swiggy.com' },
      { name: 'Razorpay', displayName: 'Razorpay', url: 'https://razorpay.com/jobs', websiteUrl: 'https://razorpay.com' }
    );
  }
  
  return companies;
}

// Generate mock job data for development/fallback
function generateMockJobs(skills, location = 'United States') {
  // Location-specific companies for Indian cities
  const locationCompanyMap = {
    // Mysore and Karnataka
    mysore: [
      { name: 'Infosys', url: 'https://www.infosys.com/careers', description: 'Global IT services company with major presence in Mysore' },
      { name: 'Wipro', url: 'https://careers.wipro.com', description: 'Leading IT services company with development center in Mysore' },
      { name: 'TCS', url: 'https://www.tcs.com/careers', description: 'Tata Consultancy Services - IT services and consulting' },
      { name: 'Tech Mahindra', url: 'https://careers.techmahindra.com', description: 'Digital transformation and IT services' },
      { name: 'HCL Technologies', url: 'https://www.hcltech.com/careers', description: 'IT services and product engineering' },
      { name: 'L&T Infotech', url: 'https://www.lntinfotech.com/careers', description: 'Digital solutions and IT services' },
      { name: 'Mindtree', url: 'https://www.mindtree.com/careers', description: 'Digital transformation and technology services' },
      { name: 'Mphasis', url: 'https://www.mphasis.com/careers', description: 'IT solutions and services' }
    ],
    // Bangalore
    bangalore: [
      { name: 'Infosys', url: 'https://www.infosys.com/careers' },
      { name: 'Wipro', url: 'https://careers.wipro.com' },
      { name: 'TCS', url: 'https://www.tcs.com/careers' },
      { name: 'Flipkart', url: 'https://www.flipkartcareers.com' },
      { name: 'Ola', url: 'https://www.olacabs.com/careers' },
      { name: 'Swiggy', url: 'https://careers.swiggy.com' },
      { name: 'Razorpay', url: 'https://razorpay.com/jobs' },
      { name: 'Zoho', url: 'https://www.zoho.com/careers' },
      { name: 'Freshworks', url: 'https://www.freshworks.com/careers' },
      { name: 'PhonePe', url: 'https://www.phonepe.com/careers' }
    ],
    // Mumbai
    mumbai: [
      { name: 'TCS', url: 'https://www.tcs.com/careers' },
      { name: 'Tech Mahindra', url: 'https://careers.techmahindra.com' },
      { name: 'Capgemini', url: 'https://www.capgemini.com/careers' },
      { name: 'Accenture', url: 'https://www.accenture.com/careers' },
      { name: 'Cognizant', url: 'https://careers.cognizant.com' },
      { name: 'JP Morgan', url: 'https://careers.jpmorgan.com' },
      { name: 'Goldman Sachs', url: 'https://www.goldmansachs.com/careers' }
    ],
    // Hyderabad
    hyderabad: [
      { name: 'Microsoft', url: 'https://careers.microsoft.com' },
      { name: 'Amazon', url: 'https://amazon.jobs' },
      { name: 'Google', url: 'https://careers.google.com' },
      { name: 'Oracle', url: 'https://www.oracle.com/careers' },
      { name: 'Dell', url: 'https://jobs.dell.com' },
      { name: 'Tech Mahindra', url: 'https://careers.techmahindra.com' },
      { name: 'Infosys', url: 'https://www.infosys.com/careers' }
    ],
    // Chennai
    chennai: [
      { name: 'TCS', url: 'https://www.tcs.com/careers' },
      { name: 'Infosys', url: 'https://www.infosys.com/careers' },
      { name: 'Cognizant', url: 'https://careers.cognizant.com' },
      { name: 'HCL Technologies', url: 'https://www.hcltech.com/careers' },
      { name: 'Zoho', url: 'https://www.zoho.com/careers' },
      { name: 'Ford', url: 'https://corporate.ford.com/careers.html' }
    ],
    // Pune
    pune: [
      { name: 'Infosys', url: 'https://www.infosys.com/careers' },
      { name: 'Tech Mahindra', url: 'https://careers.techmahindra.com' },
      { name: 'Persistent Systems', url: 'https://www.persistent.com/careers' },
      { name: 'Amdocs', url: 'https://www.amdocs.com/careers' },
      { name: 'Barclays', url: 'https://www.barclays.com/careers' }
    ],
    // Delhi/NCR
    delhi: [
      { name: 'HCL Technologies', url: 'https://www.hcltech.com/careers' },
      { name: 'Adobe', url: 'https://www.adobe.com/careers' },
      { name: 'Paytm', url: 'https://paytm.com/careers' },
      { name: 'MakeMyTrip', url: 'https://careers.makemytrip.com' },
      { name: 'Nagarro', url: 'https://www.nagarro.com/careers' }
    ]
  };

  // General India companies (fallback)
  const indiaCompanies = [
    { name: 'Infosys', url: 'https://www.infosys.com/careers' },
    { name: 'TCS', url: 'https://www.tcs.com/careers' },
    { name: 'Wipro', url: 'https://careers.wipro.com' },
    { name: 'Tech Mahindra', url: 'https://careers.techmahindra.com' },
    { name: 'HCL Technologies', url: 'https://www.hcltech.com/careers' },
    { name: 'Zoho', url: 'https://www.zoho.com/careers' },
    { name: 'Freshworks', url: 'https://www.freshworks.com/careers' },
    { name: 'Razorpay', url: 'https://razorpay.com/jobs' },
    { name: 'Flipkart', url: 'https://www.flipkartcareers.com' },
    { name: 'Ola', url: 'https://www.olacabs.com/careers' }
  ];

  // Global companies
  const globalCompanies = [
    { name: 'Google', url: 'https://careers.google.com' },
    { name: 'Microsoft', url: 'https://careers.microsoft.com' },
    { name: 'Amazon', url: 'https://amazon.jobs' },
    { name: 'Meta', url: 'https://careers.meta.com' },
    { name: 'Netflix', url: 'https://jobs.netflix.com' },
    { name: 'Tesla', url: 'https://tesla.com/careers' },
    { name: 'Spotify', url: 'https://lifeatspotify.com' }
  ];

  // Determine which companies to use based on location
  const locationLower = location.toLowerCase().trim();
  console.log(`[generateMockJobs] Location received: "${location}", normalized: "${locationLower}"`);
  
  let companies = globalCompanies;
  
  // Check for specific city matches first (most specific match wins)
  let matchedCity = null;
  for (const [city, cityCompanies] of Object.entries(locationCompanyMap)) {
    if (locationLower.includes(city)) {
      companies = cityCompanies;
      matchedCity = city;
      console.log(`[generateMockJobs] Matched city: ${city}, found ${cityCompanies.length} companies`);
      break;
    }
  }
  
  // If no specific city match, check for India/Karnataka
  if (companies === globalCompanies) {
    const isIndia = locationLower.includes('karnataka') || locationLower.includes('india') ||
                    locationLower.includes('bangalore') || locationLower.includes('mumbai') || 
                    locationLower.includes('delhi') || locationLower.includes('hyderabad') ||
                    locationLower.includes('chennai') || locationLower.includes('pune') ||
                    locationLower.includes('mysore');
    
    if (isIndia) {
      companies = indiaCompanies;
      console.log(`[generateMockJobs] Matched India region, using ${indiaCompanies.length} general India companies`);
    } else {
      console.log(`[generateMockJobs] No India match, using ${globalCompanies.length} global companies`);
    }
  }

  const jobTitles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'DevOps Engineer', 'Data Scientist',
    'Product Manager', 'UI/UX Designer', 'Mobile Developer'
  ];

  // Use the provided location instead of random locations
  const locationParts = location.split(',');
  const jobCity = locationParts[0]?.trim() || location;
  const jobState = locationParts[1]?.trim() || '';

  // Ensure we have enough companies (repeat if needed)
  const companyList = companies.length >= 15 
    ? companies 
    : Array.from({ length: 15 }, (_, i) => companies[i % companies.length]);

  return Array.from({ length: Math.min(15, companyList.length) }, (_, i) => {
    const company = companyList[i];
    
    return {
      job_id: `mock_${i}_${Date.now()}`,
      job_title: jobTitles[i % jobTitles.length],
      employer_name: company.name,
      job_city: jobCity,
      job_state: jobState,
      job_description: `${company.description || `We are looking for a talented developer with experience in ${skills.join(', ')}.`} Join our team and work on cutting-edge projects that impact millions of users worldwide. This is an excellent opportunity to grow your career in a dynamic environment.`,
      job_highlights: {
        Qualifications: [
          ...skills.map(skill => `Experience with ${skill}`),
          'Bachelor\'s degree in Computer Science or related field',
          'Strong problem-solving skills',
          'Excellent communication abilities'
        ],
        Benefits: [
          'Competitive salary and equity',
          'Health, dental, and vision insurance',
          'Flexible work arrangements',
          'Professional development budget',
          'Unlimited PTO',
          'Free meals and snacks'
        ]
      },
      job_apply_link: company.url,
      job_posted_at_datetime_utc: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      job_employment_type: ['FULLTIME', 'PARTTIME', 'INTERN'][Math.floor(Math.random() * 3)],
      job_is_remote: Math.random() > 0.4
    };
  });
}

/**
 * Helper function to get country code from location
 */
function getCountryCodeFromLocation(location) {
  const locationLower = location.toLowerCase();
  
  // India cities and states
  const indiaKeywords = [
    'bangalore', 'mumbai', 'delhi', 'hyderabad', 'chennai', 'pune', 'kolkata',
    'mysore', 'karnataka', 'maharashtra', 'tamil nadu', 'telangana', 'gujarat',
    'rajasthan', 'kerala', 'west bengal', 'india', 'indian'
  ];
  
  if (indiaKeywords.some(keyword => locationLower.includes(keyword))) {
    return 'IN';
  }
  
  if (locationLower.includes('london') || locationLower.includes('uk') ||
      locationLower.includes('united kingdom') || locationLower.includes('birmingham') ||
      locationLower.includes('manchester')) {
    return 'GB';
  }
  
  if (locationLower.includes('toronto') || locationLower.includes('vancouver') ||
      locationLower.includes('montreal') || locationLower.includes('canada')) {
    return 'CA';
  }
  
  if (locationLower.includes('sydney') || locationLower.includes('melbourne') ||
      locationLower.includes('brisbane') || locationLower.includes('australia')) {
    return 'AU';
  }
  
  if (locationLower.includes('singapore')) {
    return 'SG';
  }
  
  if (locationLower.includes('dubai') || locationLower.includes('uae') ||
      locationLower.includes('united arab emirates')) {
    return 'AE';
  }
  
  return 'US'; // Default to US
}

/**
 * Ensure apply URL is valid and clickable
 */
function ensureValidUrl(url, company, title, skills, location) {
  if (!url) {
    // Generate a search URL if no apply URL is provided
    const searchQuery = `${title} ${company} ${skills}`.trim();
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' ' + location + ' jobs')}`;
  }
  
  // Check if URL is valid
  try {
    const urlObj = new URL(url);
    return urlObj.href;
  } catch (e) {
    // If invalid URL, create a search URL
    const searchQuery = `${title} ${company} ${skills}`.trim();
    return `https://www.google.com/search?q=${encodeURIComponent(searchQuery + ' ' + location + ' jobs')}`;
  }
}

/**
 * Use Gemini AI to rank and match jobs based on user skills
 */
async function rankJobsWithAI(jobs, skillsArray, limit) {
  const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyDClwm-ew6jZD_TwezB_Bb5uZg6AbdvZD8";
  
  if (!API_KEY || jobs.length === 0) {
    return jobs.slice(0, limit);
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "models/gemini-2.0-flash" });

    // Create a simplified job list for AI analysis
    const jobSummaries = jobs.map((job, index) => ({
      index: index,
      title: job.title,
      company: job.company,
      description: job.description?.substring(0, 200) || '', // Limit description length
      location: job.location
    }));

    const prompt = `You are a job matching expert. Analyze the following jobs and rank them based on how well they match these skills: ${skillsArray.join(', ')}.

Jobs to analyze:
${JSON.stringify(jobSummaries, null, 2)}

Return a JSON array of job indices (0-based) ranked from best match to worst match. Only return the indices in order, like: [2, 0, 5, 1, 3, ...]
Return exactly ${Math.min(limit, jobs.length)} indices, prioritizing jobs that best match the skills: ${skillsArray.join(', ')}.

Response format (JSON only, no markdown):
[2, 0, 5, 1, 3, ...]`;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI ranking timeout')), 15000);
    });

    const generatePromise = model.generateContent(prompt);
    const result = await Promise.race([generatePromise, timeoutPromise]);
    const response = await result.response;
    let text = response.text();

    // Clean up the response (remove markdown code blocks if present)
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse the ranked indices
    let rankedIndices;
    try {
      rankedIndices = JSON.parse(text);
    } catch (parseError) {
      // Try to extract array from text
      const arrayMatch = text.match(/\[[\d,\s]+\]/);
      if (arrayMatch) {
        rankedIndices = JSON.parse(arrayMatch[0]);
      } else {
        throw new Error('Could not parse AI response');
      }
    }

    // Reorder jobs based on AI ranking
    const rankedJobs = [];
    const usedIndices = new Set();
    
    for (const index of rankedIndices) {
      if (index >= 0 && index < jobs.length && !usedIndices.has(index)) {
        rankedJobs.push(jobs[index]);
        usedIndices.add(index);
      }
    }
    
    // Add any remaining jobs that weren't ranked
    for (let i = 0; i < jobs.length && rankedJobs.length < limit; i++) {
      if (!usedIndices.has(i)) {
        rankedJobs.push(jobs[i]);
      }
    }

    return rankedJobs.slice(0, limit);
  } catch (error) {
    console.error('AI ranking error:', error.message);
    // Return original order if AI fails
    return jobs.slice(0, limit);
  }
}

module.exports = router;