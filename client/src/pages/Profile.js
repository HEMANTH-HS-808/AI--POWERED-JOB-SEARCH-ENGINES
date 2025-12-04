import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Plus, 
  X, 
  Save,
  Briefcase,
  Calendar,
  Edit3,
  Trash2,
  FileText,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [formData, setFormData] = useState({
    university: user?.university || '',
    profile: {
      firstName: user?.profile?.firstName || '',
      lastName: user?.profile?.lastName || '',
      bio: user?.profile?.bio || '',
      graduationYear: user?.profile?.graduationYear || ''
    }
  });
  const [skills, setSkills] = useState(user?.skills || []);
  const [savedCompanies, setSavedCompanies] = useState(user?.savedCompanies || []);
  const [resumeImage, setResumeImage] = useState(user?.resume?.imageUrl || null);
  const [uploadingResume, setUploadingResume] = useState(false);

  useEffect(() => {
    if (user) {
      setSkills(user.skills || []);
      setSavedCompanies(user.savedCompanies || []);
      setResumeImage(user?.resume?.imageUrl || null);
      setFormData({
        university: user.university || '',
        profile: {
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          bio: user.profile?.bio || '',
          graduationYear: user.profile?.graduationYear || ''
        }
      });
    }
  }, [user]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setNewSkill('');
      updateSkills(updatedSkills);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(updatedSkills);
    updateSkills(updatedSkills);
  };

  const updateSkills = async (updatedSkills) => {
    try {
      await api.put('/users/skills', { skills: updatedSkills });
      updateUser({ skills: updatedSkills });
      toast.success('Skills updated successfully');
    } catch (error) {
      toast.error('Failed to update skills');
      console.error('Update skills error:', error);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put('/users/me', formData);
      updateUser(response.data.user);
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCompany = async (companyName) => {
    try {
      const response = await api.delete(`/users/save-company/${encodeURIComponent(companyName)}`);
      setSavedCompanies(response.data.savedCompanies);
      updateUser({ savedCompanies: response.data.savedCompanies });
      toast.success('Company removed from saved list');
    } catch (error) {
      toast.error('Failed to remove company');
      console.error('Remove company error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleResumeImageSelect = (e) => {
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

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result;
      setResumeImage(base64Image);
      uploadResumeImage(base64Image);
    };
    reader.readAsDataURL(file);
  };

  const uploadResumeImage = async (imageBase64) => {
    try {
      setUploadingResume(true);
      
      // Upload resume image (without analysis - just save the image)
      const response = await api.post('/ai/resume/upload', {
        imageBase64: imageBase64
      }, {
        timeout: 120000
      });

      // Update user state with new resume image
      if (response.data.resume) {
        setResumeImage(response.data.resume.imageUrl);
        updateUser({ resume: response.data.resume });
        toast.success('Resume photo uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Error uploading resume photo. Please try again.';
      toast.error(errorMessage);
      // Revert to previous image on error
      setResumeImage(user?.resume?.imageUrl || null);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResumeImage = async () => {
    if (!window.confirm('Are you sure you want to remove your resume photo?')) {
      return;
    }

    try {
      // Clear resume image from user profile
      const response = await api.put('/users/me', {
        resume: { imageUrl: null }
      });
      
      setResumeImage(null);
      updateUser({ resume: { imageUrl: null } });
      toast.success('Resume photo removed successfully');
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove resume photo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="btn-outline text-sm"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="profile.firstName"
                          value={formData.profile.firstName}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Enter first name"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.profile.firstName || 'Not set'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          name="profile.lastName"
                          value={formData.profile.lastName}
                          onChange={handleInputChange}
                          className="input"
                          placeholder="Enter last name"
                        />
                      ) : (
                        <p className="text-gray-900">{formData.profile.lastName || 'Not set'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <p className="text-gray-900">{user?.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Username
                    </label>
                    <p className="text-gray-900">{user?.username}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <GraduationCap className="h-4 w-4 inline mr-1" />
                      University
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Enter university name"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.university || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Graduation Year
                    </label>
                    {editMode ? (
                      <input
                        type="number"
                        name="profile.graduationYear"
                        value={formData.profile.graduationYear}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="e.g., 2024"
                        min="2020"
                        max="2030"
                      />
                    ) : (
                      <p className="text-gray-900">{formData.profile.graduationYear || 'Not set'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    {editMode ? (
                      <textarea
                        name="profile.bio"
                        value={formData.profile.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="input"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-gray-900">{formData.profile.bio || 'No bio added yet'}</p>
                    )}
                  </div>

                  {editMode && (
                    <div className="flex space-x-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="btn-primary"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills Card */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">My Skills</h2>
                
                {/* Add Skill */}
                <div className="flex space-x-2 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                    className="input flex-1"
                    placeholder="Add a skill (e.g., React, Python, SQL)"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="btn-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Skills List */}
                <div className="flex flex-wrap gap-2">
                  {skills.length > 0 ? (
                    skills.map((skill, index) => (
                      <motion.div
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="inline-flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        <span>{skill}</span>
                        <button
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-2 text-primary-600 hover:text-primary-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No skills added yet. Add your first skill above!</p>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Resume Photo */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Resume Photo
                </h3>
                
                {resumeImage ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={resumeImage}
                        alt="Resume"
                        className="w-full rounded-lg border border-gray-200 max-h-64 object-contain bg-gray-50"
                      />
                      {uploadingResume && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                          <div className="text-white text-sm">Uploading...</div>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <label className="flex-1 btn-outline text-sm cursor-pointer text-center">
                        <Upload className="h-4 w-4 inline mr-1" />
                        Change Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResumeImageSelect}
                          className="hidden"
                          disabled={uploadingResume}
                        />
                      </label>
                      <button
                        onClick={handleRemoveResumeImage}
                        disabled={uploadingResume}
                        className="btn-outline text-sm text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Click "Change Photo" to update your resume image
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">No resume photo uploaded</p>
                      <label className="btn-primary text-sm cursor-pointer inline-block">
                        <Upload className="h-4 w-4 inline mr-1" />
                        Upload Resume Photo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleResumeImageSelect}
                          className="hidden"
                          disabled={uploadingResume}
                        />
                      </label>
                    </div>
                    {uploadingResume && (
                      <p className="text-sm text-gray-500 text-center">Uploading...</p>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Companies */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  <Briefcase className="h-5 w-5 inline mr-2" />
                  Saved Companies
                </h3>
                
                {savedCompanies.length > 0 ? (
                  <div className="space-y-3">
                    {savedCompanies.map((company, index) => (
                      <motion.div
                        key={`${company.name}-${index}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{company.name}</p>
                          {company.jobTitle && (
                            <p className="text-sm text-gray-600">{company.jobTitle}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            Saved {new Date(company.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveCompany(company.name)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove from saved"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    No saved companies yet. Start exploring jobs to save companies you're interested in!
                  </p>
                )}
              </div>

              {/* Profile Stats */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Skills</span>
                    <span className="font-medium">{skills.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saved Companies</span>
                    <span className="font-medium">{savedCompanies.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;