import { get, post, patch, del } from "./utils";
import { api } from "./index";

// ── Tipos espelhando o backend ───────────────────────────────────────────────

export interface Group {
  id: number;
  name: string;
}

export interface ApiUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  groups: Group[];
  created_at?: string;
  date_joined?: string;
}

export interface DRFPage<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ListUsersParams {
  page?: number;
  search?: string;
}

export interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  group?: string;
}

export interface UpdateUserPayload {
  first_name?: string;
  last_name?: string;
  new_password?: string;
  confirm_password?: string;
}

// ── Funções de API ───────────────────────────────────────────────────────────

export const listUsers = (params: ListUsersParams = {}) =>
  get<DRFPage<ApiUser>>(api.endpoints.users, { params });

export const getUser = (id: string) =>
  get<ApiUser>(`${api.endpoints.users}${id}/`);

export const getMe = () =>
  get<ApiUser>(api.endpoints.me);

export const createUser = (data: CreateUserPayload) =>
  post<ApiUser>(api.endpoints.users, data);

export const updateUser = (id: string, data: UpdateUserPayload) =>
  patch<ApiUser>(`${api.endpoints.users}${id}/`, data);

export interface UpdateMePayload {
  first_name?: string;
  last_name?: string;
}

export const updateMe = (data: UpdateMePayload) =>
  patch<ApiUser>(api.endpoints.me, data);

export const deleteUser = (id: string) =>
  del(`${api.endpoints.users}${id}/`);

export const setUserGroup = (id: string, group: string) =>
  post<ApiUser>(`${api.endpoints.users}${id}/set-group/`, { group });

export const listGroups = () =>
  get<Group[]>("/api/v1/user/groups/");

// ── Recuperação de senha ─────────────────────────────────────────────────────

export const requestPasswordReset = (email: string) =>
  post<{ success: string }>(api.endpoints.requestPasswordReset, { email });

export interface ConfirmPasswordResetPayload {
  id: string;
  key: string;
  new_password: string;
  confirm_password: string;
}

export const confirmPasswordReset = (data: ConfirmPasswordResetPayload) =>
  post<{ token: { access: string; refresh: string } }>(api.endpoints.passwordReset, data);
