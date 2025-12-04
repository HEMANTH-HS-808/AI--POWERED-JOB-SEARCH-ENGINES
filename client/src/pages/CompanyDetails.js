import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  ExternalLink, 
  Heart,
  HeartOff,
  Brain,
  ArrowLeft,
  Building,
  MapPin,
  Users,
  Briefcase,
  Sparkles,
  TrendingUp,
  BookOpen,
  Target
} from 'lucide-react';

const CompanyDetails = () => {
  const { companyName } = useParams();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [company, setCompany] = useState(null);
  const [careerPath, setCareerPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCareerPath, setShowCareerPath] = useState(false);
  
  const job = location.state?.job;

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyName]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get(`/jobs/company/${encodeURIComponent(companyName)}`);
      setCompany(response.data.company);
    } catch (error) {
      console.error('Fetch company error:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save companies');
      return;
    }

    try {
      await api.post('/users/save-company', { 
        companyName: company.name,
        jobTitle: job?.title || ''
      });
      toast.success(`${company.name} saved to your profile!`);
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Company already saved');
      } else {
        toast.error('Failed to save company');
      }
    }
  };

  const generateCareerPath = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to get AI career guidance');
      return;
    }

    setAiLoading(true);
    setShowCareerPath(true);

    try {
      const response = await api.post('/ai/career-path', {
        companyName: company.name,
        userSkills: user?.skills || []
      });
      
      setCareerPath(response.data.careerPath);
      toast.success('Career path generated successfully!');
    } catch (error) {
      console.error('Career path error:', error);
      toast.error('Failed to generate career path');
      setShowCareerPath(false);
    } finally {
      setAiLoading(false);
    }
  };

  const isCompanySaved = () => {
    return user?.savedCompanies?.some(
      savedCompany => savedCompany.name.toLowerCase() === company?.name.toLowerCase()
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading company details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Link
            to="/search"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Search
          </Link>
        </motion.div>

        {/* Company Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                {company?.logo ? (
                  <img
                    src={company.logo}
                    alt={`${company.name} logo`}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Building className="h-8 w-8 text-primary-600" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{company?.name}</h1>
                  {company?.industry && (
                    <p className="text-gray-600">{company.industry}</p>
                  )}
                </div>
              </div>

              {company?.location && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{company.location}</span>
                </div>
              )}

              <p className="text-gray-700 mb-6">
                {company?.description || `${company?.name} is a leading technology company focused on innovation and growth.`}
              </p>

              {job && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Viewing for: {job.title}
                  </h3>
                  <div className="text-sm text-blue-700">
                    <p><strong>Location:</strong> {job.location}</p>
                    <p><strong>Type:</strong> {job.employmentType}</p>
                    {job.postedDate && (
                      <p><strong>Posted:</strong> {new Date(job.postedDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3 mt-6 md:mt-0 md:ml-6">
              {isAuthenticated && (
                <button
                  onClick={handleSaveCompany}
                  className={`btn-outline ${
                    isCompanySaved() ? 'text-red-600 border-red-600' : ''
                  }`}
                >
                  {isCompanySaved() ? (
                    <>
                      <Heart className="h-4 w-4 mr-2 fill-current" />
                      Saved
                    </>
                  ) : (
                    <>
                      <HeartOff className="h-4 w-4 mr-2" />
                      Save Company
                    </>
                  )}
                </button>
              )}
              
              {company?.websiteUrl && (
                <a
                  href={company.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </a>
              )}
            </div>
          </div>
        </motion.div>

        {/* AI Career Path Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="card mb-8"
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-full mb-4">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              AI Career Path Advisor
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get personalized learning recommendations to land your dream job at {company?.name}. 
              Our AI analyzes your current skills and creates a tailored roadmap for success.
            </p>
          </div>

          {!showCareerPath ? (
            <div className="text-center">
              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <Target className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Skill Analysis</h3>
                      <p className="text-sm text-gray-600">Compare your skills with job requirements</p>
                    </div>
                    <div className="text-center">
                      <BookOpen className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Learning Path</h3>
                      <p className="text-sm text-gray-600">Get step-by-step learning recommendations</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-gray-900">Career Growth</h3>
                      <p className="text-sm text-gray-600">Accelerate your career progression</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={generateCareerPath}
                    disabled={aiLoading}
                    className="btn-primary text-lg px-8 py-3"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    What should I learn to get a job here?
                  </button>
                  
                  {user?.skills && user.skills.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">Your current skills:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {user.skills.slice(0, 8).map((skill) => (
                          <span
                            key={skill}
                            className="bg-primary-100 text-primary-800 px-2 py-1 rounded-full text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 8 && (
                          <span className="text-gray-500 text-xs">
                            +{user.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Tip:</strong> Add your skills in your{' '}
                        <Link to="/profile" className="underline">profile</Link>{' '}
                        to get more personalized recommendations.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Login Required
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Sign in to get personalized AI career guidance tailored to your skills and goals.
                  </p>
                  <div className="space-x-4">
                    <Link to="/login" className="btn-primary">
                      Login
                    </Link>
                    <Link to="/register" className="btn-outline">
                      Sign Up Free
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              {aiLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    AI is analyzing your skills and generating a personalized career path...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              ) : careerPath ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      Your Personalized Career Path
                    </h3>
                    <button
                      onClick={() => {
                        setShowCareerPath(false);
                        setCareerPath('');
                      }}
                      className="btn-outline text-sm"
                    >
                      Generate New Path
                    </button>
                  </div>
                  
                  <div className="prose prose-blue max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-6">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">{children}</h3>,
                        p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-4 text-gray-700">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-700">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                      }}
                    >
                      {careerPath}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-red-600">Failed to generate career path. Please try again.</p>
                  <button
                    onClick={generateCareerPath}
                    className="btn-primary mt-4"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Company Stats */}
        {company && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="card text-center">
              <Building className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Industry</h3>
              <p className="text-gray-600">{company.industry || 'Technology'}</p>
            </div>
            
            <div className="card text-center">
              <Users className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Company Size</h3>
              <p className="text-gray-600">Growing Team</p>
            </div>
            
            <div className="card text-center">
              <TrendingUp className="h-8 w-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">Growth Stage</h3>
              <p className="text-gray-600">Expanding</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetails;