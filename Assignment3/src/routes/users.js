const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/db'); // Your knex instance
const { body, validationResult } = require('express-validator');
const router = express.Router();

// POST /user/register - Register a new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: true, message: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user already exists
      const existingUser = await db('users').where('email', email).first();
      if (existingUser) {
        return res.status(409).json({
          error: true,
          message: 'User already exists'
        });
      }

      // Hash the password before saving it to the database
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert the new user into the database
      const [newUser] = await db('users').insert({
        email,
        password: hashedPassword
      }).returning('*');

      // Respond with success message
      return res.status(201).json({
        message: 'User created'
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: true,
        message: 'Internal server error'
      });
    }
  }
);

module.exports = router;

