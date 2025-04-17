import api from "./axios";

export async function fetchPersonDetails(id) {
  try {
    const response = await api.get(`/people/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`, 
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching movie data:", error);
    throw error;
  }
}
