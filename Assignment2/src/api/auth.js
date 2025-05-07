import api from "./axios";

// LOGIN
export async function loginUser(email, password) {
  try {
    const response = await api.post("/user/login", { email, password });
    const jwtToken = response.data.bearerToken.token;
    const refreshToken = response.data.refreshToken.token;

    localStorage.setItem("jwtToken", jwtToken);
    localStorage.setItem("refreshToken", refreshToken);

    return response.data;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// REGISTER
export async function registerUser(email, password) {
  try {
    const response = await api.post("/user/register", { email, password });
    return response.data;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

// LOGOUT
export async function logoutUser(refreshToken) {
  try {
    const response = await api.post("/user/logout", { refreshToken });

    if (!response.data.error) {
      // Clear tokens from localStorage
      localStorage.removeItem("jwtToken");
      localStorage.removeItem("refreshToken");
      console.log(response.data.message); // Log success message
    } else {
      console.error("Logout failed:", response.data.message);
    }

    return response.data;
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
}
