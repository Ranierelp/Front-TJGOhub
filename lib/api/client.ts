// =============================================================================
// CONCEITO 1: Cliente HTTP centralizado (Axios)
//
// Em vez de fazer fetch() ou axios() diretamente em cada componente,
// criamos UMA instância configurada do Axios e a reutilizamos em toda a app.
//
// Vantagens:
//   • baseURL configurada uma vez (não repetir http://localhost:8000 em todo lugar)
//   • Token JWT adicionado automaticamente em toda requisição
//   • Tratamento de erros centralizado (401, 403, 500...)
//
// Paralelo Django: é como um requests.Session() configurado com headers
// e auth padrão — você configura uma vez e todas as requisições herdam.
//
// Paralelo mais próximo ainda: é como o APIClient do DRF test framework,
// mas para o frontend.
// =============================================================================

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

import { useAuthStore } from "@/stores/authStore";

// =============================================================================
// CONCEITO 2: Interfaces de resposta padronizadas
//
// Toda função de API retorna ApiResponse<T> — um envelope padrão.
// Isso garante que o código que consome a API sempre sabe o que esperar:
//   { data: T, success: boolean, status: number, message?: string }
//
// O <T> é um Generic — como Generic Types do Python (TypeVar):
//   ApiResponse<User>   → data é do tipo User
//   ApiResponse<string> → data é uma string
//
// Sem generics, teríamos que criar uma interface diferente para cada endpoint.
// Com generics, uma interface serve para todos.
// =============================================================================
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  status: number;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any; // os erros detalhados do DRF (ex: {email: ["Este campo é obrigatório."]})
}

// =============================================================================
// CONCEITO 3: Factory function para criar o cliente Axios
//
// axios.create() cria uma instância configurada do Axios.
// Configurações que se aplicam a TODAS as requisições feitas por esta instância:
//   • baseURL → prefixo automático de URL (localhost:8000 em dev)
//   • timeout → cancela a requisição se demorar mais de X ms
//   • headers → headers padrão (JSON, Accept)
//
// process.env.NEXT_PUBLIC_* são variáveis de ambiente do Next.js.
// Apenas variáveis com prefixo NEXT_PUBLIC_ ficam disponíveis no browser.
// (As sem prefixo ficam só no servidor — como settings.py do Django)
// =============================================================================
const createApiClient = (): AxiosInstance => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const timeout = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10);

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  return client;
};

// Instância global — criada uma vez, usada em toda a aplicação
export const apiClient = createApiClient();

// =============================================================================
// CONCEITO 4: Interceptadores (Interceptors)
//
// Interceptadores são funções que INTERCEPTAM cada requisição/resposta
// antes de chegar ao seu destino. São executados automaticamente.
//
// Existem dois tipos:
//   • interceptors.request.use()  → roda ANTES de enviar a requisição
//   • interceptors.response.use() → roda DEPOIS de receber a resposta
//
// Paralelo Django: são EXATAMENTE como os Django Middlewares:
//   • process_request()  → interceptor de request
//   • process_response() → interceptor de response
//
// Cada interceptor recebe dois callbacks:
//   1. Função de sucesso → manipula a config/response
//   2. Função de erro   → manipula erros na etapa
// =============================================================================

// --- Interceptador de REQUEST --- Adiciona o token JWT automaticamente
apiClient.interceptors.request.use(
  (config) => {
    // useAuthStore.getState() acessa a store Zustand FORA de um componente React.
    // Dentro de componentes usamos o hook useAuthStore().
    // Fora de componentes (como aqui) usamos .getState() diretamente.
    const token = useAuthStore.getState().getAccessToken();

    if (token && !useAuthStore.getState().isTokenExpired()) {
      // Adiciona o header Authorization em TODA requisição autenticada.
      // Equivalente a: headers = {"Authorization": f"Bearer {token}"}
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (process.env.NEXT_PUBLIC_ENVIRONMENT === "development") {
      config.headers["X-Debug-Mode"] = "true";
    }

    // Log útil em desenvolvimento — aparece no console do browser
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      const fullUrl = config.baseURL
        ? `${config.baseURL}${config.url}`
        : config.url;
      console.log(`[API] ${config.method?.toUpperCase()} ${fullUrl}`);
    }

    return config; // Devolve a config modificada para o Axios continuar
  },
  (error: AxiosError) => {
    console.error("[API] Erro na configuração da requisição:", error);
    return Promise.reject(error);
  },
);

