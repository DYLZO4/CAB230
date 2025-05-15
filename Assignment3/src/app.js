require('dotenv').config({ path: '../.env' });
const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');
const cors = require('cors'); // Import the cors package


const usersRouter = require('./routes/users');
const moviesRouter = require('./routes/movies');
const peopleRouter = require('./routes/people');

const app = express();

app.use(bodyParser.json());

app.use(cors());

// API routes
app.use('/user', usersRouter);
app.use('/movies', moviesRouter);
app.use('/people', peopleRouter);

// Serve Swagger UI at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Redirect root path "/" to "/api-docs"
app.get('/', (req, res) => {
  res.redirect('/api-docs'); 
});


// 404 handling (MUST be after ALL other routes and middleware)
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

module.exports = app;