"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, UserCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { useUsers } from "@/hooks/useUsers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewUserDialog } from "./_components/NewUserDialog";
import { ChangeProfileDialog } from "./_components/ChangeProfileDialog";
import { DeleteUserDialog } from "./_components/DeleteUserDialog";
import type { ApiUser } from "@/lib/api/users";

const GROUP_VARIANT: Record<string, "default" | "success" | "secondary" | "outline" | "purple"> = {
  Admin: "default",
  QA: "purple",
  Visualizador: "secondary",
};

function getInitials(user: ApiUser) {
  return [user.first_name?.[0], user.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || user.email[0].toUpperCase();
}

// ── Linha da tabela ──────────────────────────────────────────────────────────
function UserRow({
  user,
  onChangeProfile,
  onDelete,
}: {
  user: ApiUser;
  onChangeProfile: (u: ApiUser) => void;
  onDelete: (u: ApiUser) => void;
}) {
  const group = user.is_superuser ? "Admin" : (user.groups[0]?.name ?? null);

  return (
    <tr className="border-b border-border hover:bg-muted/40 transition-colors">
      {/* Usuário */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-bold">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-foreground">
            {[user.first_name, user.last_name].filter(Boolean).join(" ") || "—"}
          </span>
        </div>
      </td>

      {/* Email */}
      <td className="px-4 py-3 text-sm text-muted-foreground font-mono whitespace-nowrap">
        {user.email}
      </td>

      {/* Perfil */}
      <td className="px-4 py-3">
        {group
          ? <Badge variant={GROUP_VARIANT[group] ?? "outline"}>{group}</Badge>
          : <Badge variant="outline">Sem perfil</Badge>}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md"
          style={{
            background: user.is_active ? "var(--success-bg)"     : "var(--danger-bg)",
            color:      user.is_active ? "var(--success-fg)"     : "var(--danger-fg)",
            border:     `1px solid ${user.is_active ? "var(--success-border)" : "var(--danger-border)"}`,
          }}>
          <span className="h-[5px] w-[5px] rounded-full" style={{ background: "currentColor" }} />
          {user.is_active ? "Ativo" : "Inativo"}
        </span>
      </td>

      {/* Ações */}
      <td className="px-4 py-3 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical size={15} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onChangeProfile(user)}>
              <UserCheck className="mr-2 h-4 w-4" />Trocar perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" />Inativar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

// ── Skeleton de carregamento ─────────────────────────────────────────────────
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {[2, 3, 1, 1, 0.5].map((flex, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="h-3 rounded bg-muted animate-pulse"
                style={{ width: `${flex * 40}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function UsuariosClient() {
  const {
    users, total, page, setPage, totalPages,
    search, setSearch, isLoading, error,
    deleteUser, createUser, setUserGroup,
  } = useUsers();

  const [newOpen, setNewOpen] = useState(false);
  const [profileTarget, setProfileTarget] = useState<ApiUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ApiUser | null>(null);

  const handleCreate = async (data: Parameters<typeof createUser>[0]) => {
    const res = await createUser(data);
    if (res.success) toast.success("Usuário criado. E-mail de boas-vindas enviado.");
    else toast.error("Erro ao criar usuário.");
  };

  const handleSetGroup = async (id: string, group: string) => {
    const res = await setUserGroup(id, group);
    const user = users.find((u) => u.id === id);
    if (res.success) toast.success(`Perfil de ${user?.first_name ?? "usuário"} alterado para ${group}.`);
    else toast.error("Erro ao trocar perfil.");
  };

  const handleDelete = async (id: string) => {
    const user = users.find((u) => u.id === id);
    await deleteUser(id);
    toast.success(`${user?.first_name ?? "Usuário"} foi inativado.`);
  };

  const isEmpty = !isLoading && !error && users.length === 0 && !search;
  const noResults = !isLoading && !error && users.length === 0 && !!search;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-foreground">Usuários</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os membros e perfis de acesso.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} className="mr-1.5" />Novo Usuário
        </Button>
      </div>

      {/* Card com tabela */}
      <Card>
        {/* Busca */}
        <div className="px-4 py-3 border-b border-border">
          <div className="max-w-xs">
            <Input
              placeholder="Buscar por nome ou email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startContent={<Search size={15} className="text-muted-foreground" />}
              endContent={
                search ? (
                  <button
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ×
                  </button>
                ) : null
              }
            />
          </div>
        </div>

        {/* Corpo da tabela */}
        {error ? (
          <CardContent className="py-14 text-center text-sm text-destructive">{error}</CardContent>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-bold text-foreground">Nenhum usuário cadastrado.</p>
            <Button onClick={() => setNewOpen(true)}>
              <Plus size={15} className="mr-1.5" />Novo Usuário
            </Button>
          </div>
        ) : noResults ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-13 h-13 rounded-full bg-muted flex items-center justify-center">
              <Search className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              Nenhum usuário encontrado para "<strong>{search}</strong>".
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr>
                  {["Usuário", "Email", "Perfil", "Status", "Ações"].map((h, i) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/30"
                      style={{ textAlign: i === 4 ? "right" : "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : (
                  users.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      onChangeProfile={setProfileTarget}
                      onDelete={setDeleteTarget}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer com paginação */}
        {!isEmpty && !noResults && !isLoading && users.length > 0 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {total} usuário{total !== 1 ? "s" : ""}
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  ←
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  →
                </Button>
              </div>
            )}
            <span />
          </div>
        )}
      </Card>

      {/* Dialogs */}
      <NewUserDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={handleCreate}
      />
      <ChangeProfileDialog
        user={profileTarget}
        onClose={() => setProfileTarget(null)}
        onSave={handleSetGroup}
      />
      <DeleteUserDialog
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
