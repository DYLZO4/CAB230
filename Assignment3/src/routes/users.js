const express = require("express");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db"); // Your knex instance
const authenticateJWT = require("../middlewares/auth"); // Your JWT authentication middleware
const { body, validationResult } = require("express-validator");
const router = express.Router();

const JWT_BEARER_SECRET = process.env.JWT_BEARER_SECRET || "your_jwt_secret"; // keep secret safe
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "your_refresh_secret";

const DEFAULT_BEARER_EXPIRY = 600; // 10 mins
const DEFAULT_REFRESH_EXPIRY = 86400; // 24 hours
const LONG_EXPIRY = 31536000; // 1 year
// POST /user/register - Register a new user
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email format"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: true,
        message: "Validation failed",
        details: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await db("users").where("email", email).first();
      if (existingUser) {
        return res.status(409).json({
          error: true,
          message: "User already exists",
        });
      }

      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const [newUser] = await db("users").insert({
        email,
        password: hashedPassword,
      }); //.returning('*');

      // Respond with success message
      return res.status(201).json({
        message: "User created",
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: true,
        message: "Internal server error",
      });
    }
  }
);

router.post("/logout", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const now = new Date();
    const existingToken = await db("refresh_tokens")
      .where({ token: refreshToken })
      .first(); // Fetch the token first

    if (!existingToken) {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token", // Not found in database
      });
    }

    if (existingToken.expires_at < now) {
      // Handle expired token differently
      await db("refresh_tokens").where({ token: refreshToken }).del(); // Delete expired token
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    const deleted = await db("refresh_tokens")
      .where({ token: refreshToken })
      .del();

    if (deleted === 0) {
      // This should, ideally, never happen, but good to keep for robustness
      return res.status(500).json({
        error: true,
        message: "Failed to invalidate token.  Please try again.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Token successfully invalidated",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// Helper to create JWT tokens
function createToken(payload, secret, expiresIn) {
  return jwt.sign(payload, secret, { expiresIn });
}

router.post("/login", async (req, res) => {
  const {
    email,
    password,
    longExpiry = false,
    bearerExpiresInSeconds,
    refreshExpiresInSeconds,
  } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
  }

  try {
    // Fetch user by email
    const user = await db("users").where("email", email).first();
    if (!user) {
      return res
        .status(401)
        .json({ error: true, message: "Incorrect email or password" }); // Improved: 404 for security
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ error: true, message: "Incorrect email or password" }); // More specific error message
    }

    // Calculate expiry times
    const bearerExpiry = longExpiry
      ? LONG_EXPIRY
      : bearerExpiresInSeconds || DEFAULT_BEARER_EXPIRY;

    const refreshExpiry = longExpiry
      ? LONG_EXPIRY
      : refreshExpiresInSeconds || DEFAULT_REFRESH_EXPIRY; // Spec defines refreshExpiresInSeconds as boolean, but treating as number for practical use.

    // Generate tokens
    const bearerToken = jwt.sign({ userId: user.id }, JWT_BEARER_SECRET, {
      expiresIn: bearerExpiry,
    });

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: refreshExpiry,
    });

    await db("refresh_tokens").insert({
      token: refreshToken,
      user_id: user.id, // Assuming you have a user_id column
      expires_at: new Date(Date.now() + refreshExpiry * 1000), // Calculate expiration date
      created_at: new Date(Date.now()),
    });

    return res.status(200).json({
      bearerToken: {
        token: bearerToken,
        token_type: "Bearer",
        expires_in: bearerExpiry,
      },
      refreshToken: {
        token: refreshToken,
        token_type: "Refresh",
        expires_in: refreshExpiry,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    // OpenAPI spec includes a 429 response, but rate limiting is not defined.  Not implementing rate limiting at this time.
    // If implemented in the future, this section should be updated to return a 429 response with appropriate headers and body.

    return res
      .status(500)
      .json({ error: true, message: "Internal server error" }); // Consistent JSON error response
  }
});

router.post("/refresh", async (req, res) => {
  const { refreshToken, bearerExpiresInSeconds, refreshExpiresInSeconds } =
    req.body;
  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const tokenRecord = await db("refresh_tokens")
      .where({ token: refreshToken, user_id: decoded.userId })
      .first();

    if (!tokenRecord) {
      return res.status(401).json({
        error: true,
        message: "Unauthorized - refresh token not found",
      });
    }

    // Use test-specified expiry times if provided, otherwise use defaults
    const bearerExpiresIn = bearerExpiresInSeconds || 600;
    const refreshExpiresIn = refreshExpiresInSeconds || 86400;

    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    const bearerToken = jwt.sign(
      { userId: decoded.userId }, // Removed email from payload
      process.env.JWT_BEARER_SECRET,
      { expiresIn: bearerExpiresIn }
    );

    const newRefreshToken = jwt.sign(
      { userId: decoded.userId }, // Removed email from payload
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: refreshExpiresIn }
    );

    await db("refresh_tokens")
      .where({ token: refreshToken, user_id: decoded.userId })
      .del();
    await db("refresh_tokens").insert({
      user_id: decoded.userId,
      token: newRefreshToken,
      expires_at: expiresAt,
      created_at: new Date(Date.now()),
    });

    return res.status(200).json({
      bearerToken: {
        token: bearerToken,
        token_type: "Bearer",
        expires_in: bearerExpiresIn,
      },
      refreshToken: {
        token: newRefreshToken,
        token_type: "Refresh",
        expires_in: refreshExpiresIn,
      },
    });
  } catch (err) {
    console.error("Refresh token error:", err);

    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: true, message: "JWT token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ error: true, message: "Invalid JWT token" });
    }

    return res
      .status(500)
      .json({ error: true, message: "Internal server error" }); // Generic server error
  }
});

