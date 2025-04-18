import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPersonDetails } from "../api/people";
import { AgGridReact } from "ag-grid-react";

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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
        <p className="text-lg text-red-500">
          You need to log in to access this page.
        </p>
        <div className="mt-4 space-x-4">
          <Link to="/login" className="text-blue-500 hover:underline">
            Login
          </Link>
          <span>|</span>
          <Link to="/register" className="text-blue-500 hover:underline">
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
      <div style={{ height: 500 }} className="my-custom-theme">
        <AgGridReact
          columnDefs={columnDefs}
          rowData={person.roles || []} // Ensure rowData is an empty array if undefined
          components={components}
        />
      </div>
    </div>
  );
};

export default PersonDetails;
