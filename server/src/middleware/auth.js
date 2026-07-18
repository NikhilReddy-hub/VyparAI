const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized. Please login.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vyapar-ai-secret-2024');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) return res.status(401).json({ success: false, message: 'User not found or deactivated.' });
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. ${req.user.role} cannot perform this action.` });
  }
  next();
};

exports.checkPermission = (permission) => (req, res, next) => {
  if (!req.user.permissions[permission]) {
    return res.status(403).json({ success: false, message: `Permission denied: ${permission}` });
  }
  next();
};
