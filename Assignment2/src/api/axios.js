import axios from 'axios';

axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '-1';

const instance = axios.create({
  baseURL: 'http://4.237.58.241:3000',
});

// Separate instance for refreshing tokens
const refreshInstance = axios.create({
  baseURL: 'http://4.237.58.241:3000',
});

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/user/refresh') &&
      localStorage.getItem('refreshToken')
    ) {
      originalRequest._retry = true;
      console.log('Error response status:', error.response.status);
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await refreshInstance.post('/user/refresh', {
          refreshToken,
        });
      
        const newAccessToken = res.data.bearerToken.token;
        const newRefreshToken = res.data.refreshToken.token;
      
        // Store new tokens
        localStorage.setItem('jwtToken', newAccessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
      
        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        localStorage.removeItem('jwtToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);


export default instance;
