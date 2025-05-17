const express = require("express");
const db = require("../../config/db");
const router = express.Router();
const jwt = require('jsonwebtoken');
const authenticateJWT = require("../middlewares/auth");

/**
 * GET /:id
 * Returns detailed information about a person (by ID) and their roles in various movies
 * Protected (JWT required)
 */
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const id = req.params.id;

    // Reject invalid query parameters
    const allowedQueryParams = [];
    const invalidParams = Object.keys(req.query).filter(param => !allowedQueryParams.includes(param));
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidParams.join(', ')}. Query parameters are not permitted.`
      });
    }

    // Query the database for person details and their associated roles in movies
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

    // Return 404 if no records found for the provided person ID
    if (!personData || personData.length === 0) {
      return res.status(404).json({ error: true, message: "No record exists of a person with this ID" });
    }

    // Build a structured response object
    const person = {
      name: personData[0].name,
      birthYear: parseInt(personData[0].birthYear) || null,
      deathYear: parseInt(personData[0].deathYear) || null,
      roles: []
    };

    // Process roles associated with the person
    personData.forEach(role => {
      person.roles.push({
        movieName: role.movieName || null,
        movieId: role.movieId || null,
        category: role.category || null,
        characters: role.characters ? JSON.parse(role.characters) : [],
        imdbRating: role.imdbRating ? parseFloat(role.imdbRating) : null,
      });
    });

    // Sort roles by movie ID to maintain consistent order
    person.roles.sort((a, b) => {
      const movieIdA = a.movieId;
      const movieIdB = b.movieId;
      if (movieIdA < movieIdB) return -1;
      if (movieIdA > movieIdB) return 1;
      return 0;
    });

    // Return the final structured person object with roles
    res.json(person);

  } catch (error) {
    console.error("Error fetching person data:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;
