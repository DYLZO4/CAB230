import React, { useState, useRef } from "react";
import { fetchMovies } from "../api/movies";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import "../styles/ag-grid.css";
import G from "../assets/images/classifications/G.png";
import PG from "../assets/images/classifications/PG.png";
import M from "../assets/images/classifications/M.png";
import MA from "../assets/images/classifications/MA.png";
import R from "../assets/images/classifications/R.png";

ModuleRegistry.registerModules([AllCommunityModule]);

const MoviePage = () => {
  const [columnDefs] = useState([
    {
      headerName: "Title",
      field: "title",
      cellRenderer: "linkRenderer",
      sortable: false,
      flex: 2,
    },
    {
      headerName: "Year",
      field: "year",
      maxWidth: 75,
      sortable: false,
    },
    {
      headerName: "IMDb Rating",
      field: "imdbRating",
      maxWidth: 150,
      cellRenderer: "ratingRenderer",
      sortable: false,
    },
    {
      headerName: "Rotten Tomatoes",
      field: "rottenTomatoesRating",
      maxWidth: 150,
      cellRenderer: "ratingRenderer",
      sortable: false,
    },
    {
      headerName: "Metacritic",
      field: "metacriticRating",
      maxWidth: 150,
      cellRenderer: "ratingRenderer",
      sortable: false,
    },
    {
      headerName: "Classification",
      field: "classification",
      cellRenderer: "classificationRenderer",
      sortable: false,
    },
  ]);

  const getRatingColor = (rating) => {
    if (rating === null || rating === undefined) return "hsl(0, 0%, 50%)";
    const hue = (rating / 100) * 120;
    return `hsl(${hue}, 100%, 50%)`;
  };

  const components = {
    linkRenderer: (params) => {
      if (params.data?.isEndRow) {
        return (
          <div
            style={{
              fontStyle: "italic",
              color: "#D3D3D3",

              width: "100%",
            }}
          >
            End of Results
          </div>
        );
      }

      if (!params.data || !params.data.imdbID) {
        return <span>Invalid Data</span>;
      }

      return (
        <a
          href={`/movies/${params.data.imdbID}`}
          style={{ textDecoration: "none", color: "#ffcc00" }}
        >
          {params.value}
        </a>
      );
    },
    classificationRenderer: (params) => {
      if (params.data?.isEndRow) return "";

      if (!params.value) {
        return <span>No Classification</span>;
      }

      const classificationImages = {
        G: G,
        "TV-PG": PG,
        PG: PG,
        "PG-13": M,
        M: M,
        MA15: MA,
        "TV-MA": MA,
        R: R,
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
    ratingRenderer: (params) => {
      if (params.data?.isEndRow) return "";

      if (!params.value && params.value !== 0) {
        return <span>No Rating</span>;
      }

      let normalizedRating = params.value;
      if (params.colDef.field === "imdbRating") {
        normalizedRating = params.value * 10;
      } else if (params.colDef.field === "metacriticRating") {
        normalizedRating = parseFloat(params.value);
      }

      const color = getRatingColor(normalizedRating);
      return (
        <span style={{ color, fontWeight: "bold" }}>
          {params.colDef.field === "rottenTomatoesRating"
            ? `${params.value}%`
            : params.value}
        </span>
      );
    },
  };

  const gridRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  const handleSearch = () => {
    if (gridRef.current) {
      gridRef.current.api.purgeInfiniteCache();
    }
  };

  const dataSource = {
    getRows: async (params) => {
      const { startRow } = params;
      const page = Math.floor(startRow / 100) + 1;

      try {
        const data = await fetchMovies(searchQuery, year, page);
        const rows = data.data || [];
        const isLastPage = rows.length < 100;

        if (isLastPage) {
          rows.push({
            isEndRow: true,
            title: "End of Results",
          });
        }

        const lastRow = isLastPage ? startRow + rows.length : null;
        params.successCallback(rows, lastRow);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError(
          "An error occurred while fetching movies. Please try again later."
        );
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
          placeholder="Search by Title"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 rounded-md bg-cinema-gray placeholder-cinema-dark focus:outline-none focus:ring-2 focus:ring-cinema-gold text-black"
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
      </form>

      {error && <p className="text-cinema-red mb-4">{error}</p>}
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{ height: "500px", width: "100%" }}
          className="my-custom-theme"
        >
          <AgGridReact
            ref={gridRef}
            rowModelType="infinite"
            cacheBlockSize={100}
            maxBlocksInCache={10}
            columnDefs={columnDefs}
            components={components}
            datasource={dataSource}
            domLayout="normal"
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MoviePage;
