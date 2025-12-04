const express = require('express');
const User = require('../models/User');
const CompanyCache = require('../models/CompanyCache');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const demoStorage = require('../utils/demoStorage');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(auth);
router.use(admin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private/Admin
router.get('/dashboard', async (req, res) => {
  try {
    let totalUsers = 0;
    let recentUsers = [];
    let totalCompanies = 0;
    let totalSavedCompanies = 0;

    if (process.env.NODE_ENV === 'demo') {
      // Demo mode - get from demo storage
      const users = await demoStorage.getAllUsers();
      totalUsers = users.length;
      recentUsers = users
        .sort((a, b) => new Date(b.createdAt || Date.now()) - new Date(a.createdAt || Date.now()))
        .slice(0, 5)
        .map(u => ({
          id: u._id,
          username: u.username,
          email: u.email,
          createdAt: u.createdAt || new Date()
        }));
      
      // Count saved companies from all users
      users.forEach(user => {
        if (user.savedCompanies) {
          totalSavedCompanies += user.savedCompanies.length;
        }
      });
    } else {
      // MongoDB mode
      totalUsers = await User.countDocuments();
      recentUsers = await User.find()
        .select('username email createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      totalCompanies = await CompanyCache.countDocuments();

      // Count total saved companies
      const users = await User.find().select('savedCompanies');
      users.forEach(user => {
        if (user.savedCompanies) {
          totalSavedCompanies += user.savedCompanies.length;
        }
      });
    }

    res.json({
      stats: {
        totalUsers,
        totalCompanies,
        totalSavedCompanies,
        activeSessions: 0 // Can be implemented with session tracking
      },
      recentUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Error fetching dashboard data' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (paginated)
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let users = [];
    let total = 0;

    if (process.env.NODE_ENV === 'demo') {
      const allUsers = await demoStorage.getAllUsers();
      total = allUsers.length;
      
      // Filter by search if provided
      let filteredUsers = allUsers;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredUsers = allUsers.filter(u => 
          u.username.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower)
        );
      }
      
      users = filteredUsers
        .slice(skip, skip + parseInt(limit))
        .map(u => ({
          id: u._id,
          username: u.username,
          email: u.email,
          university: u.university,
          skills: u.skills || [],
          savedCompanies: u.savedCompanies?.length || 0,
          role: u.role || 'user',
          createdAt: u.createdAt || new Date()
        }));
    } else {
      // MongoDB mode
      const query = search 
        ? {
            $or: [
              { username: new RegExp(search, 'i') },
              { email: new RegExp(search, 'i') }
            ]
          }
        : {};

      total = await User.countDocuments(query);
      users = await User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
    }

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get user details
// @access  Private/Admin
router.get('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    let user;

    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(userId);
    } else {
      user = await User.findById(userId).select('-passwordHash');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// @route   PUT /api/admin/users/:userId
// @desc    Update user (admin can update role, etc.)
// @access  Private/Admin
router.put('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, skills, university } = req.body;

    if (process.env.NODE_ENV === 'demo') {
      return res.status(400).json({ message: 'User updates not supported in demo mode' });
    }

    const updateData = {};
    if (role) updateData.role = role;
    if (skills) updateData.skills = skills;
    if (university !== undefined) updateData.university = university;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'User updated successfully',
      user 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
});

// @route   DELETE /api/admin/users/:userId
// @desc    Delete user
// @access  Private/Admin
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting yourself
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    if (process.env.NODE_ENV === 'demo') {
      return res.status(400).json({ message: 'User deletion not supported in demo mode' });
    }

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// @route   GET /api/admin/companies
// @desc    Get all cached companies
// @access  Private/Admin
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    if (process.env.NODE_ENV === 'demo') {
      return res.json({
        companies: [],
        pagination: { page: 1, limit: 20, total: 0, pages: 0 },
        message: 'Company cache not available in demo mode'
      });
    }

    const total = await CompanyCache.countDocuments();
    const companies = await CompanyCache.find()
      .sort({ lastFetched: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      companies,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Error fetching companies' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get detailed statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    let stats = {
      users: {
        total: 0,
        withSkills: 0,
        withSavedCompanies: 0,
        byRole: { user: 0, admin: 0 }
      },
      companies: {
        total: 0,
        withLogos: 0
      },
      activity: {
        totalSavedCompanies: 0
      }
    };

    if (process.env.NODE_ENV === 'demo') {
      const users = await demoStorage.getAllUsers();
      stats.users.total = users.length;
      stats.users.withSkills = users.filter(u => u.skills && u.skills.length > 0).length;
      stats.users.withSavedCompanies = users.filter(u => u.savedCompanies && u.savedCompanies.length > 0).length;
      stats.users.byRole.user = users.filter(u => !u.role || u.role === 'user').length;
      stats.users.byRole.admin = users.filter(u => u.role === 'admin').length;
      
      users.forEach(user => {
        if (user.savedCompanies) {
          stats.activity.totalSavedCompanies += user.savedCompanies.length;
        }
      });
    } else {
      stats.users.total = await User.countDocuments();
      stats.users.withSkills = await User.countDocuments({ skills: { $exists: true, $ne: [] } });
      stats.users.withSavedCompanies = await User.countDocuments({ savedCompanies: { $exists: true, $ne: [] } });
      stats.users.byRole.user = await User.countDocuments({ role: { $ne: 'admin' } });
      stats.users.byRole.admin = await User.countDocuments({ role: 'admin' });

      stats.companies.total = await CompanyCache.countDocuments();
      stats.companies.withLogos = await CompanyCache.countDocuments({ logo: { $exists: true, $ne: null } });

      const users = await User.find().select('savedCompanies');
      users.forEach(user => {
        if (user.savedCompanies) {
          stats.activity.totalSavedCompanies += user.savedCompanies.length;
        }
      });
    }

    res.json({ stats, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

module.exports = router;

