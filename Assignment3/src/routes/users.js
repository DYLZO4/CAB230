const express = require("express");
const moment = require("moment");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../../config/db"); // Knex instance
const authenticateJWT = require("../middlewares/auth"); // JWT auth middleware
const { body, validationResult } = require("express-validator");

const router = express.Router();

// JWT configuration
const JWT_BEARER_SECRET = process.env.JWT_BEARER_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
if (!JWT_BEARER_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error("JWT secrets must be set in environment variables.");
}

const DEFAULT_BEARER_EXPIRY = 600; // 10 minutes
const DEFAULT_REFRESH_EXPIRY = 86400; // 24 hours
const LONG_EXPIRY = 31536000; // 1 year

/**
 * POST /user/register
 * Registers a new user with email and password
 */
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

      // Hash password and insert new user
      const hashedPassword = await bcrypt.hash(password, 10);
      await db("users").insert({ email, password: hashedPassword });

      return res.status(201).json({ message: "User created" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({
        error: true,
        message: "Internal server error",
      });
    }
  }
);

/**
 * POST /user/logout
 * Invalidates a refresh token
 */
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
    const existingToken = await db("refresh_tokens").where({ token: refreshToken }).first();

    if (!existingToken) {
      return res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
    }

    if (existingToken.expires_at < now) {
      await db("refresh_tokens").where({ token: refreshToken }).del();
      return res.status(401).json({
        error: true,
        message: "JWT token has expired",
      });
    }

    const deleted = await db("refresh_tokens").where({ token: refreshToken }).del();
    if (deleted === 0) {
      return res.status(500).json({
        error: true,
        message: "Failed to invalidate token. Please try again.",
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

/**
 * POST /user/login
 * Authenticates user and issues bearer + refresh tokens
 */
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
    const user = await db("users").where("email", email).first();
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: true,
        message: "Incorrect email or password",
      });
    }

    const bearerExpiry = longExpiry ? LONG_EXPIRY : bearerExpiresInSeconds || DEFAULT_BEARER_EXPIRY;
    const refreshExpiry = longExpiry ? LONG_EXPIRY : refreshExpiresInSeconds || DEFAULT_REFRESH_EXPIRY;

    const bearerToken = jwt.sign({ userId: user.userId, email: user.email }, JWT_BEARER_SECRET, {
      expiresIn: bearerExpiry,
    });

    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, {
      expiresIn: refreshExpiry,
    });

    await db("refresh_tokens").insert({
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(Date.now() + refreshExpiry * 1000),
      created_at: new Date(),
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
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

/**
 * POST /user/refresh
 * Refreshes JWT tokens using a valid refresh token
 */
router.post("/refresh", async (req, res) => {
  const { refreshToken, bearerExpiresInSeconds, refreshExpiresInSeconds } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: "Request body incomplete, refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const tokenRecord = await db("refresh_tokens")
      .where({ token: refreshToken, user_id: decoded.userId })
      .first();

    if (!tokenRecord) {
      return res.status(401).json({
        error: true,
        message: "Unauthorized - refresh token not found",
      });
    }

    const bearerExpiresIn = bearerExpiresInSeconds || DEFAULT_BEARER_EXPIRY;
    const refreshExpiresIn = refreshExpiresInSeconds || DEFAULT_REFRESH_EXPIRY;
    const expiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

    const bearerToken = jwt.sign({ userId: decoded.userId }, JWT_BEARER_SECRET, {
      expiresIn: bearerExpiresIn,
    });

    const newRefreshToken = jwt.sign({ userId: decoded.userId }, JWT_REFRESH_SECRET, {
      expiresIn: refreshExpiresIn,
    });

    await db("refresh_tokens").where({ token: refreshToken, user_id: decoded.userId }).del();
    await db("refresh_tokens").insert({
      user_id: decoded.userId,
      token: newRefreshToken,
      expires_at: expiresAt,
      created_at: new Date(),
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
      return res.status(401).json({ error: true, message: "JWT token has expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: true, message: "Invalid JWT token" });
    }

    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

/**
 * GET /user/:email/profile
 * Retrieves public or private profile depending on authentication
 */
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

    let profile = {
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
    };

    if (!req.headers.authorization) {
      return res.status(200).json(profile);
    }

    // Attempt to authenticate for full profile access
    authenticateJWT(req, res, async (authErr) => {
      if (authErr) {
        return res.status(401).json({ error: true, message: "Invalid token" });
      }

      if (req.user?.email === email) {
        profile = {
          ...profile,
          dob: user.dob && moment(user.dob).isValid() ? moment(user.dob).format("YYYY-MM-DD") : null,
          address: user.address ?? null,
        };
      }

      return res.status(200).json(profile);
    });
  } catch (err) {
    console.error("Error in /:email/profile:", err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

/**
 * PUT /user/:email/profile
 * Updates profile details for an authenticated user
 */
router.put("/:email/profile", authenticateJWT, async (req, res) => {
  const { email } = req.params;
  const profileData = req.body;

  if (!email) {
    return res.status(400).json({ error: true, message: "Email is required" });
  }

  const requiredFields = ["firstName", "lastName", "dob", "address"];
  const missingFields = requiredFields.filter((field) => !(field in profileData));

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: true,
      message: `Request body incomplete: firstName, lastName, dob and address are required.`,
    });
  }

  const stringFields = ["firstName", "lastName", "address"];
  const invalidStringFields = stringFields.filter(
    (field) => typeof profileData[field] !== "string"
  );

  if (invalidStringFields.length > 0) {
    return res.status(400).json({
      error: true,
      message: `Request body invalid: firstName, lastName and address must be strings only.`,
    });
  }

  if (!moment(profileData.dob, "YYYY-MM-DD", true).isValid()) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  }

  if (moment(profileData.dob).isAfter(moment())) {
    return res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past.",
    });
  }

  try {
    if (req.user.email !== email) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    const user = await db("users").where("email", email).first();
    if (!user) {
      return res.status(404).json({ error: true, message: "User not found" });
    }

    await db("users").where("email", email).update(profileData);
    profileData.dob = moment(profileData.dob, "YYYY-MM-DD").format("YYYY-MM-DD");
    const updatedUser = { ...user, ...profileData };
    delete updatedUser.password;

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;
