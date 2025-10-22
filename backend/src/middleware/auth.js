const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password -otpCode -otpExpiry');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Middleware to check if user belongs to company
const requireCompanyAccess = (companyIdParam = 'companyId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const companyId = req.params[companyIdParam] || req.body.companyId;
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID required'
      });
    }

    // Admin users can access any company
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user belongs to the company
    if (req.user.companyId.toString() !== companyId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not authorized for this company'
      });
    }

    next();
  };
};

// Middleware to check if user can access employee data
const requireEmployeeAccess = (employeeIdParam = 'employeeId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const employeeId = req.params[employeeIdParam] || req.body.employeeId;
      
      if (!employeeId) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID required'
        });
      }

      // Admin and manager users can access any employee in their company
      if (req.user.role === 'admin' || req.user.role === 'manager') {
        const employee = await User.findById(employeeId);
        if (!employee) {
          return res.status(404).json({
            success: false,
            message: 'Employee not found'
          });
        }

        if (employee.companyId.toString() !== req.user.companyId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied - employee not in your company'
          });
        }

        return next();
      }

      // Regular employees can only access their own data
      if (req.user._id.toString() !== employeeId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - can only access your own data'
        });
      }

      next();
    } catch (error) {
      console.error('Employee access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };
};

// Middleware to validate company ownership
const requireCompanyOwnership = (companyIdParam = 'companyId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const companyId = req.params[companyIdParam] || req.body.companyId;
      
      if (!companyId) {
        return res.status(400).json({
          success: false,
          message: 'Company ID required'
        });
      }

      // Only admin users can manage company settings
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required for company management'
        });
      }

      // Check if user is admin of the company
      if (req.user.companyId.toString() !== companyId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - not authorized for this company'
        });
      }

      next();
    } catch (error) {
      console.error('Company ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'Access check failed'
      });
    }
  };
};

// Rate limiting for sensitive operations
const sensitiveOperationLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + req.user?.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    for (const [k, v] of attempts.entries()) {
      if (v.timestamp < windowStart) {
        attempts.delete(k);
      }
    }

    const userAttempts = attempts.get(key) || { count: 0, timestamp: now };
    
    if (userAttempts.timestamp < windowStart) {
      userAttempts.count = 0;
      userAttempts.timestamp = now;
    }

    if (userAttempts.count >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many sensitive operations. Please try again later.'
      });
    }

    userAttempts.count++;
    attempts.set(key, userAttempts);

    next();
  };
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous characters
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  };

  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
};

// Audit logging middleware
const auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action
      console.log(`🔍 Audit: ${action} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip} - Status: ${res.statusCode} - ${new Date().toISOString()}`);
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireCompanyAccess,
  requireEmployeeAccess,
  requireCompanyOwnership,
  sensitiveOperationLimit,
  sanitizeInput,
  auditLog
};
