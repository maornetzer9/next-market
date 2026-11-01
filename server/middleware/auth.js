const mongoose = require('mongoose');
const { User } = require('../models/user');
const { verifyToken } = require('../utils/jwt');

const unauthorized = (res, message = 'Authentication required') => (
  res.status(401).json({ code: 401, message })
);

const authenticate = async (req, res, next) => {
  try {
    const match = String(req.headers.authorization || '').match(/^Bearer\s+([^\s]+)$/i);
    if (!match) return unauthorized(res);

    const token = match[1];
    const decoded = verifyToken(token);
    const userId = decoded?.user?._id;

    if (!mongoose.isValidObjectId(userId)) return unauthorized(res, 'Invalid or expired session');

    const user = await User.findById(userId).select('_id role token');
    if (!user || !user.token || user.token !== token) {
      return unauthorized(res, 'Invalid or expired session');
    }

    req.auth = {
      userId: String(user._id),
      role: user.role,
      token,
    };
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAdmin = [
  authenticate,
  (req, res, next) => {
    if (req.auth?.role !== 'Admin') {
      return res.status(403).json({ code: 403, message: 'Admin access required' });
    }
    return next();
  },
];

module.exports = { authenticate, requireAdmin };
