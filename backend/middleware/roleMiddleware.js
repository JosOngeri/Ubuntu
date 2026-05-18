const roleMiddleware = (requiredRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ msg: 'Access denied: No role assigned' });
  }

  if (!requiredRoles.includes(req.user.role)) {
    return res.status(403).json({ msg: `Access denied: Requires one of ${requiredRoles.join(' or ')} role` });
  }

  next();
};

module.exports = roleMiddleware;