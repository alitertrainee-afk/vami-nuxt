// libs imports
import axios from "axios";

// local imports
import { setupRequestInterceptor } from "./interceptors/request.interceptor.js";
import { setupResponseInterceptor } from "./interceptors/response.interceptor.js";

let _instance = null;

function getAxiosInstance() {
  if (_instance) return _instance;

  const config = useRuntimeConfig();

  _instance = axios.create({
    baseURL: config.public.apiBaseUrl || "http://localhost:5000/api",
    timeout: 10000,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  setupRequestInterceptor(_instance);
  setupResponseInterceptor(_instance);

  return _instance;
}

// Use a Proxy to lazily initialize — any property access triggers creation
export const axiosInstance = new Proxy(
  {},
  {
    get(_, prop) {
      return getAxiosInstance()[prop];
    },
  },
);

export default axiosInstance;
