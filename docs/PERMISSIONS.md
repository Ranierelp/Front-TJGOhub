# Sistema de Permissões e Autorização - MedHub

## Visão Geral

Este documento explica como implementar permissões para chamadas de API específicas usando Zustand e o sistema de autenticação do MedHub.

## Arquitetura Atual

### 1. Auth Store (Zustand)

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  // Métodos de verificação de papéis
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
}
```

### 2. Hooks de Autenticação

```typescript
// hooks/useAuth.ts
export function useAuth() {
  // Acesso ao store com métodos de verificação
}

// hooks/useAuthorization.ts  
export function useAuthorization() {
  // Verificações específicas (isAdmin, isStaff)
}
```

### 3. Estrutura de Permissões

```typescript
// stores/authStore.ts - Selector de permissões
export const usePermissions = () => {
  return {
    canOrderExams: hasRole("coordinator"),
    canViewExams: hasAnyRole(["coordinator", "admin", "staff"]),
    canResultExams: hasAnyRole(["coordinator", "admin"]),
  };
};
```

## Como Implementar Permissões para APIs

### Padrão 1: Verificação de Permissão por Hook

```typescript
// hooks/useExamPermissions.ts
import { useAuthStore } from '@/stores/authStore';

export const useExamPermissions = () => {
  const hasRole = useAuthStore(state => state.hasRole);
  const hasAnyRole = useAuthStore(state => state.hasAnyRole);
  
  return {
    canCreateExam: hasRole("coordinator"),
    canViewExam: hasAnyRole(["coordinator", "admin", "staff"]),
    canEditExam: hasAnyRole(["coordinator", "admin"]),
    canDeleteExam: hasRole("admin"),
    canApproveExam: hasAnyRole(["coordinator", "admin"]),
  };
};
```

### Padrão 2: Verificação Inline nos Componentes

```typescript
// components/ExamForm.tsx
import { useExamPermissions } from '@/hooks/useExamPermissions';

