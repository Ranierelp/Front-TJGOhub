/**
 * Hook para autenticação integrado com Zustand store
 * Compatibilidade com código legado
 */

import { useAuth as useAuthState, useAuthActions, type User, type LoginCredentials, type RegisterData } from "@/stores/authStore";

export interface UseAuthReturn {
  // Estado da autenticação
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Ações
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;

  // Utilitários
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;

  // Compatibilidade legada
  isAdmin: boolean;
  isStaff: boolean;
}

export function useAuth(): UseAuthReturn {
  const state = useAuthState();
  const actions = useAuthActions();

  // Compatibilidade com código legado
  const hasRole = (role: string) => {
    return state.user?.roles?.includes(role) || false;
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: string[]) => {
    return roles.every((role) => hasRole(role));
  };

  const isAdmin = hasRole("admin");
  const isStaff = hasAnyRole(["staff", "coordinator"]);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login: actions.login,
    register: actions.register,
    logout: actions.logout,
    checkAuth: actions.checkAuth,
    clearError: actions.clearError,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
    isStaff,
  };
}

// Hooks específicos para facilitar o uso
export const useUser = () => useAuthState().user;
export const useIsAuthenticated = () => useAuthState().isAuthenticated;
export const useIsLoading = () => useAuthState().isLoading;
export const useAuthError = () => useAuthState().error;

// Hook para verificar autorização específica
export const useAuthorization = (requiredRoles: string[] = []) => {
  const { isAuthenticated, user, hasAnyRole } = useAuth();

  const isAuthorized =
    isAuthenticated &&
    (requiredRoles.length === 0 || hasAnyRole(requiredRoles));

  return {
    isAuthorized,
    user,
    isAuthenticated,
  };
};

export default useAuth;
