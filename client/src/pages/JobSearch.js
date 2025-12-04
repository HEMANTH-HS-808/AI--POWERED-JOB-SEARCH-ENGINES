import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  Search, 
  MapPin, 
  Clock, 
  ExternalLink, 
  Heart,
  HeartOff,
  Filter,
  Briefcase,
  Building,
  Calendar,
  DollarSign
} from 'lucide-react';

const JobSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('skills') || '');
  const [filters, setFilters] = useState({
    location: '',
    employmentType: '',
    remote: false
  });

  useEffect(() => {
    const skills = searchParams.get('skills');
    if (skills) {
      setSearchQuery(skills);
      handleSearch(skills);
    }
  }, [searchParams]);

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      toast.error('Please enter some skills to search for jobs');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        skills: query,
        ...(filters.location && { location: filters.location }),
        ...(filters.employmentType && { employmentType: filters.employmentType })
      });

      const response = await api.get(`/jobs/search?${params}`);
      setJobs(response.data.jobs || []);
      
      // Update URL
      setSearchParams({ skills: query });
    } catch (error) {
      console.error('Job search error:', error);
      toast.error('Failed to search for jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async (companyName, jobTitle) => {
    if (!isAuthenticated) {
      toast.error('Please login to save companies');
      return;
    }

    try {
      await api.post('/users/save-company', { 
        companyName, 
        jobTitle 
      });
      toast.success(`${companyName} saved to your profile!`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Company already saved');
      } else {
        toast.error('Failed to save company');
      }
    }
  };

  const isCompanySaved = (companyName) => {
    return user?.savedCompanies?.some(
      company => company.name.toLowerCase() === companyName.toLowerCase()
    );
  };

  const getEmploymentTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'fulltime': return 'bg-green-100 text-green-800';
      case 'parttime': return 'bg-blue-100 text-blue-800';
      case 'intern': return 'bg-purple-100 text-purple-800';
      case 'contract': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatEmploymentType = (type) => {
    switch (type?.toLowerCase()) {
      case 'fulltime': return 'Full-time';
      case 'parttime': return 'Part-time';
      case 'intern': return 'Internship';
      case 'contract': return 'Contract';
      default: return type || 'Not specified';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Job Search</h1>
          <p className="text-gray-600">Find opportunities that match your skills</p>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="card mb-8"
        >
          <div className="space-y-4">
            {/* Main Search */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="input pl-10"
                    placeholder="Enter skills (e.g., React, Python, Node.js)"
                  />
                </div>
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-primary px-8 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  'Search Jobs'
                )}
              </button>
            </div>

            {/* Filters */}
            <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  className="input"
                  placeholder="City, State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type
                </label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => setFilters(prev => ({ ...prev, employmentType: e.target.value }))}
                  className="input"
                >
                  <option value="">All Types</option>
                  <option value="FULLTIME">Full-time</option>
                  <option value="PARTTIME">Part-time</option>
                  <option value="INTERN">Internship</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.remote}
                    onChange={(e) => setFilters(prev => ({ ...prev, remote: e.target.checked }))}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Remote only</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching for jobs...</p>
            </div>
          ) : jobs.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-gray-600">
                  Found {jobs.length} job{jobs.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </p>
              </div>
              
              <div className="grid gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            <div className="flex items-center space-x-4 text-gray-600 mb-2">
                              <div className="flex items-center space-x-1">
                                <Building className="h-4 w-4" />
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              {job.remote && (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                  Remote
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {isAuthenticated && (
                            <button
                              onClick={() => handleSaveCompany(job.company, job.title)}
                              className={`p-2 rounded-full transition-colors ${
                                isCompanySaved(job.company)
                                  ? 'text-red-500 hover:text-red-600'
                                  : 'text-gray-400 hover:text-red-500'
                              }`}
                              title={isCompanySaved(job.company) ? 'Already saved' : 'Save company'}
                            >
                              {isCompanySaved(job.company) ? (
                                <Heart className="h-5 w-5 fill-current" />
                              ) : (
                                <HeartOff className="h-5 w-5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEmploymentTypeColor(job.employmentType)}`}>
                            {formatEmploymentType(job.employmentType)}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(job.postedDate).toLocaleDateString()}
                          </span>
                        </div>

                        {job.description && (
                          <p className="text-gray-600 mb-4 line-clamp-3">
                            {job.description.length > 200 
                              ? `${job.description.substring(0, 200)}...` 
                              : job.description
                            }
                          </p>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                            <div className="flex flex-wrap gap-1">
                              {job.requirements.slice(0, 5).map((req, idx) => (
                                <span
                                  key={idx}
                                  className="bg-primary-50 text-primary-700 px-2 py-1 rounded text-xs"
                                >
                                  {req}
                                </span>
                              ))}
                              {job.requirements.length > 5 && (
                                <span className="text-gray-500 text-xs">
                                  +{job.requirements.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row gap-3 mt-4 md:mt-0 md:ml-6">
                        <Link
                          to={`/company/${encodeURIComponent(job.company)}`}
                          state={{ job }}
                          className="btn-outline text-center"
                        >
                          <Briefcase className="h-4 w-4 mr-2" />
                          View Company
                        </Link>
                        {job.applyUrl && (
                          <a
                            href={job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-primary text-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Apply Now
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="text-center py-12">
              <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search terms or filters to find more opportunities.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setJobs([]);
                }}
                className="btn-outline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start your job search</h3>
              <p className="text-gray-600">
                Enter your skills above to find relevant job opportunities.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobSearch;