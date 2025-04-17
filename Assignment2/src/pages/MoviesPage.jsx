import React, { useState, useRef } from "react";
import { fetchMovies } from "../api/movies";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const MoviePage = () => {
  const [columnDefs] = useState([
    { headerName: "Title", field: "title", cellRenderer: "linkRenderer" },
    { headerName: "Year", field: "year" },
    { headerName: "IMDb Rating", field: "imdbRating" },
    { headerName: "Rotten Tomatoes", field: "rottenTomatoesRating" },
    { headerName: "Metacritic", field: "metacriticRating" },
    { headerName: "Classification", field: "classification" },
  ]);

  const components = {
    linkRenderer: (params) => {
      if (!params.data || !params.data.imdbID) {
        return <span>Invalid Data</span>;
      }
      return (
        <a
          href={`/movies/${params.data.imdbID}`}
          style={{ textDecoration: "none", color: "blue" }}
        >
          {params.value}
        </a>
      );
    },
  };

  const gridRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    if (gridRef.current) {
      gridRef.current.api.purgeInfiniteCache(); // Refresh the grid data
    }
  };

  const dataSource = {
    getRows: async (params) => {
      const { startRow, endRow } = params;
      const page = Math.floor(startRow / 100) + 1; // Assuming 100 rows per page

      try {
        const data = await fetchMovies(searchQuery, year, page);
        const rows = data.data || [];
        const lastRow = rows.length < 100 ? startRow + rows.length : null;

        params.successCallback(rows, lastRow);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("An error occurred while fetching movies.");
        params.failCallback();
      }
    },
  };

  return (
    <div>
      <h1>Movie Page</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
      >
        <input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All Years</option>
          {Array.from({ length: 2023 - 1990 + 1 }, (_, i) => 1990 + i).map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
        </select>
        <button type="submit">Search</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ height: 500 }}>
        <AgGridReact
          ref={gridRef}
          rowModelType="infinite"
          cacheBlockSize={100}
          maxBlocksInCache={10}
          columnDefs={columnDefs}
          components={components} // Updated property
          datasource={dataSource}
        />
      </div>
    </div>
  );
};

export default MoviePage;
