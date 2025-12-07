const jwt = require('jsonwebtoken');
const usersDal = require('../repositories/users');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided. Authorization denied.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from database
    const user = await usersDal.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found. Authorization denied.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Authorization denied.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Server error during authentication'
    });
  }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      status: 'error',
      message: 'Access denied. Admin privileges required.'
    });
  }
};

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user.id === resourceUserId || req.user.role === 'admin') {
      next();
    } else {
      res.status(403).json({
        status: 'error',
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }
  };
};

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin
};
