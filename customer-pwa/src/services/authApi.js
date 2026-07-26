import axios from 'axios';

const authApi = axios.create({
  baseURL: '/api',
});

authApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('pharmex_customer_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pharmex_customer_token');
    }
    return Promise.reject(error);
  }
);

export default authApi;
