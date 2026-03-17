/**
 * Ponto de entrada principal para a API centralizada
 * Exporta todas as funcionalidades em um local conveniente
 */

// Cliente base e tipos
export { default as apiClient } from "./client";
export type { ApiResponse, ApiError } from "./client";

// Utilitários HTTP
export {
  get,
  post,
  put,
  patch,
  del,
  upload,
  download,
  withTimeout,
  getPaginated,
  getCached,
  clearCache,
} from "./utils";

// Re-exportar tipos úteis
export type { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

// Configurações da API
export const api = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10),
  env: process.env.NEXT_PUBLIC_ENVIRONMENT || "development",
  debug: process.env.NEXT_PUBLIC_DEBUG_MODE === "true",

  // Endpoints TJGOHub
  endpoints: {
    // Auth
    token: "/api/v1/user/token/",
    tokenRefresh: "/api/v1/user/token/refresh/",
    register: "/api/v1/user/register/",
    me: "/api/v1/user/user/me/",
    logout: "/api/v1/user/logout/",

    // Recursos principais
    projects: "/api/v1/projects/",
    environments: "/api/v1/environments/",
    testCases: "/api/v1/test-cases/",
    runs: "/api/v1/runs/",
    uploadReport: "/api/v1/runs/upload-report/",
    results: "/api/v1/results/",
    tags: "/api/v1/tags/",
  },
};
