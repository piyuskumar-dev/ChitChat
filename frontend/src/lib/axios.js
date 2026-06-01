import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}/api`;
  }
  return import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api";
};

export const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
