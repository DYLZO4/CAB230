const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
    }

    const token = parts[1];

    jwt.verify(token, process.env.JWT_BEARER_SECRET, (err, user) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: true, message: 'Token expired', expired: true });
        }
        return res.status(401).json({ error: true, message: 'Invalid JWT token' });
      }

      req.user = user;
      next();
    });
  } else {
    return res.status(401).json({ error: true, message: "Authorization header ('Bearer token') not found" });
  }
};

module.exports = authenticateJWT;
