"use client";

import { useState, useEffect, useCallback } from "react";
import { listUsers, deleteUser, createUser, setUserGroup, updateUser } from "@/lib/api/users";
import type { ApiUser, CreateUserPayload } from "@/lib/api/users";

const PAGE_SIZE = 10;

export function useUsers() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listUsers({ page, search: search || undefined });
      if (res.success && res.data) {
        setUsers(res.data.results);
        setTotal(res.data.count);
      }
    } catch {
      setError("Erro ao carregar usuários.");
    } finally {
      setIsLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Reseta para página 1 quando busca muda
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDeleteUser = async (id: string) => {
    await deleteUser(id);
    fetchUsers();
  };

  const handleCreateUser = async (data: CreateUserPayload) => {
    const res = await createUser(data);
    if (res.success) fetchUsers();
    return res;
  };

  const handleSetGroup = async (id: string, group: string) => {
    const res = await setUserGroup(id, group);
    if (res.success) fetchUsers();
    return res;
  };

  const handleUpdateUser = async (id: string, data: { first_name?: string; last_name?: string }) => {
    const res = await updateUser(id, data);
    if (res.success) fetchUsers();
    return res;
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    users,
    total,
    page,
    setPage,
    totalPages,
    search,
    setSearch: handleSearch,
    isLoading,
    error,
    refetch: fetchUsers,
    deleteUser: handleDeleteUser,
    createUser: handleCreateUser,
    setUserGroup: handleSetGroup,
    updateUser: handleUpdateUser,
  };
}
