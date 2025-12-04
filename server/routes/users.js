const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');
const demoStorage = require('../utils/demoStorage');

const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put('/me', auth, async (req, res) => {
  try {
    const { skills, university, profile, resume } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (skills !== undefined) updateData.skills = skills;
    if (university !== undefined) updateData.university = university;
    if (profile !== undefined) updateData.profile = profile;
    if (resume !== undefined) {
      // Handle resume update (can be partial update)
      if (process.env.NODE_ENV === 'demo') {
        const user = await demoStorage.findUserById(userId);
        if (user) {
          if (resume.imageUrl === null) {
            // Remove resume
            updateData.resume = { imageUrl: null };
          } else if (resume.imageUrl) {
            // Update resume image
            updateData.resume = { ...user.resume, ...resume };
          }
        }
      } else {
        if (resume.imageUrl === null) {
          // Remove resume
          updateData.resume = { imageUrl: null };
        } else if (resume.imageUrl) {
          // Update resume (merge with existing)
          const existingUser = await User.findById(userId);
          if (existingUser && existingUser.resume) {
            updateData.resume = { ...existingUser.resume, ...resume };
          } else {
            updateData.resume = resume;
          }
        }
      }
    }

    let user;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.updateUser(userId, updateData);
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
      ).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/save-company
// @desc    Save a company to user's profile
// @access  Private
router.post('/save-company', auth, async (req, res) => {
  try {
    const { companyName, jobTitle } = req.body;
    const userId = req.user._id;

    if (!companyName) {
      return res.status(400).json({ message: 'Company name is required' });
    }

    let user;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if company is already saved
    const existingCompany = user.savedCompanies.find(
      company => company.name.toLowerCase() === companyName.toLowerCase()
    );

    if (existingCompany) {
      return res.status(400).json({ message: 'Company already saved' });
    }

    // Add company to saved list
    const newCompany = {
      name: companyName,
      jobTitle: jobTitle || '',
      savedAt: new Date()
    };

    user.savedCompanies.push(newCompany);

    // Save user
    if (process.env.NODE_ENV === 'demo') {
      await demoStorage.updateUser(userId, { savedCompanies: user.savedCompanies });
    } else {
      await user.save();
    }

    res.json({
      message: 'Company saved successfully',
      savedCompanies: user.savedCompanies
    });
  } catch (error) {
    console.error('Save company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/save-company/:companyName
// @desc    Remove a saved company
// @access  Private
router.delete('/save-company/:companyName', auth, async (req, res) => {
  try {
    const { companyName } = req.params;
    const userId = req.user._id;

    let user;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(userId);
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove company from saved list
    user.savedCompanies = user.savedCompanies.filter(
      company => company.name.toLowerCase() !== companyName.toLowerCase()
    );

    // Save user
    if (process.env.NODE_ENV === 'demo') {
      await demoStorage.updateUser(userId, { savedCompanies: user.savedCompanies });
    } else {
      await user.save();
    }

    res.json({
      message: 'Company removed successfully',
      savedCompanies: user.savedCompanies
    });
  } catch (error) {
    console.error('Remove company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/skills
// @desc    Update user skills
// @access  Private
router.put('/skills', auth, async (req, res) => {
  try {
    const { skills } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(skills)) {
      return res.status(400).json({ message: 'Skills must be an array' });
    }

    const filteredSkills = skills.filter(skill => skill.trim());
    let user;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.updateUser(userId, { skills: filteredSkills });
    } else {
      user = await User.findByIdAndUpdate(
        userId,
        { skills: filteredSkills },
        { new: true, runValidators: true }
      ).select('-passwordHash');
    }

    res.json({
      message: 'Skills updated successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Update skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;