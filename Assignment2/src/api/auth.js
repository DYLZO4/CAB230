import api from './axios';

// LOGIN
export async function loginUser(email, password) {
  try {
    const response = await api.post('/user/login', { email, password });
    const jwtToken = response.data.bearerToken.token; // Extract token from bearerToken
    const refreshToken = response.data.refreshToken.token; // Extract token from refreshToken

    // Store tokens in localStorage
    localStorage.setItem('jwtToken', jwtToken);
    localStorage.setItem('refreshToken', refreshToken);

    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// REGISTER
export async function registerUser(email, password) {
  try {
    const response = await api.post('/user/register', { email, password });
    const jwtToken = response.data.bearerToken.token; // Extract token from bearerToken
    const refreshToken = response.data.refreshToken.token; // Extract token from refreshToken

    // Store tokens in localStorage (if provided)
    if (jwtToken && refreshToken) {
      localStorage.setItem('jwtToken', jwtToken);
      localStorage.setItem('refreshToken', refreshToken);
    }

    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}