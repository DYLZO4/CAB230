import api from "./axios";

export async function fetchMovies(searchQuery, year, page = 1) {
  try {
    const response = await api.get("/movies/search", {
      params: {
        title: searchQuery,
        year: year || undefined, 
        page: page, 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movies:", error);
    throw error;
  }
}

export async function fetchMovieDetails(imdbID) {
  try {
    const response = await api.get(`/movies/data/${imdbID}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching movie data:", error);
    throw error;
  }
}
