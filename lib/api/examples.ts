/**
 * Exemplos de uso da API centralizada com interceptadores
 * Demonstra como usar os utilitários criados
 */

import {
  get,
  post,
  put,
  del,
  getPaginated,
  getCached,
  buildServiceUrl,
} from "./index";

// ====== EXEMPLOS DE SERVIÇOS ======

// Serviço de Autenticação
export const authService = {
  /**
   * Login do usuário
   */
  login: async (credentials: { username: string; password: string }) => {
    return post<{ token: string; user: any }>(
      buildServiceUrl("auth", "/login"),
      credentials,
    );
  },

  /**
   * Logout do usuário
   */
  logout: async () => {
    return post(buildServiceUrl("auth", "/logout"));
  },

  /**
   * Renovar token
   */
  refreshToken: async () => {
    return post<{ token: string }>(buildServiceUrl("auth", "/refresh"));
  },

  /**
   * Obter perfil do usuário autenticado
   */
  getProfile: async () => {
    return getCached<any>(buildServiceUrl("auth", "/profile"), 300000); // Cache por 5 min
  },

  /**
   * Atualizar perfil
   */
  updateProfile: async (profileData: any) => {
    return put(buildServiceUrl("auth", "/profile"), profileData);
  },
};

// Serviço de Usuários
export const userService = {
  /**
   * Listar usuários com paginação e filtros
   */
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    return getPaginated<any>(buildServiceUrl("users", ""), params);
  },

  /**
   * Obter usuário por ID
   */
  getById: async (id: string) => {
    return get<any>(buildServiceUrl("users", `/${id}`));
  },

  /**
   * Criar novo usuário
   */
  create: async (userData: any) => {
    return post<any>(buildServiceUrl("users", ""), userData);
  },

  /**
   * Atualizar usuário
   */
  update: async (id: string, userData: any) => {
    return put<any>(buildServiceUrl("users", `/${id}`), userData);
  },

  /**
   * Excluir usuário
   */
  delete: async (id: string) => {
    return del(buildServiceUrl("users", `/${id}`));
  },

  /**
   * Obter usuários por role (com cache)
   */
  getByRole: async (role: string) => {
    return getCached<any[]>(
      buildServiceUrl("users", `/role/${role}`),
      600000, // Cache por 10 min
    );
  },
};

// ====== EXEMPLO DE USO EM COMPONENTES ======

/**
 * Hook personalizado para autenticação
 * Exemplo de como usar os serviços em componentes React
 */
export const useAuthService = () => {
  const login = async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });

      if (response.success) {
        // Token será automaticamente adicionado pelo interceptador
        console.log("Login realizado com sucesso");

        return { success: true, data: response.data };
      }

      return { success: false, error: "Credenciais inválidas" };
    } catch (error: any) {
      console.error("Erro no login:", error);

      return { success: false, error: error.message };
    }
  };

  const getProfile = async () => {
    try {
      const response = await authService.getProfile();

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Erro ao obter perfil:", error);

      return { success: false, error: error.message };
    }
  };

  return { login, getProfile };
};

/**
 * Hook para gerenciamento de usuários
 */
export const useUserService = () => {
  const listUsers = async (filters?: any) => {
    try {
      const response = await userService.list(filters);

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Erro ao listar usuários:", error);

      return { success: false, error: error.message };
    }
  };

  const createUser = async (userData: any) => {
    try {
      const response = await userService.create(userData);

      return { success: true, data: response.data };
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);

      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await userService.delete(id);

      return { success: true };
    } catch (error: any) {
      console.error("Erro ao excluir usuário:", error);

      return { success: false, error: error.message };
    }
  };

  return { listUsers, createUser, deleteUser };
};

// ====== UTILITÁRIOS PARA TRATAMENTO DE ERROS ======

/**
 * Hook para tratamento padronizado de erros da API
 */
export const useApiErrorHandler = () => {
  const handleError = (error: any) => {
    // Log do erro para debugging
    console.error("API Error:", error);

    // Retornar mensagem amigável baseada no tipo de erro
    if (error.status === 401) {
      return "Sessão expirada. Faça login novamente.";
    }

    if (error.status === 403) {
      return "Você não tem permissão para realizar esta ação.";
    }

    if (error.status === 404) {
      return "Recurso não encontrado.";
    }

    if (error.status === 409) {
      return "Este recurso já existe.";
    }

    if (error.status >= 500) {
      return "Erro interno do servidor. Tente novamente mais tarde.";
    }

    return error.message || "Erro desconhecido. Tente novamente.";
  };

  return { handleError };
};

// ====== EXEMPLO DE INTEGRAÇÃO COM ZUSTAND ======

/**
 * Exemplo de como integrar com store Zustand existente
 */
export const createApiStore = () => ({
  // Estado
  loading: false,
  error: null as string | null,
  data: null as any,

  // Ações que usam a API centralizada
  setLoading: (loading: boolean) => ({ loading }),
  setError: (error: string | null) => ({ error }),
  setData: (data: any) => ({ data }),

  // Ação assíncrona de exemplo
  fetchData: async (endpoint: string) => {
    try {
      // Limpar estado anterior
      // set({ loading: true, error: null });

      const response = await get(endpoint);

      // Atualizar estado com sucesso
      // set({ data: response.data, loading: false });

      return response;
    } catch (error: any) {
      // Atualizar estado com erro
      // set({ error: error.message, loading: false });
      throw error;
    }
  },
});
