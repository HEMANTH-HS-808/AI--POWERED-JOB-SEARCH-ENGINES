import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Star,
  Building2,
  Briefcase,
  GraduationCap,
  Code,
  Lightbulb,
  TrendingUp,
  X
} from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const ResumeUpload = () => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  // Load existing analysis on mount
  useEffect(() => {
    loadExistingAnalysis();
  }, []);

  const loadExistingAnalysis = async () => {
    try {
      setLoadingAnalysis(true);
      const response = await api.get('/ai/resume/analysis');
      if (response.data.resume && response.data.resume.analysis) {
        setAnalysis(response.data.resume.analysis);
        if (response.data.resume.imageUrl) {
          setPreview(response.data.resume.imageUrl);
        }
      }
    } catch (error) {
      // No existing analysis, that's okay
      if (error.response?.status !== 404) {
        console.error('Error loading analysis:', error);
      }
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !preview) {
      toast.error('Please select a resume image first');
      return;
    }

    try {
      setUploading(true);
      
      // Send base64 image to backend
      const response = await api.post('/ai/resume/upload', {
        imageBase64: preview
      }, {
        timeout: 120000 // 2 minutes for analysis
      });

      setAnalysis(response.data.analysis);
      toast.success('Resume analyzed successfully!');
      setSelectedFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Error analyzing resume. Please try again.';
      toast.error(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100';
    if (score >= 6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loadingAnalysis) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Resume Analysis
          </h1>
          <p className="text-gray-600">
            Upload your resume image and get AI-powered analysis with personalized recommendations
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary-600" />
              Upload Resume
            </h2>

            {!preview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-primary-600 font-medium">Click to upload</span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  PNG, JPG up to 5MB
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={preview}
                  alt="Resume preview"
                  className="w-full rounded-lg border border-gray-200"
                />
                <button
                  onClick={handleRemove}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="mt-4 w-full btn-primary flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing Resume...
                    </>
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mr-2" />
                      Analyze Resume
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>

          {/* Analysis Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {analysis ? (
              <>
                {/* Score Card */}
                <div className={`card ${getScoreBgColor(analysis.score)}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                      <Star className="h-5 w-5 mr-2 text-yellow-500" />
                      Resume Match Score
                    </h2>
                    <div className={`text-4xl font-bold ${getScoreColor(analysis.score)}`}>
                      {analysis.score.toFixed(1)}/10
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        analysis.score >= 8 ? 'bg-green-500' :
                        analysis.score >= 6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(analysis.score / 10) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Summary */}
                {analysis.summary && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-primary-600" />
                      Resume Summary
                    </h3>
                    
                    {analysis.summary.name && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">Name</p>
                        <p className="font-medium text-gray-900">{analysis.summary.name}</p>
                      </div>
                    )}

                    {analysis.summary.skills && analysis.summary.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <Code className="h-4 w-4 mr-1" />
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analysis.summary.skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.summary.experience && analysis.summary.experience.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <Briefcase className="h-4 w-4 mr-1" />
                          Experience
                        </p>
                        <div className="space-y-3">
                          {analysis.summary.experience.map((exp, idx) => (
                            <div key={idx} className="border-l-2 border-primary-500 pl-3">
                              <p className="font-medium text-gray-900">{exp.title}</p>
                              <p className="text-sm text-gray-600">{exp.company}</p>
                              {exp.duration && (
                                <p className="text-xs text-gray-500">{exp.duration}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.summary.education && analysis.summary.education.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2 flex items-center">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          Education
                        </p>
                        <div className="space-y-2">
                          {analysis.summary.education.map((edu, idx) => (
                            <div key={idx}>
                              <p className="font-medium text-gray-900">{edu.degree}</p>
                              <p className="text-sm text-gray-600">{edu.institution}</p>
                              {edu.year && (
                                <p className="text-xs text-gray-500">{edu.year}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.summary.projects && analysis.summary.projects.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Projects</p>
                        <div className="space-y-2">
                          {analysis.summary.projects.map((project, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded">
                              <p className="font-medium text-gray-900">{project.name}</p>
                              {project.description && (
                                <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                              )}
                              {project.technologies && project.technologies.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {project.technologies.map((tech, techIdx) => (
                                    <span
                                      key={techIdx}
                                      className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                                    >
                                      {tech}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {analysis.recommendations && (
                  <>
                    {analysis.recommendations.companies && analysis.recommendations.companies.length > 0 && (
                      <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Building2 className="h-5 w-5 mr-2 text-primary-600" />
                          Recommended Companies & Roles
                        </h3>
                        <div className="space-y-3">
                          {analysis.recommendations.companies.map((rec, idx) => (
                            <div
                              key={idx}
                              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{rec.role}</p>
                                  <p className="text-sm text-primary-600">{rec.name}</p>
                                  {rec.matchReason && (
                                    <p className="text-sm text-gray-600 mt-2">{rec.matchReason}</p>
                                  )}
                                </div>
                                <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.recommendations.tips && analysis.recommendations.tips.length > 0 && (
                      <div className="card">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                          Tips to Improve Your Resume
                        </h3>
                        <ul className="space-y-2">
                          {analysis.recommendations.tips.map((tip, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="card text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Upload a resume image to see analysis results
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumeUpload;

