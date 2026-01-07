import axios from "axios";
import { tokenService } from "./tokenService";

const baseURL =
  window.location.hostname.includes("localhost")
    ? "http://localhost:3000/nava"
    : "https://nava-backend-a313880c75d2.herokuapp.com/nava";

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = tokenService.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let queue = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRoute =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/refresh") ||
      originalRequest?.url?.includes("/auth/me");

    if (isAuthRoute) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(api(originalRequest));
        });
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post(`${baseURL}/auth/refresh`, {
        refreshToken: tokenService.getRefresh(),
      });

      tokenService.setTokens({ accessToken: data.accessToken });

      queue.forEach((cb) => cb(data.accessToken));
      queue = [];

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      tokenService.clear();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;


// import axios from "axios";

// const baseURL =
//   window.location.hostname.includes("localhost") ||
//   window.location.hostname === "127.0.0.1"
//     ? "http://localhost:3000/nava"
//     : "https://nava-backend-a313880c75d2.herokuapp.com/nava";

// const api = axios.create({
//   baseURL,
//   withCredentials: true,
//   headers: { "Content-Type": "application/json" },
// });

// export default api;
