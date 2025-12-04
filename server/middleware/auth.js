const jwt = require('jsonwebtoken');
const User = require('../models/User');
const demoStorage = require('../utils/demoStorage');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user;

    // Use demo storage if in demo mode
    if (process.env.NODE_ENV === 'demo') {
      user = await demoStorage.findUserById(decoded.userId);
    } else {
      user = await User.findById(decoded.userId).select('-passwordHash');
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;