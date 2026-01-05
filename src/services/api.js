import axios from "axios";

const baseURL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/nava"
    : "https://nava-backend-a313880c75d2.herokuapp.com/nava";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
