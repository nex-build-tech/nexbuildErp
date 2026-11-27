import axios, { AxiosError, AxiosResponse } from "axios";
import { JWT_HOST_API } from "@/configs/auth";

const axiosInstance = axios.create({
  baseURL: JWT_HOST_API,
  withCredentials: true,
  headers: {
    "X-Tenant": "kings",
  },
});

axiosInstance.interceptors.request.use((config) => {
  // Strip duplicate /api/v1 prefix if provided in url since baseURL already includes it
  if (config.url?.startsWith("/api/v1/")) {
    config.url = config.url.replace(/^\/api\/v1/, "");
  } else if (config.url?.startsWith("api/v1/")) {
    config.url = config.url.replace(/^api\/v1/, "");
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    const errorData = error.response?.data as any;
    const message =
      errorData?.error?.message ||
      errorData?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export default axiosInstance;
