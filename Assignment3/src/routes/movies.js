const express = require("express");
const db = require("../config/db");
const router = express.Router();

router.get("/search", async (req, res) => {
  try {
    const title = req.query.title ?? "";
    const yearString = req.query.year;
    const year = yearString ? parseInt(yearString, 10) : undefined;
    const page = req.query.page ? parseInt(req.query.page, 10) : 1;

    const perPage = 100;
    const pageNumber = page;

    if (yearString && !/^\d{4}$/.test(yearString)) {
      return res.status(400).json({
        error: "InvalidYearFormat",
        message: "Invalid year format. Format must be yyyy.",
      });
    }
    if (isNaN(pageNumber) || pageNumber < 1) {
      return res.status(400).json({
        error: "InvalidPageFormat",
        message: "Invalid page format. page must be a number.",
      });
    }

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

    if (title) {
      query = query.where("primaryTitle", "like", `%${title}%`);
      totalCountQuery = totalCountQuery.where("primaryTitle", "like", `%${title}%`);
    }
    if (year !== undefined) {
      query = query.where("year", year);
      totalCountQuery = totalCountQuery.where("year", year);
    }

    const totalCount = await totalCountQuery.first();
    const movies = await query
      .orderByRaw("LOWER(tconst) asc")
      .limit(perPage)
      .offset((pageNumber - 1) * perPage);

    const processedMovies = movies.map((movie) => ({
      ...movie,
      imdbRating: movie.imdbRating ? parseFloat(movie.imdbRating) : null,
      rottenTomatoesRating: movie.rottenTomatoesRating ? parseFloat(movie.rottenTomatoesRating) : null,
      metacriticRating: movie.metacriticRating ? parseInt(movie.metacriticRating, 10) : null,
    }));

    const lastPage = Math.ceil(totalCount.total / perPage);
    const prevPage = pageNumber > 1 ? pageNumber - 1 : null;
    const nextPage = pageNumber < lastPage ? pageNumber + 1 : null;

    res.status(200).json({
      data: processedMovies,
      pagination: {
        total: totalCount.total,
        lastPage,
        perPage,
        currentPage: pageNumber,
        from: (pageNumber - 1) * perPage,  // Start "from" at 1
        to: pageNumber * perPage <= totalCount.total ? pageNumber * perPage : totalCount.total,
        prevPage,
        nextPage,
      },
    });
  } catch (err) {
    console.error("Error in /search:", err);
    res.status(500).json({ error: true, message: "Internal Server Error" });
  }
});


router.get("/data/:imdbID", async (req, res) => {
  try {
    const imdbID = req.params.imdbID;
    if (!imdbID) {  // Check if imdbID is missing
            return res.status(400).json({ error: true, message: "imdbID is required" });
    }
    // 1. Check for INVALID QUERY PARAMETERS
    const allowedQueryParams = []; // No query parameters allowed
    const invalidParams = Object.keys(req.query).filter(param => !allowedQueryParams.includes(param));

    if (invalidParams.length > 0) {
      return res.status(400).json({
        error: true,
        message: `Invalid query parameters: ${invalidParams.join(', ')}. Query parameters are not permitted.`
      });
    }


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

    if (!movie || movie.length === 0) { // Check for empty array as well
      return res.status(404).json({ error: true, message: "No record exists of a movie with this ID" });
    }

    const processedMovie = {
      title: movie[0].title, 
      year: parseInt(movie[0].year) || null, // Handle potential null year
      runtime: parseInt(movie[0].runtime) || null, // Handle potential null runtime
      genres: movie[0].genres ? movie[0].genres.split(",") : [],
      country: movie[0].country, 
      principals: [],
      ratings: [], 
      boxoffice: parseInt(movie[0].boxoffice) || null, // Handle potential null boxoffice
      poster: movie[0].poster,
      plot: movie[0].plot,
    };

    movie.forEach(principalData => {
      processedMovie.principals.push({
      id: principalData.id || null, // Use nconst if present, otherwise 'id', or null if both missing
      name: principalData.name || null, // Similar handling for other properties
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



    res.status(200).json(processedMovie);

  } catch (error) {
    console.error("Error fetching movie data:", error);
    res.status(500).json({ error: true, message: "Internal server error" }); 
  }
});


module.exports = router;