router.get("/:email/profile", async (req, res, next) => {
  const { email } = req.params;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  try {
    const user = await db("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    // Basic profile by default
    let profile = {
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    };

    // If no auth header, return basic profile
    if (!req.headers.authorization) {
      return res.status(200).json(profile);
    }

    // If auth header is present, use authenticateJWT middleware manually
    authenticateJWT(req, res, async () => {
      // If authenticated and user email matches requested profile
      if (req.user?.email === email) {
        profile = {
          ...profile,
          dob: user.dob !== undefined ? user.dob : null,
          address: user.address !== undefined ? user.address : null,
        };
      }
      return res.status(200).json(profile);
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

router.put("/:email/profile", async (req, res) => {
  const { email } = req.params;
  const authHeader = req.headers.authorization;
  const profileData = req.body;

  // Input validation
  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  const requiredFields = ["firstName", "lastName", "dob", "address"];
  const missingFields = requiredFields.filter(
    (field) => !(field in profileData)
  );
 if (missingFields.length > 0) {
  const last = missingFields.pop();
  const fieldList = missingFields.length
    ? missingFields.join(", ") + " and " + last
    : last;

  return res.status(400).json({
    error: true,
    message: `Request body incomplete: ${fieldList} are required.`,
  });
  
  }

  const stringFields = ["firstName", "lastName", "address"];
  const invalidStringFields = stringFields.filter(
    (field) => typeof profileData[field] !== "string"
  );

  if (missingFields.length > 0) {
  const last = missingFields.pop();
  const fieldList = missingFields.length
    ? missingFields.join(", ") + " and " + last
    : last;

  return res.status(400).json({
    error: true,
    message: `Request body incomplete: ${fieldList} must be strings .`,
  });
  }

  if (!moment(profileData.dob, "YYYY-MM-DD", true).isValid()) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  }

  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: true, message: "Authorization header is malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_BEARER_SECRET);

    if (decoded.email !== email) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    try {
      const user = await db("users").where("email", email).first();

      if (!user) {
        return res.status(404).json({ error: true, message: "User not found" });
      }

      // Update the user profile in the database
      await db("users").where("email", email).update(profileData);

      const updatedUser = { ...user, ...profileData }; // create the object to return
      delete updatedUser.password; // dont return password
      return res.status(200).json(updatedUser);
    } catch (dbError) {
      console.error("Database error:", dbError);
      return res
        .status(500)
        .json({ error: true, message: "Internal server error" });
    }
  } catch (jwtError) {
    if (jwtError.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: true, message: "JWT token has expired" });
    }
    return res.status(401).json({ error: true, message: "Invalid JWT token" });
  }
});


module.exports = router;
