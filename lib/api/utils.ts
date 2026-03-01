// =============================================================================
// CONCEITO 1: Camada de utilitários HTTP
//
// Este arquivo é uma camada de abstração sobre o apiClient.
// Em vez de chamar apiClient.get(), apiClient.post() diretamente,
// os componentes chamam as funções get(), post(), put() daqui.
//
// Por que essa camada extra?
//   1. Adiciona funcionalidades (retry, cache, paginação) de forma transparente
//   2. Normaliza todas as respostas para o formato ApiResponse<T>
//   3. Transforma erros do Axios em ApiError padronizado
//
// Paralelo Django: é como criar funções utilitárias em um arquivo utils.py
// que encapsulam chamadas a serviços externos com tratamento de erro.
// =============================================================================

import { AxiosRequestConfig, AxiosResponse } from "axios";

import apiClient, { ApiResponse, ApiError } from "./client";

// Estende as opções do Axios com campos extras específicos do projeto
// Omit<AxiosRequestConfig, "url" | "method"> → herda tudo do Axios exceto
// url e method (que são passados como parâmetros separados)
interface RequestOptions extends Omit<AxiosRequestConfig, "url" | "method"> {
  showLoader?: boolean;  // para uso futuro com um loading global
  autoRetry?: boolean;   // tenta novamente se falhar?
  maxRetries?: number;   // quantas vezes tentar
  customHeaders?: Record<string, string>; // headers extras por requisição
}

// =============================================================================
// CONCEITO 2: Retry com Exponential Backoff
//
// Quando uma requisição falha por erro de servidor (5xx) ou timeout,
// faz sentido tentar de novo após um tempo. Mas não fica tentando infinitamente.
//
// Exponential Backoff → cada tentativa espera o DOBRO do tempo anterior:
//   Tentativa 1 → espera 1s
//   Tentativa 2 → espera 2s
//   Tentativa 3 → espera 4s (mas limitado a 5s pelo Math.min)
//
// Math.min(1000 * 2^(attempt-1), 5000):
//   attempt=1 → min(1000, 5000) = 1000ms
//   attempt=2 → min(2000, 5000) = 2000ms
//   attempt=3 → min(4000, 5000) = 4000ms
//
// Erros 4xx NÃO fazem retry — são erros do cliente (dados inválidos,
// não autorizado, etc.) que não vão se resolver sozinhos.
// =============================================================================
const withRetry = async function <T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries: number = 3,
): Promise<AxiosResponse<T>> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Erros 4xx (exceto 408 timeout e 429 rate limit) → não faz retry
      if (
        error.status >= 400 &&
        error.status < 500 &&
        error.status !== 408 &&
        error.status !== 429
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        // Exponential backoff — espera antes de tentar de novo
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));

        if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
          console.log(`[API] Retry ${attempt}/${maxRetries} em ${delay}ms`);
        }
      }
    }
  }

  throw lastError;
};

// =============================================================================
// CONCEITO 3: Função genérica makeRequest — o coração dos utilitários
//
// Todos os métodos HTTP (get, post, put, patch, del) chamam makeRequest.
// Isso evita repetição e garante que:
//   1. A resposta sempre tem o formato ApiResponse<T>
//   2. Os erros sempre têm o formato ApiError
//   3. As opções de retry são aplicadas consistentemente
//
// Generic <T = any>: T é o tipo do dado retornado.
//   makeRequest<User>(...) → retorna Promise<ApiResponse<User>>
//   makeRequest<string>(...) → retorna Promise<ApiResponse<string>>
// =============================================================================
const makeRequest = async <T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: any,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const {
    autoRetry = false,
    maxRetries = 3,
    customHeaders,
    ...config
  } = options;

  const requestConfig: AxiosRequestConfig = {
    method,
    url,
    data,
    headers: {
      ...config.headers,
      ...customHeaders, // customHeaders sobrescreve os headers padrão
    },
    ...config,
  };

  // A função de requisição encapsulada (para poder passar para withRetry)
  const makeRequestFn = () => apiClient.request<T>(requestConfig);

  try {
    const response = autoRetry
      ? await withRetry(makeRequestFn, maxRetries) // com retry
      : await makeRequestFn();                      // sem retry

    // Normaliza a resposta do Axios para o formato ApiResponse<T>
    return {
      data: response.data,
      success: true,
      status: response.status,
      message: response.statusText,
    };

  } catch (error: any) {
    // Normaliza o erro para o formato ApiError
    const apiError: ApiError =
      error instanceof Error
        ? {
            message: error.message,
            status: (error as any).status || 500,
            code: (error as any).code,
            details: (error as any).details,
          }
        : error; // Já é um ApiError (vindo do interceptor do client.ts)

    throw apiError; // propaga para o catch() de quem chamou (ex: authStore.login)
  }
};

// =============================================================================
// CONCEITO 4: Métodos HTTP públicos
//
// Funções simples que chamam makeRequest com o método correto.
// São estas que o resto da aplicação importa e usa:
//
//   import { get, post } from "@/lib/api"
//   const users = await get<User[]>("/api/v1/users/")
//   const token = await post<TokenResponse>("/api/v1/user/token/", { email, password })
//
// GET com autoRetry=true → faz sentido para leitura (idempotente)
// POST/PUT/PATCH/DELETE sem retry → evita criar/modificar/deletar duplicado
// =============================================================================