export function ExamForm() {
  const { canCreateExam, canEditExam } = useExamPermissions();
  
  if (!canCreateExam) {
    return <AccessDenied message="Sem permissão para criar exames" />;
  }
  
  return (
    <form>
      {canEditExam && <EditButton />}
      {/* resto do formulário */}
    </form>
  );
}
```

### Padrão 3: Wrapper de Autorização

```typescript
// components/auth/AuthorizedComponent.tsx
interface AuthorizedComponentProps {
  requiredRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthorizedComponent({ 
  requiredRoles, 
  children, 
  fallback 
}: AuthorizedComponentProps) {
  const { hasAnyRole } = useAuth();
  
  if (!hasAnyRole(requiredRoles)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
}

// Uso:
<AuthorizedComponent requiredRoles={["admin", "coordinator"]}>
  <SensitiveComponent />
</AuthorizedComponent>
```

### Padrão 4: Higher-Order Component para APIs

```typescript
// lib/api/withAuth.ts
import { authStore } from '@/stores/authStore';

export function withRoleCheck<T extends (...args: any[]) => any>(
  fn: T,
  requiredRoles: string[]
): T {
  return ((...args: Parameters<T>) => {
    const { hasAnyRole } = authStore.getState();
    
    if (!hasAnyRole(requiredRoles)) {
      throw new Error(`Permissão negada. Papéis necessários: ${requiredRoles.join(', ')}`);
    }
    
    return fn(...args);
  }) as T;
}

// Uso:
export const examApi = {
  create: withRoleCheck(
    async (data: ExamData) => httpClient.post('/exams', data),
    ['coordinator', 'admin']
  ),
  
  delete: withRoleCheck(
    async (id: string) => httpClient.delete(`/exams/${id}`),
    ['admin']
  ),
};
```

## Implementação de Novas Permissões

### 1. Definir Permissões no Store

```typescript
// stores/authStore.ts - Adicionar ao usePermissions
export const usePermissions = () => {
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasAnyRole = useAuthStore((state) => state.hasAnyRole);

  return {
    // Permissões existentes
    canOrderExams: hasRole("coordinator"),
    canViewExams: hasAnyRole(["coordinator", "admin", "staff"]),
    
    // NOVAS PERMISSÕES
    canManageUsers: hasRole("admin"),
    canViewReports: hasAnyRole(["coordinator", "admin"]),
    canExportData: hasRole("admin"),
    canConfigureSystem: hasRole("admin"),
  };
};
```

### 2. Criar Hook Específico

```typescript
// hooks/useReportPermissions.ts
export const useReportPermissions = () => {
  const { canViewReports, canExportData } = usePermissions();
  
  return {
    canViewReports,
    canExportData,
    canViewFinancialReports: canViewReports,
    canScheduleReports: canExportData,
  };
};
```

### 3. Implementar na API

```typescript
// lib/api/reportApi.ts
import { withRoleCheck } from './withAuth';

export const reportApi = {
  getReports: withRoleCheck(
    async () => httpClient.get('/reports'),
    ['coordinator', 'admin']
  ),
  
  exportReport: withRoleCheck(
    async (reportId: string) => httpClient.get(`/reports/${reportId}/export`),
    ['admin']
  ),
};
```

### 4. Usar no Componente

```typescript
// components/ReportsDashboard.tsx
export function ReportsDashboard() {
  const { canViewReports, canExportData } = useReportPermissions();
  
  if (!canViewReports) {
    return <AccessDenied message="Sem permissão para visualizar relatórios" />;
  }
  
  return (
    <div>
      <ReportsList />
      {canExportData && <ExportButton />}
    </div>
  );
}
```

## Estrutura de Papéis do Sistema

### Papéis Disponíveis

- **admin**: Acesso total ao sistema
- **coordinator**: Coordenador médico com permissões de gestão
- **staff**: Funcionário com permissões básicas
- **user**: Usuário básico (apenas visualização própria)

### Matriz de Permissões

| Funcionalidade | admin | coordinator | staff | user |
|----------------|-------|-------------|-------|------|
| Gerenciar usuários | ✅ | ❌ | ❌ | ❌ |

## Boas Práticas

### 1. Verificação Dupla

- Sempre verificar permissões no frontend E backend
- Frontend para UX, backend para segurança

### 2. Granularidade

- Criar permissões específicas para cada ação
- Evitar permissões muito amplas

### 3. Fallbacks

- Sempre fornecer componentes de fallback para acesso negado
- Mensagens de erro claras para o usuário

### 4. Performance

- Usar selectors específicos para evitar re-renders desnecessários
- Cachear verificações de permissão quando possível

### 5. Testabilidade

- Mockar o authStore em testes
- Testar todos os cenários de permissão

## Exemplo Completo: Sistema de Pacientes

```typescript
// hooks/usePatientPermissions.ts
export const usePatientPermissions = () => {
  const { hasRole, hasAnyRole } = useAuth();
  
  return {
    canCreatePatient: hasAnyRole(["admin", "coordinator", "staff"]),
    canViewPatient: hasAnyRole(["admin", "coordinator", "staff"]),
    canEditPatient: hasAnyRole(["admin", "coordinator"]),
    canDeletePatient: hasRole("admin"),
    canViewSensitiveData: hasAnyRole(["admin", "coordinator"]),
  };
};

// components/PatientForm.tsx
export function PatientForm({ patientId }: { patientId?: string }) {
  const { 
    canCreatePatient, 
    canEditPatient, 
    canViewSensitiveData 
  } = usePatientPermissions();
  
  const isEditing = !!patientId;
  const canAccess = isEditing ? canEditPatient : canCreatePatient;
  
  if (!canAccess) {
    return <AccessDenied />;
  }
  
  return (
    <form>
      <input name="name" />
      <input name="email" />
      
      {canViewSensitiveData && (
        <div>
          <input name="cpf" />
          <input name="medicalRecord" />
        </div>
      )}
    </form>
  );
}

// lib/api/patientApi.ts
export const patientApi = {
  create: withRoleCheck(
    async (data: PatientData) => httpClient.post('/patients', data),
    ['admin', 'coordinator', 'staff']
  ),
  
  update: withRoleCheck(
    async (id: string, data: PatientData) => 
      httpClient.put(`/patients/${id}`, data),
    ['admin', 'coordinator']
  ),
  
  delete: withRoleCheck(
    async (id: string) => httpClient.delete(`/patients/${id}`),
    ['admin']
  ),
};
```

Este sistema permite controle fino de permissões mantendo o código organizado e reutilizável.
