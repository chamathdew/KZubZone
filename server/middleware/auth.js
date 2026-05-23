const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const { Role, Permission } = require('../models/RolePermission');

const JWT_SECRET = process.env.JWT_SECRET || 'kdramaverse_secret_key_2026';

// Authenticate a standard front-end user
const protectUser = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account is suspended' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

// Authenticate administrative requests
const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, admin token missing' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized, invalid admin scope' });
    }

    const admin = await Admin.findById(decoded.id).populate({
      path: 'role',
      populate: { path: 'permissions' }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, admin user not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
};

// Verify if the authenticated admin has a specific permission or is SuperAdmin
const hasPermission = (permissionName) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const roleName = req.admin.role.name;
    // SuperAdmin bypasses all permission checks
    if (roleName === 'SuperAdmin') {
      return next();
    }

    const permissions = req.admin.role.permissions.map(p => p.name);
    if (permissions.includes(permissionName)) {
      return next();
    }

    return res.status(403).json({ message: `Access denied. Requires permission: ${permissionName}` });
  };
};

module.exports = {
  protectUser,
  protectAdmin,
  hasPermission,
  JWT_SECRET
};
