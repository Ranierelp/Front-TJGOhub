/**
 * Hook de autorização usando Zustand store
 * Compatibilidade com código legado
 */

import { useAuth } from "@/hooks/useAuth";

export function useAuthorization() {
  const { isAuthenticated, user, hasRole, hasAnyRole } = useAuth();

  return {
    isAuthenticated,
    user,
    hasRole,
    hasAnyRole,
    isAdmin: hasRole("admin"),
    isStaff: hasAnyRole(["staff", "coordinator"]),
  };
}
