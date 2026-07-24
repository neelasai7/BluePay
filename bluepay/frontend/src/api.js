import axios from "axios";

// In production, set VITE_API_URL in your hosting provider's environment
// variables to your deployed backend URL (e.g. https://bluepay-api.onrender.com/api).
// Locally it falls back to the Flask dev server.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bluepay_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
