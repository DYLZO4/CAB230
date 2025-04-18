import React, { useState, useRef } from "react";
import { fetchMovies } from "../api/movies";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "../styles/ag-grid.css";

ModuleRegistry.registerModules([AllCommunityModule]);

const MoviePage = () => {
  const [columnDefs] = useState([
    { headerName: "Title", field: "title", cellRenderer: "linkRenderer" },
    { headerName: "Year", field: "year" },
    { headerName: "IMDb Rating", field: "imdbRating" },
    { headerName: "Rotten Tomatoes", field: "rottenTomatoesRating" },
    { headerName: "Metacritic", field: "metacriticRating" },
    {
      headerName: "Classification",
      field: "classification",
      cellRenderer: "classificationRenderer", // Use the custom renderer
    },
  ]);

  const components = {
    linkRenderer: (params) => {
      if (!params.data || !params.data.imdbID) {
        return <span>Invalid Data</span>;
      }
      return (
        <a
          href={`/movies/${params.data.imdbID}`}
          style={{ textDecoration: "none", color: "#ffcc00" }} // Gold color for links
        >
          {params.value}
        </a>
      );
    },
    classificationRenderer: (params) => {
      if (!params.value) {
        return <span>No Classification</span>;
      }

      // Map classification to image paths
      const classificationImages = {
        G: "/images/classifications/G.png",
        "TV-PG": "/images/classifications/PG.png",
        PG: "/images/classifications/PG.png",
        "PG-13": "/images/classifications/M.png",
        M: "/images/classifications/M.png",
        MA15: "/images/classifications/MA.png",
        "TV-MA": "/images/classifications/MA.png",
        R: "/images/classifications/R.png",
      };

      const imagePath = classificationImages[params.value];

      if (!imagePath) {
        return <span>Unknown Classification</span>;
      }

      return (
        <img
          src={imagePath}
          alt={params.value}
          style={{ width: "30px", height: "30px" }}
        />
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
    <div className="min-h-screen bg-cinema-dark text-cinema-lightdark p-6">
      <h1 className="text-4xl font-bold text-cinema-gold mb-6">Movies</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}
        className="flex flex-col md:flex-row items-center gap-4 mb-6"
      >
        <input
          type="text"
          placeholder="Search by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-md bg-cinema-gray   text-white placeholder-cinema-dark focus:outline-none focus:ring-2 focus:ring-cinema-gold"
        />
        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="px-4 py-2 rounded-md bg-cinema-lightdark text-white focus:outline-none focus:ring-2 focus:ring-cinema-gold"
        >
          <option value="">All Years</option>
          {Array.from({ length: 2023 - 1990 + 1 }, (_, i) => 1990 + i).map(
            (year) => (
              <option key={year} value={year}>
                {year}
              </option>
            )
          )}
        </select>
        <button
          type="submit"
          className="px-6 py-2 rounded-md bg-cinema-red text-white hover:bg-cinema-gold hover:text-cinema-dark transition"
        >
          Search
        </button>
      </form>

      {error && <p className="text-cinema-red mb-4">{error}</p>}

      <div style={{ height: 500 }} className="my-custom-theme">
        <AgGridReact
          ref={gridRef}
          rowModelType="infinite"
          cacheBlockSize={100}
          maxBlocksInCache={10}
          columnDefs={columnDefs}
          components={components}
          datasource={dataSource}
          
        />
      </div>
    </div>
  );
};

export default MoviePage;