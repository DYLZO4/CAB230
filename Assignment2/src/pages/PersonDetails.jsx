import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPersonDetails } from "../api/people";
import { AgGridReact } from "ag-grid-react";

const PersonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [error, setError] = useState(null);

  const [columnDefs] = useState([
    { headerName: "Role", field: "category" },
    { headerName: "Movie", field: "movieName"},
    { headerName: "Character", field: "characters" },
    { headerName: "Rating", field: "imdbRating" },
  ]);

  useEffect(() => {
    const loadPersonDetails = async () => {
      try {
        const data = await fetchPersonDetails(id);
        setPerson(data);
      } catch (err) {
        console.error("Error fetching person details:", err);

        if (err.message.includes("jwtToken is not defined")) {
          navigate("/login"); // Redirect to the login screen
        } else {
          setError("An error occurred while fetching person details.");
        }
      }
    };

    loadPersonDetails();
  }, [id, navigate]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!person) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Person Details</h1>
      <h2>{person.name}</h2>
      <p>Birth Year: {person.birthYear}</p>
      {person.deathYear && <p>Death Year: {person.deathYear}</p>}
      <h3>Roles</h3>
      <div style={{ height: 500 }}>
        <AgGridReact
          columnDefs={columnDefs}
          rowData={person.roles || []} // Ensure rowData is an empty array if undefined
        />
      </div>
    </div>
  );
};

export default PersonDetails;