// --- Interceptador de RESPONSE --- Trata erros e renovação de token
apiClient.interceptors.response.use(

  // Callback de SUCESSO (status 2xx)
  (response: AxiosResponse) => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.log(`[API] Response ${response.status}:`, response.data);
    }
    return response; // Repassa a resposta sem modificar
  },

  // Callback de ERRO (status 4xx, 5xx, timeout, network error...)
  async (error: AxiosError) => {

    // ==========================================================================
    // CONCEITO 5: Renovação automática de token (Token Refresh)
    //
    // Quando o backend retorna 401 (Unauthorized), pode ser que o access token
    // expirou. Neste caso, tentamos usar o refresh token para pegar um novo.
    //
    // originalRequest._retry previne loop infinito:
    //   1ª vez → 401 → tenta refresh → repete a requisição
    //   2ª vez → 401 → _retry já é true → não tenta de novo
    //
    // Paralelo: é como o middleware SessionMiddleware do Django que,
    // quando a sessão expirou, tenta renová-la antes de redirecionar para login.
    // ==========================================================================
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authStore = useAuthStore.getState();

        if (authStore.isTokenExpired()) {
          // Token expirado sem chance de refresh → logout e redireciona para login
          console.warn("[API] Token expirado, fazendo logout...");
          await authStore.logout();

          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname + window.location.search;
            const loginUrl = new URL("/auth/login", window.location.origin);

            if (currentPath !== "/" && !currentPath.includes("/auth/")) {
              loginUrl.searchParams.set("redirect", currentPath);
            }

            // window.location.href causa reload completo da página — intencional aqui
            // para garantir que o estado do React seja resetado completamente
            window.location.href = loginUrl.toString();
          }

          return Promise.reject(new Error("Token expirado"));
        }

        // Token ainda válido mas servidor retornou 401 → tenta reenviar com token atualizado
        const newToken = authStore.getAccessToken();

        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest); // Repete a requisição original
        }

      } catch (refreshError) {
        console.error("[API] Erro ao renovar token:", refreshError);
        await useAuthStore.getState().logout();
      }
    }

    // ==========================================================================
    // CONCEITO 6: Normalização de erros HTTP
    //
    // Traduz os status HTTP em mensagens legíveis em português.
    // Centralizar aqui garante que todos os erros da app usam as mesmas mensagens.
    //
    // Paralelo Django: é como um handler customizado de exceção no DRF:
    //   EXCEPTION_HANDLER = 'myapp.exceptions.custom_exception_handler'
    // ==========================================================================
    const apiError: ApiError = {
      message: "Erro interno do servidor",
      status: error.response?.status || 500,
      code: error.code,
      details: error.response?.data, // os dados de erro do DRF (campos, mensagens)
    };

    switch (error.response?.status) {
      case 400: apiError.message = "Dados inválidos na requisição"; break;
      case 403: apiError.message = "Acesso negado - permissões insuficientes"; break;
      case 404: apiError.message = "Recurso não encontrado"; break;
      case 409: apiError.message = "Conflito - recurso já existe"; break;
      case 422: apiError.message = "Dados de entrada inválidos"; break;
      case 429: apiError.message = "Muitas requisições - tente novamente em alguns instantes"; break;
      case 500: apiError.message = "Erro interno do servidor"; break;
      case 502: apiError.message = "Serviço temporariamente indisponível"; break;
      case 503: apiError.message = "Serviço em manutenção"; break;
      default:
        if (error.message?.includes("timeout")) {
          apiError.message = "Tempo limite da requisição excedido";
        } else if (error.message?.includes("Network Error")) {
          apiError.message = "Erro de conexão - verifique sua internet";
        }
    }

    if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
      console.error("[API] Erro na requisição:", {
        status: error.response?.status || "N/A",
        message: apiError.message,
        url: error.config?.url || "N/A",
        method: error.config?.method?.toUpperCase() || "N/A",
        data: error.response?.data,
      });
    }

    // Promise.reject() é o equivalente de raise em Python:
    // propaga o erro para quem chamou a função (o catch() do authStore)
    return Promise.reject(apiError);
  },
);

export default apiClient;
