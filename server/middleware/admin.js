/**
 * Admin middleware - checks if user is authenticated and is an admin
 * Must be used after auth middleware
 * Usage: router.use(auth, admin)
 */
const admin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by auth middleware)
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Check role - support both 'admin' role and email-based admin
    const isAdmin = req.user.role === 'admin' || 
                   req.user.email === 'admin@skillsync.com' ||
                   (process.env.ADMIN_EMAIL && req.user.email === process.env.ADMIN_EMAIL);

    if (!isAdmin) {
      return res.status(403).json({ 
        message: 'Access denied. Admin privileges required.' 
      });
    }

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

module.exports = admin;

