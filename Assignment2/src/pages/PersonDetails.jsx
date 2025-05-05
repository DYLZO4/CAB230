import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPersonDetails } from "../api/people";
import { AgGridReact } from "ag-grid-react";
import { Bar } from "react-chartjs-2"; // Import Bar chart
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const PersonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false);

  const [columnDefs] = useState([
    { headerName: "Role", field: "category" },
    { headerName: "Movie", field: "movieName", cellRenderer: "linkRenderer" },
    { headerName: "Character", field: "characters" },
    { headerName: "Rating", field: "imdbRating" },
  ]);

  const components = {
    linkRenderer: (params) => {
      if (!params.data || !params.data.movieId) {
        return <span>Invalid Data</span>;
      }
      return (
        <a
          href={`/movies/${params.data.movieId}`}
          style={{ textDecoration: "none", color: "#ffcc00" }} // Gold color for links
        >
          {params.value}
        </a>
      );
    },
  };

  useEffect(() => {
    const loadPersonDetails = async () => {
      try {
        const data = await fetchPersonDetails(id);
        setPerson(data);
      } catch (err) {
        console.error("Error fetching person details:", err);

        if (err.message.includes("401")) {
          setAuthError(true); // Set authentication error
          console.log("Authentication error:", err.message);
        } else {
          setError("An error occurred while fetching person details.");
        }
      }
    };

    loadPersonDetails();
  }, [id]);

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-cinema-dark text-cinema-lightdark">
        <h1 className="text-3xl font-bold text-cinema-gold mb-4">
          Authentication Required
        </h1>
        <p className="text-lg text-cinema-gray mb-6">
          You need to log in to access this page.
        </p>
        <div className="flex space-x-4">
          <Link
            to="/login"
            className="px-6 py-2 rounded-md bg-cinema-red text-white hover:bg-cinema-gold hover:text-cinema-dark transition"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2 rounded-md bg-cinema-lightdark text-white hover:bg-cinema-gold hover:text-cinema-dark transition"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  // Prepare data for the chart
  const chartData = {
    labels: person.roles.map((role) => role.movieName), // Movie names as labels
    datasets: [
      {
        label: "IMDb Rating",
        data: person.roles.map((role) => role.imdbRating || 0), // IMDb ratings as data
        backgroundColor: "#b71c1c", // Tailwind cinema.red for bars
        borderColor: "#b71c1c", // Tailwind cinema.red for borders
        hoverBackgroundColor: "#ffcc00", // Tailwind cinema.gold for hover effect
        hoverBorderColor: "#ffcc00", // Tailwind cinema.gold for hover border
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#D3D3D3", // Tailwind cinema.gray for legend text
        },
      },
      title: {
        display: true,
        text: "Spread of IMDb Ratings",
        color: "#D3D3D3", // Tailwind cinema.gray for title text
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#D3D3D3", // Tailwind cinema.gray for x-axis labels
        },
        grid: {
          color: "#2a2a2a", // Tailwind cinema.lightdark for grid lines
        },
      },
      y: {
        ticks: {
          color: "#D3D3D3", // Tailwind cinema.gray for y-axis labels
        },
        grid: {
          color: "#2a2a2a", // Tailwind cinema.lightdark for grid lines
        },
      },
    },
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "10px" }}>
          {person.name}
        </h1>
        <p>
          <strong>Birth Year:</strong> {person.birthYear || "N/A"}
        </p>
        {person.deathYear && (
          <p>
            <strong>Death Year:</strong> {person.deathYear}
          </p>
        )}
        <h2 style={{ marginTop: "20px", fontSize: "1.5rem" }}>Roles</h2>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{ height: "500px", width: "100%" }}
          className="my-custom-theme"
        >
          <AgGridReact
            columnDefs={columnDefs}
            rowData={person.roles || []} // Ensure rowData is an empty array if undefined
            components={components}
            domLayout="normal" // Adjusts height to fit content
            suppressHorizontalScroll={true} // Disables horizontal scrolling
            onGridReady={(params) => {
              params.api.sizeColumnsToFit(); // Automatically adjusts column widths
            }}
          />
        </div>
      </div>
      <div style={{ marginTop: "40px" }}>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default PersonDetails;
