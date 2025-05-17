const express = require("express");
const db = require("../../config/db");
const router = express.Router();

/**
 * SEARCH ROUTE
 * Endpoint: GET /search
 * Description: Searches for movies by title and/or year with pagination support.
 */
router.get("/search", async (req, res) => {
  try {
    // Extract query parameters
    const title = req.query.title ?? "";
    const yearString = req.query.year;
    const year = yearString ? parseInt(yearString, 10) : undefined;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    const perPage = 100; // Number of results per page
    const pageNumber = page;

    // Validate year format: must be a 4-digit number
    if (yearString && !/^\d{4}$/.test(yearString)) {
      return res.status(400).json({
        error: "InvalidYearFormat",
        message: "Invalid year format. Format must be yyyy.",
      });
    }

    // Validate page number
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        error: "InvalidPageFormat",
        message: "Invalid page format. page must be a number.",
      });
    }

    // Base queries
    let query = db("basics").select(
      "primaryTitle as title",
      "year",
      "tconst as imdbID",
      "imdbRating",
      "rottentomatoesRating as rottenTomatoesRating",
      "metacriticRating",
      "rated as classification"
    );

    let totalCountQuery = db("basics").count("* as total");

    // Apply filters if present
    if (title) {
      query = query.where("primaryTitle", "like", `%${title}%`);
      totalCountQuery = totalCountQuery.where("primaryTitle", "like", `%${title}%`);
    }

    if (year !== undefined) {
      query = query.where("year", year);
      totalCountQuery = totalCountQuery.where("year", year);
    }

    // Fetch total count of matching records
    const totalCount = await totalCountQuery.first();

    // Fetch paginated results
    const movies = await query
      .orderByRaw("LOWER(tconst) asc")
      .limit(perPage)
      .offset((pageNumber - 1) * perPage);

    // Convert string ratings to proper numeric formats
    const processedMovies = movies.map((movie) => ({
      ...movie,
      imdbRating: movie.imdbRating ? parseFloat(movie.imdbRating) : null,
      rottenTomatoesRating: movie.rottenTomatoesRating ? parseFloat(movie.rottenTomatoesRating) : null,
      metacriticRating: movie.metacriticRating ? parseInt(movie.metacriticRating, 10) : null,
    }));

    // Calculate pagination metadata
    const lastPage = Math.ceil(totalCount.total / perPage);
    const prevPage = pageNumber > 1 ? pageNumber - 1 : null;
    const nextPage = pageNumber < lastPage ? pageNumber + 1 : null;

    // Send response
    res.status(200).json({
      data: processedMovies,
      pagination: {
        total: totalCount.total,
        lastPage,
        perPage,
        currentPage: pageNumber,
        from: (pageNumber - 1) * perPage,
        to: (pageNumber - 1) * perPage + movies.length,
        prevPage,
        nextPage,
      },
    });
  } catch (err) {
    console.error("Error in /search:", err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});

/**
 * DATA BY ID ROUTE
 * Endpoint: GET /data/:imdbID
 * Description: Fetches detailed data for a specific movie using its IMDb ID.
 */
router.get("/data/:imdbID", async (req, res) => {
  try {
    const imdbID = req.params.imdbID;

    // Validate imdbID
    if (!imdbID) {
      return res.status(400).json({ error: true, message: "imdbID is required" });
    }

    // Reject any unexpected query parameters
    const allowedQueryParams = [];
    const invalidParams = Object.keys(req.query).filter(param => !allowedQueryParams.includes(param));
    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidParams.join(', ')}. Query parameters are not permitted.`
      });
    }

    // Fetch movie and associated principals
    const movie = await db("basics")
      .leftJoin("principals", "basics.tconst", "principals.tconst")
      .select(
        "primaryTitle as title",
        "year",
        "basics.tconst as imdbID",
        "runtimeMinutes as runtime",
        "genres",
        "plot",
        "imdbRating",
        "rottenTomatoesRating",
        "metacriticRating",
        "country",
        "boxoffice",
        "poster",
        "nconst as id",
        "category",
        "name",
        "characters"
      )
      .where("basics.tconst", imdbID);

    // Handle movie not found
    if (!movie || movie.length === 0) {
      return res.status(404).json({ error: true, message: "No record exists of a movie with this ID" });
    }

    // Process and structure movie data
    const processedMovie = {
      title: movie[0].title,
      year: parseInt(movie[0].year) || null,
      runtime: parseInt(movie[0].runtime) || null,
      genres: movie[0].genres ? movie[0].genres.split(",") : [],
      country: movie[0].country,
      principals: [],
      ratings: [],
      boxoffice: parseInt(movie[0].boxoffice) || null,
      poster: movie[0].poster,
      plot: movie[0].plot,
    };

    // Add principals data
    movie.forEach(principalData => {
      processedMovie.principals.push({
        id: principalData.id || null,
        name: principalData.name || null,
        category: principalData.category || null,
        characters: principalData.characters ? JSON.parse(principalData.characters) : []
      });
    });

    // Add ratings
    if (movie[0].imdbRating) {
      processedMovie.ratings.push({ source: "Internet Movie Database", value: parseFloat(movie[0].imdbRating) });
    }
    if (movie[0].rottenTomatoesRating) {
      processedMovie.ratings.push({ source: "Rotten Tomatoes", value: parseFloat(movie[0].rottenTomatoesRating) });
    }
    if (movie[0].metacriticRating) {
      processedMovie.ratings.push({ source: "Metacritic", value: parseFloat(movie[0].metacriticRating) });
    }

    // Remove duplicate principals
    processedMovie.principals = Array.from(new Set(processedMovie.principals.map(JSON.stringify))).map(JSON.parse);

    // Send response
    res.status(200).json(processedMovie);
  } catch (error) {
    console.error("Error fetching movie data:", error);
    res.status(500).json({ error: true, message: "Internal server error" });
  }
});

module.exports = router;
