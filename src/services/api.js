import axios from "axios";

const baseURL =
  window.location.hostname.includes("localhost") ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/nava"   // <<<<< note o /nava
    : "https://SEU_BACKEND_PRODUCAO/nava";

const api = axios.create({
  baseURL,
  withCredentials: true, // necessário para enviar/receber o cookie httpOnly
  headers: { "Content-Type": "application/json" },
});

export default api;
