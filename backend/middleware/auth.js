const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and inject req.user + req.hostelId
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }
    req.user = user;
    // Convenience shorthand used in all controllers for scoping queries
    req.hostelId = user.hostel || null;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};

// Scoped query helper — adds hostel filter automatically
// Usage in controllers: const filter = hostelScope(req);
const hostelScope = (req, extra = {}) => {
  if (req.user.role === 'superadmin') {
    // Super admin can optionally filter by hostel via query param
    const hostelId = req.query.hostelId || null;
    return hostelId ? { hostel: hostelId, ...extra } : { ...extra };
  }
  return { hostel: req.hostelId, ...extra };
};

module.exports = { protect, authorize, hostelScope };
