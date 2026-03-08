"use client";

import axios from "axios";

// 🔹 Only use backend URL from ENV
const BASE_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!BASE_URL) {
  throw new Error("❌ NEXT_PUBLIC_API_URL is not defined");
}

// Main API instance
const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ send cookies
});

// Refresh-only instance (no interceptors)
const refreshAPI = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // ✅ send cookies
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ❌ Never intercept /refresh-token itself
    if (originalRequest?.url?.includes("/refresh-token")) {
      return Promise.reject(error);
    }

    // ♻️ 401 handling with refresh token
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => API(originalRequest));
      }

      isRefreshing = true;

      try {
        console.log("♻️ Calling /refresh-token...");
        await refreshAPI.get("/refresh-token");
        console.log("✅ Refresh token success");

        processQueue(null);
        return API(originalRequest);
      } catch (err) {
        processQueue(err);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
