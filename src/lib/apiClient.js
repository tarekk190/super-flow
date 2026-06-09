// Global API client (placeholder — wire up to your backend)
// import axios from 'axios';

// const apiClient = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
//   headers: { 'Content-Type': 'application/json' },
// });

// apiClient.interceptors.request.use(config => {
//   const token = localStorage.getItem('auth_token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// apiClient.interceptors.response.use(
//   res => res,
//   err => Promise.reject(err)
// );

// export default apiClient;

export {};