export const get = async <T = any>(
  url: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>("GET", url, undefined, {
    autoRetry: true,   // GET é idempotente — pode repetir sem risco
    maxRetries: 2,
    ...options,
  });
};

export const post = async <T = any>(
  url: string,
  data?: any,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>("POST", url, data, options);
};

export const put = async <T = any>(
  url: string,
  data?: any,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>("PUT", url, data, options);
};

export const patch = async <T = any>(
  url: string,
  data?: any,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>("PATCH", url, data, options);
};

export const del = async <T = any>(
  url: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>("DELETE", url, undefined, options);
};

// =============================================================================
// CONCEITO 5: Upload e Download de arquivos
//
// Upload usa FormData em vez de JSON — é o multipart/form-data do HTML,
// igual a um <form enctype="multipart/form-data"> no Django.
//
// Download usa responseType: "blob" — baixa o arquivo binário e cria
// um link temporário no DOM para forçar o download no browser.
// =============================================================================

export const upload = async <T = any>(
  url: string,
  file: File | FormData,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const formData = file instanceof FormData ? file : new FormData();

  if (file instanceof File) {
    formData.append("file", file);
  }

  return makeRequest<T>("POST", url, formData, {
    ...options,
    headers: {
      "Content-Type": "multipart/form-data",
      ...options.headers,
    },
  });
};

export const download = async (
  url: string,
  filename?: string,
  options: RequestOptions = {},
): Promise<void> => {
  try {
    const response = await apiClient.get(url, {
      ...options,
      responseType: "blob", // recebe dados binários em vez de JSON
    });

    // Cria uma URL temporária em memória apontando para o blob
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);

    // Cria um <a> invisível, clica nele e remove — truque padrão para download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Libera a memória do blob
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error: any) {
    console.error("[API] Erro no download:", error);
    throw error;
  }
};

export const withTimeout = async <T = any>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  data?: any,
  timeoutMs: number = 5000,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  return makeRequest<T>(method, url, data, {
    ...options,
    timeout: timeoutMs, // sobrescreve o timeout padrão do cliente
  });
};

// =============================================================================
// CONCEITO 6: Paginação
//
// O DRF retorna listas paginadas por padrão (page, limit, count...).
// getPaginated monta os query params automaticamente e retorna a estrutura
// padronizada com os dados E as informações de paginação.
//
// Paralelo Django: é como montar manualmente ?page=2&limit=20&search=texto
// que o DRF recebe via request.query_params.
// =============================================================================

interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  filters?: Record<string, any>; // filtros dinâmicos: { status: "ACTIVE", ... }
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const getPaginated = async <T = any>(
  url: string,
  params: PaginationParams = {},
  options: RequestOptions = {},
): Promise<ApiResponse<PaginatedResponse<T>>> => {
  // URLSearchParams constrói a query string: ?page=1&limit=20&search=foo
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.append("page", params.page.toString());
  if (params.limit) searchParams.append("limit", params.limit.toString());
  if (params.sort) searchParams.append("sort", params.sort);
  if (params.order) searchParams.append("order", params.order);
  if (params.search) searchParams.append("search", params.search);

  // Filtros extras → ?filter[status]=ACTIVE&filter[priority]=HIGH
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(`filter[${key}]`, value.toString());
      }
    });
  }

  const fullUrl = `${url}?${searchParams.toString()}`;

  return get<PaginatedResponse<T>>(fullUrl, { autoRetry: true, ...options });
};

// =============================================================================
// CONCEITO 7: Cache em memória com Map
//
// Map é como um dict do Python: { chave → valor }
// Aqui cada chave é a URL + opções, e o valor são os dados + metadados de expiração.
//
// Cache serve para evitar requisições repetidas para dados que não mudam
// frequentemente — ex: lista de projetos, configurações globais.
//
// TTL (Time To Live): quanto tempo o dado fica no cache antes de expirar.
// Default: 5 minutos (300000ms).
// =============================================================================
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const getCached = async <T = any>(
  url: string,
  ttlMs: number = 300000, // 5 minutos em millisegundos
  options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
  const cacheKey = `${url}_${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  // Cache hit: dado existe E ainda não expirou
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log(`[API] Cache hit para ${url}`);
    }

    return { data: cached.data, success: true, status: 200, message: "Cached response" };
  }

  // Cache miss: busca da API e salva no cache
  try {
    const response = await get<T>(url, options);

    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    return response;
  } catch (error) {
    // Fallback: se a API falhou mas temos cache expirado, retorna o stale
    if (cached) {
      console.warn("[API] Usando cache expirado devido a erro na requisição");
      return { data: cached.data, success: true, status: 200, message: "Stale cached response" };
    }
    throw error;
  }
};

// Limpa o cache: sem argumento limpa tudo; com urlPattern limpa os que casam
export const clearCache = (urlPattern?: string): void => {
  if (urlPattern) {
    const regex = new RegExp(urlPattern);
    const keysToDelete: string[] = [];

    cache.forEach((_, key) => {
      if (regex.test(key)) keysToDelete.push(key);
    });

    keysToDelete.forEach((key) => cache.delete(key));
  } else {
    cache.clear();
  }
};

export { apiClient };
