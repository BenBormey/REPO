// src/services/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5203/api",
  withCredentials: false
});

// Attach token automatically on each request
api.interceptors.request.use((config) => {
  // Prefer separate token key (Pinia store persists) then fallback to legacy 'auth' blob
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  }
  const raw = localStorage.getItem("auth");
  if (raw) {
    try {
      const { token: t, expiresAt } = JSON.parse(raw);
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        localStorage.removeItem("auth");
      } else if (t) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${t}`;
      }
    } catch {}
  }
  return config;
});

export default api;
