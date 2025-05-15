const express = require("express");
const db = require("../config/db");
const router = express.Router();
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


router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const id = req.params.id;

    // Check for invalid query parameters (same as before)
    const allowedQueryParams = [];
    const invalidParams = Object.keys(req.query).filter(param => !allowedQueryParams.includes(param));
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidParams.join(', ')}. Query parameters are not permitted.`
      });
    }

    const personData = await db("names")
      .leftJoin("principals", "names.nconst", "principals.nconst")
      .leftJoin("basics", "principals.tconst", "basics.tconst")
      .select(
        "names.primaryName as name",
        "names.birthYear",
        "names.deathYear",
        "basics.primaryTitle as movieName",
        "basics.tconst as movieId",
        "principals.category",
        "principals.characters",
        "basics.imdbRating"
      )
      .where("names.nconst", id);

    if (!personData || personData.length === 0) {
      return res.status(404).json({ error: true, message: "No record exists of a person with this ID" });
    }

    const person = {
      name: personData[0].name,
      birthYear: parseInt(personData[0].birthYear) || null,
      deathYear: parseInt(personData[0].deathYear) || null,
      roles: []
    };

    personData.forEach(role => {
      person.roles.push({
        movieName: role.movieName || null,
        movieId: role.movieId || null,
        category: role.category || null,
        characters: role.characters ? JSON.parse(role.characters) : [],
        imdbRating: role.imdbRating ? parseFloat(role.imdbRating) : null,
      });
    });

        person.roles.sort((a, b) => {
        const movieIdA = a.movieId;
        const movieIdB = b.movieId;
        if (movieIdA < movieIdB) return -1;
        if (movieIdA > movieIdB) return 1;
        return 0; 
    });

    res.json(person);

  } catch (error) {
    console.error("Error fetching person data:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;