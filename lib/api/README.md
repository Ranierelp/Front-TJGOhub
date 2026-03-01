# API Centralizada - Kong Gateway

Sistema centralizado para comunicação com o gateway Kong, incluindo interceptadores automáticos para autenticação e tratamento de erros.

## 📋 Características

- ✅ **Interceptador automático de token** - Adiciona token J## 📁 Estrutura de Arquivos

```text
lib/api/
├── client.ts      # Cliente base + interceptadores
├── utils.ts       # Utilitários HTTP (get, post, etc.)
├── index.ts       # Exports centralizados
├── examples.ts    # Exemplos de uso (opcional)
└── README.md      # Esta documentação
```icamente
- ✅ **Tratamento de erros padronizado** - Respostas consistentes para todos os erros
- ✅ **Retry automático** - Retentar requisições em caso de falha temporária
- ✅ **Cache inteligente** - Cache configurável com TTL customizável
- ✅ **Upload/Download** - Utilitários para arquivos
- ✅ **Paginação** - Suporte nativo para APIs paginadas
- ✅ **Timeout configurável** - Controle fino sobre tempos limite
- ✅ **Logs de debug** - Rastreamento detalhado em desenvolvimento
- ✅ **Princípio DRY** - Evita duplicação de código
- ✅ **Integração com .env** - Configuração via variáveis de ambiente

## 🚀 Instalação

Os arquivos já estão criados em `lib/api/`. Certifique-se de que o arquivo `.env.local` contém:

```bash
# Kong Gateway
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=10000

# Serviços
NEXT_PUBLIC_AUTH_SERVICE_PATH=/api/v1/user/auth
NEXT_PUBLIC_USER_SERVICE_PATH=/api/v1/users

# Debug
NEXT_PUBLIC_DEBUG_MODE=true
```

## 📖 Uso Básico

### Importação

```typescript
import { get, post, put, del, apiClient } from '@/lib/api';
```

### Requisições Simples

```typescript
// GET
const response = await get<User[]>('/api/v1/users');

// POST
const newUser = await post<User>('/api/v1/users', userData);

// PUT
const updatedUser = await put<User>('/api/v1/users/123', userData);

// DELETE
await del('/api/v1/users/123');
```

### Com Tratamento de Erro

```typescript
try {
  const response = await get<User[]>('/api/v1/users');
  console.log(response.data);
} catch (error) {
  console.error('Erro:', error.message);
  // error.status, error.code, error.details também disponíveis
}
```

## 🔐 Autenticação Automática

O interceptador adiciona automaticamente o token JWT em todas as requisições:

```typescript
// O token é adicionado automaticamente do AuthStore
const users = await get('/api/v1/users');
// Headers: Authorization: Bearer <token>
```

### Renovação Automática

Em caso de token expirado (401), o sistema:

1. Verifica se o token realmente expirou
2. Se sim, faz logout automático e redireciona para login
3. Se não, retenta a requisição original

## 🚨 Tratamento de Erros

### Erros Padronizados

```typescript
interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}
```

### Códigos de Status

- **400**: "Dados inválidos na requisição"
- **401**: Logout automático + redirecionamento
- **403**: "Acesso negado - permissões insuficientes"
- **404**: "Recurso não encontrado"
- **409**: "Conflito - recurso já existe"
- **429**: "Muitas requisições - tente novamente"
- **500+**: "Erro interno do servidor"

## 🔄 Retry Automático

```typescript
// Retry automático para requisições GET
const data = await get('/api/v1/data', { 
  autoRetry: true, 
  maxRetries: 3 
});

// Retry com backoff exponencial (1s, 2s, 4s...)
```

## 💾 Cache

```typescript
import { getCached, clearCache } from '@/lib/api';

// Cache por 5 minutos
const users = await getCached<User[]>('/api/v1/users', 300000);

// Limpar cache específico
clearCache('/api/v1/users');

// Limpar todo cache
clearCache();
```

## 📄 Paginação

```typescript
import { getPaginated } from '@/lib/api';

const result = await getPaginated<User>('/api/v1/users', {
  page: 1,
  limit: 20,
  sort: 'name',
  order: 'asc',
  search: 'john',
  filters: { role: 'admin', active: true }
});

console.log(result.data.pagination.totalPages);
```

## 📁 Upload/Download

```typescript
import { upload, download } from '@/lib/api';

// Upload
const file = new File(['content'], 'test.txt');
await upload('/api/v1/files', file);

// Download
await download('/api/v1/files/123', 'document.pdf');
```

## ⚙️ Configurações Avançadas

### Timeout Personalizado

```typescript
import { withTimeout } from '@/lib/api';

const data = await withTimeout('GET', '/api/slow-endpoint', null, 30000);
```

### Headers Customizados

```typescript
const response = await post('/api/v1/data', payload, {
  customHeaders: {
    'X-Custom-Header': 'value',
    'X-Request-ID': uuid()
  }
});
```

### Cliente Axios Direto

```typescript
import { apiClient } from '@/lib/api';

// Para casos especiais que não são cobertos pelos utilitários
const response = await apiClient.request({
  method: 'PATCH',
  url: '/api/v1/custom',
  data: payload,
  transformRequest: [/* transform */]
});
```

## 🏗️ Helpers para Serviços

```typescript
import { buildServiceUrl } from '@/lib/api';

// Constrói URLs baseadas nas variáveis de ambiente
const authUrl = buildServiceUrl('auth', '/login');
// Result: /api/v1/user/auth/login

const userUrl = buildServiceUrl('users', '/123');
// Result: /api/v1/users/123
```

## 🔧 Debug

Em desenvolvimento (`NEXT_PUBLIC_DEBUG_MODE=true`):

- ✅ Logs de requisições e respostas
- ✅ Informações de retry
- ✅ Headers de debug automáticos
- ✅ Cache hits/misses

## 🔗 Integração com Zustand

```typescript
// No seu store
import { get, post } from '@/lib/api';

const useStore = create((set) => ({
  users: [],
  loading: false,
  
  fetchUsers: async () => {
    set({ loading: true });
    try {
      const response = await get<User[]>('/api/v1/users');
      set({ users: response.data, loading: false });
    } catch (error) {
      set({ loading: false });
      // Handle error
    }
  }
}));
```

## 🛡️ Segurança

- ✅ Tokens automaticamente anexados
- ✅ Logout automático em caso de expiração
- ✅ Headers de segurança em desenvolvimento
- ✅ Sanitização de logs sensíveis
- ✅ Timeout para evitar requisições infinitas

## 📝 Estrutura de Arquivos

```bash
lib/api/
├── client.ts      # Cliente base + interceptadores
├── utils.ts       # Utilitários HTTP (get, post, etc.)
├── index.ts       # Exports centralizados
├── examples.ts    # Exemplos de uso (opcional)
└── README.md      # Esta documentação
```

## 🤝 Migração do Código Existente

### Antes (código duplicado)

```typescript
// Em vários arquivos diferentes
const token = localStorage.getItem('token');
const response = await axios.get('/api/users', {
  headers: { Authorization: `Bearer ${token}` }
});
```

### Depois (centralizado)

```typescript
// Em qualquer lugar
import { get } from '@/lib/api';
const response = await get<User[]>('/api/users');
```
