import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Users, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Target,
  BookOpen
} from 'lucide-react';

const Home = () => {
  const [searchSkills, setSearchSkills] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchSkills.trim()) {
      navigate(`/search?skills=${encodeURIComponent(searchSkills.trim())}`);
    }
  };

  const features = [
    {
      icon: Search,
      title: 'Skill-Based Job Search',
      description: 'Find jobs that match your technical skills and experience level.',
      color: 'text-blue-600'
    },
    {
      icon: Brain,
      title: 'AI Career Advisor',
      description: 'Get personalized learning paths to land your dream job.',
      color: 'text-purple-600'
    },
    {
      icon: Target,
      title: 'Company Insights',
      description: 'Discover what skills top companies are looking for.',
      color: 'text-green-600'
    }
  ];

  const stats = [
    { number: '10K+', label: 'Job Listings' },
    { number: '500+', label: 'Companies' },
    { number: '95%', label: 'Success Rate' },
    { number: '24/7', label: 'AI Support' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Find Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                  Dream Career
                </span>
                <br />
                with AI Guidance
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Job Search Engine matches your technical skills with job opportunities and provides 
                AI-powered learning paths to help you land your dream job at top companies.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-2xl mx-auto mb-12"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-white rounded-full shadow-lg border border-gray-200 p-2">
                  <Search className="h-5 w-5 text-gray-400 ml-4" />
                  <input
                    type="text"
                    placeholder="Enter your skills (e.g., React, Python, Node.js)"
                    value={searchSkills}
                    onChange={(e) => setSearchSkills(e.target.value)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-transparent focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-primary-600 text-white px-6 py-3 rounded-full hover:bg-primary-700 transition-colors font-medium"
                  >
                    Search Jobs
                  </button>
                </div>
              </form>
              <p className="text-sm text-gray-500 mt-3">
                Try: "JavaScript, React, Node.js" or "Python, Django, PostgreSQL"
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/search"
                className="btn-primary text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <span>Explore Jobs</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/register"
                className="btn-outline text-lg px-8 py-3 inline-flex items-center space-x-2"
              >
                <Sparkles className="h-5 w-5" />
                <span>Get Started Free</span>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Job Search Engine?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform helps students and developers find the perfect 
              career path based on their skills and aspirations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card text-center hover:shadow-lg transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-6`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Get started in just three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Add Your Skills',
                description: 'Tell us about your programming languages, frameworks, and technical skills.',
                icon: BookOpen
              },
              {
                step: '02',
                title: 'Search & Discover',
                description: 'Find job opportunities that match your skill set at top companies.',
                icon: Search
              },
              {
                step: '03',
                title: 'Get AI Guidance',
                description: 'Receive personalized learning paths to bridge skill gaps and land your dream job.',
                icon: Brain
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 mb-4">
                    <item.icon className="h-10 w-10 text-primary-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary-600 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of students who have found their dream jobs with Job Search Engine's AI guidance.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center space-x-2 bg-white text-primary-600 px-8 py-4 rounded-full font-semibold hover:bg-gray-100 transition-colors text-lg"
            >
              <span>Start Your Journey</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;