const express = require('express');
const bodyParser = require('body-parser');
const usersRouter = require('./routes/users'); // Import users routes
const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Use the users routes
app.use('/user', usersRouter);

// Add other middleware or routes as needed

module.exports = app;
