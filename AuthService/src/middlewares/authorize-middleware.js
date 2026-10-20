const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Not authenticated',
        data: {},
        success: false,
        err: {}
      });
    }

    const hasPermission = req.user.roles?.some(role => allowedRoles.includes(role));
    if (!hasPermission) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource',
        data: {},
        success: false,
        err: {}
      });
    }

    next();
  };
};

module.exports = authorize;