import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchMovieDetails } from "../api/movies";
import { AgGridReact } from "ag-grid-react";
import "../styles/ag-grid.css";

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
          style={{ textDecoration: "none", color: "#ffcc00" }}
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
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
            {movie.title}
          </h1>
          <p>
            <strong >Released:</strong> {movie.year || "N/A"}
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
          <p>
            <strong>Plot:</strong> {movie.plot || "N/A"}
          </p>
          <p>
            <strong>Box Office:</strong>{" "}
            {movie.boxoffice ? `$${movie.boxoffice.toLocaleString()}` : "N/A"}
          </p>
          <strong>Ratings:</strong>
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
        </div>
        <div style={{ marginLeft: "20px" }}>
          <img
            src={movie.poster}
            alt={`${movie.title} Poster`}
            style={{ width: "300px", borderRadius: "10px" }}
          />
        </div>
      </div>
      <h1 style={{ marginTop: "20px", fontSize: "1.5rem" }}>Cast</h1>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ width: "100%" }} className="my-custom-theme">
          <AgGridReact
            columnDefs={columnDefs}
            rowData={movie.principals || []} // Ensure rowData is an empty array if undefined
            components={components}
            domLayout="autoHeight"
            onGridReady={(params) => {
              params.api.sizeColumnsToFit(); // Automatically adjusts column widths
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MovieDetailsPage;
