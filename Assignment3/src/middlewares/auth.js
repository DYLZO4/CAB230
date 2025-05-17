const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT from the Authorization header
 * Expected format: Authorization: Bearer <token>
 */
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if the Authorization header is present
  if (authHeader) {
    const parts = authHeader.split(' ');

    // Validate header format (must be 'Bearer <token>')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: true,
        message: "Authorization header ('Bearer token') not found"
      });
    }

    const token = parts[1];

    // Verify the JWT
    jwt.verify(token, process.env.JWT_BEARER_SECRET, (err, user) => {
      if (err) {
        // Handle expired token
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: true,
            message: 'Token expired',
            expired: true
          });
        }

        // Handle other verification errors
        return res.status(401).json({
          error: true,
          message: 'Invalid JWT token'
        });
      }

      // Token is valid; attach user info to request
      req.user = user;
      next();
    });

  } else {
    // Missing Authorization header
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found"
    });
  }
};

module.exports = authenticateJWT;
