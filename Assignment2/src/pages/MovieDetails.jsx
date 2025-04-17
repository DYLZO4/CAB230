import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMovieDetails } from "../api/movies";
import { AgGridReact } from "ag-grid-react";

const MovieDetailsPage = () => {
  const { imdbID } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

  const [columnDefs] = useState([
    { headerName: "Role", field: "category" },
    { headerName: "Name", field: "name", cellRenderer: "linkRenderer" },
    { headerName: "Character", field: "characters" },
  ]);

  const components = {
    linkRenderer: (params) => {
      if (!params.data || !params.data.id) {
        return <span>Invalid Data</span>;
      }
      return (
        <a
          href={`/person/${params.data.id}`}
          style={{ textDecoration: "none", color: "blue" }}
        >
          {params.value}
        </a>
      );
    },
  };

  useEffect(() => {
    const loadMovieDetails = async () => {
      try {
        const data = await fetchMovieDetails(imdbID);
        setMovie(data);
      } catch (err) {
        console.error("Error fetching movie details:", err);
        setError("An error occurred while fetching movie details.");
      }
    };

    loadMovieDetails();
  }, [imdbID]);

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!movie) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>
        {movie.title} ({movie.year})
      </h1>
      <img
        src={movie.poster}
        alt={`${movie.title} Poster`}
        style={{ width: "300px" }}
      />
      <p>
        <strong>Plot:</strong> {movie.plot || "N/A"}
      </p>
      <p>
        <strong>Genres:</strong>{" "}
        {movie.genres && movie.genres.length > 0
          ? movie.genres.join(", ")
          : "N/A"}
      </p>
      <p>
        <strong>Runtime:</strong>{" "}
        {movie.runtime ? `${movie.runtime} minutes` : "N/A"}
      </p>
      <p>
        <strong>Country:</strong> {movie.country || "N/A"}
      </p>
      <div style={{ height: 500 }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={movie.principals || []} // Ensure rowData is an empty array if undefined
          components={components}
        />
      </div>
      <h2>Ratings</h2>
      <ul>
        {movie.ratings && movie.ratings.length > 0 ? (
          movie.ratings.map((rating, index) => (
            <li key={index}>
              {rating.source}: {rating.value}
            </li>
          ))
        ) : (
          <li>N/A</li>
        )}
      </ul>
      <p>
        <strong>Box Office:</strong>{" "}
        {movie.boxoffice ? `$${movie.boxoffice.toLocaleString()}` : "N/A"}
      </p>
    </div>
  );
};

export default MovieDetailsPage;
