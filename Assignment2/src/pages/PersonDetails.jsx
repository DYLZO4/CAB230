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
  const [chartData, setChartData] = useState(null); // State for chart data

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
          style={{ textDecoration: "none", color: "#ffcc00" }}
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

        setChartData({
          labels: data.roles.map((role) => role.movieName),
          datasets: [
            {
              label: "IMDb Rating",
              data: data.roles.map((role) => role.imdbRating || 0),
              backgroundColor: "#b71c1c",
              borderColor: "#b71c1c",
              hoverBackgroundColor: "#ffcc00",
              hoverBorderColor: "#ffcc00",
              borderWidth: 1,
            },
          ],
        });
      } catch (err) {
        console.error("Error fetching person details:", err);

        if (err.message.includes("401")) {
          setAuthError(true);
        } else {
          setError("An error occurred while fetching person details.");
        }
      }
    };

    loadPersonDetails();
  }, [id]);

  const handleSortChanged = (params) => {
    const sortedData = [];
    params.api.forEachNodeAfterFilterAndSort((node) => {
      sortedData.push(node.data);
    });

    setChartData({
      labels: sortedData.map((role) => role.movieName),
      datasets: [
        {
          label: "IMDb Rating",
          data: sortedData.map((role) => role.imdbRating || 0),
          backgroundColor: "#b71c1c",
          borderColor: "#b71c1c",
          hoverBackgroundColor: "#ffcc00",
          hoverBorderColor: "#ffcc00",
          borderWidth: 1,
        },
      ],
    });
  };

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
      <div className="flex items-center justify-center min-h-screen bg-cinema-dark">
        <p className="text-lg text-red-500">{error}</p>
      </div>
    );
  }

  if (!person || !chartData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cinema-dark">
        <p className="text-lg text-cinema-gray">Loading...</p>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#D3D3D3",
        },
      },
      title: {
        display: true,
        text: "Spread of IMDb Ratings",
        color: "#D3D3D3",
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#D3D3D3",
        },
        grid: {
          color: "#2a2a2a",
        },
      },
      y: {
        ticks: {
          color: "#D3D3D3",
        },
        grid: {
          color: "#2a2a2a",
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
            rowData={person.roles || []}
            components={components}
            domLayout="normal"
            onGridReady={(params) => {
              params.api.sizeColumnsToFit();
            }}
            onSortChanged={handleSortChanged}
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
