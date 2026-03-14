// =============================================================================
// CONCEITO 1: O que é uma "Store" (Zustand)
//
// No React, cada componente tem seu próprio estado local (useState).
// O problema: como compartilhar estado entre componentes sem ficar passando
// props manualmente por 5 camadas de componentes?
//
// A solução é uma "store" — um estado GLOBAL, fora de qualquer componente,
// acessível de qualquer lugar da aplicação.
//
// Zustand é a biblioteca de state management usada aqui.
// Paralelo Django: pense na store como o request.session ou request.user —
// dados que existem durante toda a sessão e qualquer view (componente) acessa.
//
// A store tem:
//   • Estado  → os dados (user, isAuthenticated, tokens...)
//   • Ações   → funções que modificam o estado (login, logout, checkAuth...)
// =============================================================================

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { post, get as apiGet, api } from "@/lib/api";

// =============================================================================
// CONCEITO 2: Interfaces TypeScript
//
// Interfaces são contratos que descrevem o formato de um objeto.
// Paralelo Python: são como TypedDict ou dataclass — definem quais campos
// existem e seus tipos, mas não têm lógica.
//
// O TypeScript usa essas interfaces para checagem estática: se você tentar
// acessar um campo que não existe, o editor já avisa antes de rodar.
//
// O "?" depois do nome do campo (ex: avatar?) significa que é opcional —
// como Optional[str] no Python.
//
// O "export" torna a interface importável em outros arquivos — como um
// modelo do Django que você importa em outro app.
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

// Campos espelhados do UserRegisterSerializer do backend Django.
// camelCase aqui (firstName) → o authStore converte para snake_case (first_name) na chamada API.
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password1: string;
  password2: string;
  terms: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];  // lista de papéis: "ADMIN", "STAFF", "USER"
  avatar?: string;  // opcional — o "?" indica que pode ser undefined
  isActive: boolean;
}

// Estrutura dos tokens JWT guardados em memória (na store)
interface AuthTokens {
  access_token: string;
  refresh_token?: string; // opcional — pode não existir em alguns cenários
  expires_in: number;     // segundos até expirar
}

// =============================================================================
// CONCEITO 3: Interface da Store (contrato completo)
//
// AuthState descreve TUDO que existe na store: os dados E as ações.
// É como um Model do Django que define tanto os campos quanto os métodos.
//
// Notar que as ações são funções tipadas:
//   login: (credentials) => Promise<{success, message}>
//
// Promise<T> é o equivalente de async def em Python — indica que a função
// é assíncrona e vai retornar T quando terminar.
// =============================================================================
interface AuthState {
  // --- Dados (estado) ---
  user: User | null;           // null quando não logado
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: AuthTokens | null;

  // --- Ações principais ---
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;

  // --- Ações auxiliares (setters simples) ---
  clearError: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // --- Helpers de autorização ---
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  hasAllRoles: (roles: string[]) => boolean;
  getAccessToken: () => string | null;
  isTokenExpired: () => boolean;
}

// =============================================================================
// Interfaces que espelham o formato exato da resposta do Django REST Framework
// Paralelo: são como os Serializers do DRF — definem o contrato do JSON.
// =============================================================================

// Resposta do POST /api/v1/user/token/
interface TokenResponse {
  access: string;
  refresh: string;
  user?: {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
  };
}

// Resposta do GET /api/v1/user/user/me/
interface ApiUserResponse {
  id: string;
  pkid?: number;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  profile?: {
    name: string;
    avatar?: string;
  };
  groups?: { id: number; name: string }[];
}

// =============================================================================
// CONCEITO 4: Função de mapeamento (snake_case → camelCase)
//
// O Django retorna JSON com snake_case (first_name, is_active).
// O TypeScript/JS usa camelCase por convenção (firstName, isActive).
//
// Esta função faz a tradução entre os dois mundos.
// É o equivalente de um Serializer do DRF que transforma campos do Model
// para o formato que o cliente espera.
//
// Paralelo Python:
//   def map_user(api_data: dict) -> User:
//       return User(first_name=api_data['first_name'], ...)
// =============================================================================
function mapApiUserToUser(apiUser: ApiUserResponse): User {
  // Constrói a lista de papéis baseado nos campos do Django
  const roles: string[] = [];
  if (apiUser.is_superuser) roles.push("ADMIN");
  if (apiUser.is_staff) roles.push("STAFF");
  if (apiUser.groups) {
    apiUser.groups.forEach(g => roles.push(g.name.toUpperCase()));
  }
  if (roles.length === 0) roles.push("USER"); // fallback: todo usuário tem ao menos USER

  return {
    id: apiUser.id || String(apiUser.pkid),
    username: apiUser.username || apiUser.email,
    email: apiUser.email,
    // Optional chaining (?.) — não quebra se profile for undefined
    // É como getattr(obj, 'attr', None) no Python
    firstName: apiUser.first_name || apiUser.profile?.name?.split(" ")[0] || "",
    lastName: apiUser.last_name || apiUser.profile?.name?.split(" ").slice(1).join(" ") || "",
    roles,
    avatar: apiUser.profile?.avatar,
    isActive: apiUser.is_active,
  };
}

// =============================================================================
// CONCEITO 5: create() do Zustand — criando a store
//
// create<AuthState>() é a função principal do Zustand.
// Ela recebe uma função que recebe (set, get) e retorna o estado inicial
// com todas as ações.
//
//   set(parcial) → atualiza campos específicos da store (merge, não substitui)
//   get()        → lê o estado atual de dentro de uma ação
//
// Paralelo: set() é como self.save() num Model, e get() é como acessar
// self.atributo — mas de dentro de um método.
//
// A store é criada UMA VEZ e exportada. Qualquer componente que chamar
// useAuthStore() vai acessar a MESMA instância — é um singleton.
// =============================================================================

// =============================================================================
// CONCEITO 6: Middlewares do Zustand
//
// Middlewares envolvem a store e adicionam funcionalidades extras.
// São empilhados de dentro para fora: a store real fica no centro.
//
//   devtools(persist(store))
//     ↑                ↑
//     │                └── Salva estado no localStorage automaticamente
//     └── Integra com Redux DevTools no browser
//
// Paralelo Django: são como middlewares do Django (MIDDLEWARE no settings.py)
// que interceptam o ciclo de vida da requisição para adicionar funcionalidade.
// =============================================================================
export const useAuthStore = create<AuthState>()(
  devtools(       // Middleware 1: habilita inspeção no Redux DevTools Extension
    persist(      // Middleware 2: persiste parte do estado no localStorage
      (set, get) => ({

        // ─── Estado inicial ───────────────────────────────────────────────────
        // Estes são os valores quando a store é criada pela primeira vez.
        // Paralelo: __init__ de uma classe Python.
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tokens: null,

        // ─── AÇÃO: login ──────────────────────────────────────────────────────
        // Fluxo completo:
        //   1. Ativa loading
        //   2. POST /api/v1/user/token/ com email + senha
        //   3. Guarda access_token e refresh_token no localStorage
        //   4. Busca dados do usuário em /api/v1/user/user/me/
        //   5. Atualiza a store com user + isAuthenticated = true
        //   6. Retorna { success: true } para o componente de login tratar
        // ─────────────────────────────────────────────────────────────────────
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null });

          try {
            // post<TokenResponse> → o <T> é um generic do TypeScript:
            // diz ao compilador que a resposta terá o formato de TokenResponse.
            // É como Type Hints do Python: post[TokenResponse]("/endpoint")
            const response = await post<TokenResponse>(api.endpoints.token, {
              email: credentials.email,
              password: credentials.password,
            });

            if (!response.success || !response.data) {
              throw new Error("Credenciais inválidas");
            }

            const { access, refresh } = response.data;

            // =================================================================
            // CONCEITO 7: typeof window !== "undefined" (SSR Safety)
            //
            // No Next.js, o código pode rodar no servidor (Node.js) OU no
            // browser. No servidor, "window" não existe — é exclusivo do browser.
            //
            // Esta verificação garante que localStorage (que é do browser)
            // só seja acessado quando rodando no cliente.
            //
            // Paralelo: é como verificar if request is not None antes de
            // acessar request.session no Django.
            // =================================================================
            if (typeof window !== "undefined") {
              localStorage.setItem("access_token", access);
              localStorage.setItem("refresh_token", refresh);
            }

            // Busca os dados completos do usuário autenticado
            const userResponse = await apiGet<ApiUserResponse>(api.endpoints.me);

            let user: User;
            if (userResponse.success && userResponse.data) {
              user = mapApiUserToUser(userResponse.data);
            } else {
              // Fallback: usa o mínimo que veio junto com o token
              user = {
                id: String(response.data.user?.id || "unknown"),
                username: credentials.email,
                email: response.data.user?.email || credentials.email,
                firstName: response.data.user?.name?.split(" ")[0] || "",
                lastName: response.data.user?.name?.split(" ").slice(1).join(" ") || "",
                roles: ["USER"],
                isActive: response.data.user?.is_active ?? true,
              };
            }

            // =================================================================
            // CONCEITO 8: Decodificando JWT manualmente
            //
            // Um JWT tem 3 partes separadas por ponto: header.payload.signature
            // O payload é um JSON em Base64. Para decodificar:
            //   1. split(".")[1]  → pega só a parte do meio
            //   2. atob(...)      → decodifica de Base64 para string
            //   3. JSON.parse(...)→ transforma em objeto
            //
            // O campo "exp" é um Unix timestamp (segundos desde 1970).
            // Date.now() retorna milissegundos, por isso dividimos por 1000.
            //
            // Paralelo: é como ler o payload de um token no Python com:
            //   import jwt; jwt.decode(token, options={"verify_signature": False})
            // =================================================================
            let expiresIn = 86400; // default: 24h em segundos
            try {
              const payload = JSON.parse(atob(access.split(".")[1]));
              const now = Math.floor(Date.now() / 1000);
              expiresIn = payload.exp - now;
            } catch {
              // Se o parse falhar, usa o default. Não é crítico.
            }

            // Atualiza a store com todos os dados de autenticação
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              tokens: { access_token: access, refresh_token: refresh, expires_in: expiresIn },
            });

            return { success: true, message: "Login realizado com sucesso" };

          } catch (error: any) {
            // error.details?.detail → tenta pegar a mensagem do DRF
            // (que retorna { "detail": "No active account found..." })
            const errorMessage = error.details?.detail || error.message || "Erro ao fazer login";
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage };
          }
        },

        // ─── AÇÃO: register ───────────────────────────────────────────────────
        // Chama POST /api/v1/user/register/
        // Não faz login automático — o usuário precisa verificar o email.
        // ─────────────────────────────────────────────────────────────────────
        register: async (data: RegisterData) => {
          set({ isLoading: true, error: null });

          try {
            const response = await post(api.endpoints.register, {
              // Converte camelCase → snake_case para o Django
              first_name: data.firstName,
              last_name: data.lastName,
              email: data.email,
              password1: data.password1,
              password2: data.password2,
              terms: data.terms,
            });

            if (!response.success) {
              throw new Error(response.message || "Erro ao registrar");
            }

            set({ isLoading: false });
            return {
              success: true,
              message: "Registro realizado com sucesso! Verifique seu email.",
            };
          } catch (error: any) {
            const errorMessage = error.details?.detail || error.message || "Erro ao registrar";
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage };
          }
        },

        // ─── AÇÃO: logout ─────────────────────────────────────────────────────
        // Estratégia de logout em duas etapas:
        //   1. Tenta invalidar o token no servidor (blacklist do SimpleJWT)
        //   2. Limpa o estado local independente de o servidor responder
        //
        // Isso é importante: mesmo que o servidor falhe, o usuário é deslogado
        // localmente. Segurança > conveniência.
        // ─────────────────────────────────────────────────────────────────────
        logout: async () => {
          const refreshToken = typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

          if (refreshToken) {
            try {
              // Blacklist no servidor — se falhar, ignora
              await post(api.endpoints.logout, { refresh: refreshToken });
            } catch {
              // Logout local já é suficiente
            }
          }

          if (typeof window !== "undefined") {
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
          }

          // Reseta toda a store para o estado inicial
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            tokens: null,
          });
        },

        // ─── AÇÃO: checkAuth ──────────────────────────────────────────────────
        // Esta é a ação mais complexa. Roda quando o app carrega para
        // verificar se o usuário já está autenticado (tem token válido).
        //
        // Fluxo com 3 cenários:
        //   A) Sem token     → deslogado
        //   B) Token expirado → tenta refresh; se falhar, deslogado
        //   C) Token válido  → busca dados do usuário, confirma autenticado
        //
        // É chamado pelo useAuthGuard em cada rota protegida.
        // Paralelo Django: é como o middleware de autenticação que verifica
        // o cookie de sessão ou o header Authorization em cada request.
        // ─────────────────────────────────────────────────────────────────────
        checkAuth: async () => {
          set({ isLoading: true, error: null });

          const accessToken = typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;

          const refreshToken = typeof window !== "undefined"
            ? localStorage.getItem("refresh_token")
            : null;

          // Cenário A: sem token → não autenticado
          if (!accessToken) {
            set({ user: null, isAuthenticated: false, isLoading: false, error: null, tokens: null });
            return;
          }

          try {
            // Decodifica o payload do JWT para checar a expiração
            const payload = JSON.parse(atob(accessToken.split(".")[1]));
            const now = Math.floor(Date.now() / 1000);

            // Cenário B: token expirado
            if (payload.exp && payload.exp < now) {
              if (refreshToken) {
                try {
                  // Tenta renovar via POST /api/v1/user/token/refresh/
                  const refreshResponse = await post<{ access: string }>(api.endpoints.tokenRefresh, {
                    refresh: refreshToken,
                  });

                  if (refreshResponse.success && refreshResponse.data?.access) {
                    const newAccessToken = refreshResponse.data.access;
                    localStorage.setItem("access_token", newAccessToken);

                    const userResponse = await apiGet<ApiUserResponse>(api.endpoints.me);
                    if (userResponse.success && userResponse.data) {
                      const user = mapApiUserToUser(userResponse.data);
                      const newPayload = JSON.parse(atob(newAccessToken.split(".")[1]));
                      const newNow = Math.floor(Date.now() / 1000);

                      set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                        tokens: {
                          access_token: newAccessToken,
                          refresh_token: refreshToken,
                          expires_in: newPayload.exp - newNow,
                        },
                      });
                      return; // Saiu com sucesso após refresh
                    }
                  }
                } catch {
                  // Refresh falhou — cai no bloco abaixo
                }
              }

              // Refresh falhou ou não havia refresh token → deslogado
              if (typeof window !== "undefined") {
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
              }
              set({ user: null, isAuthenticated: false, isLoading: false, error: null, tokens: null });
              return;
            }

            // Cenário C: token válido
            // get() lê o estado atual da store — como self.user numa classe
            let user = get().user;

            if (!user) {
              // Usuário não estava em cache — busca da API
              try {
                const userResponse = await apiGet<ApiUserResponse>(api.endpoints.me);
                if (userResponse.success && userResponse.data) {
                  user = mapApiUserToUser(userResponse.data);
                }
              } catch {
                // Continua autenticado mesmo sem dados do usuário
              }
            }

            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              tokens: {
                access_token: accessToken,
                refresh_token: refreshToken || undefined,
                expires_in: payload.exp - now,
              },
            });

          } catch {
            // Token inválido (mal formado, corrompido, etc.)
            if (typeof window !== "undefined") {
              localStorage.removeItem("access_token");
              localStorage.removeItem("refresh_token");
            }
            set({ user: null, isAuthenticated: false, isLoading: false, error: null, tokens: null });
          }
        },

        // ─── Setters simples ──────────────────────────────────────────────────
        // Ações de uma linha — só atualizam um campo específico da store.
        // set() do Zustand faz merge (não substitui tudo), então passar
        // { error: null } só muda o campo error, o resto fica intacto.
        // ─────────────────────────────────────────────────────────────────────
        clearError: () => set({ error: null }),
        setUser: (user: User | null) => set({ user }),
        setLoading: (isLoading: boolean) => set({ isLoading }),
        setError: (error: string | null) => set({ error }),

        // ─── Helpers de autorização ───────────────────────────────────────────
        // Funções utilitárias para checar permissões.
        // get() lê o estado atual — necessário porque dentro de uma ação
        // não temos acesso direto ao estado como teríamos com this.user.
        //
        // Paralelo Django: são como métodos do User model:
        //   user.has_perm('app.view_model') ou user.groups.filter(name=role)
        // ─────────────────────────────────────────────────────────────────────
        hasRole: (role: string) => {
          const { user } = get();
          // user?.roles → se user for null, retorna undefined (não quebra)
          // ?? false    → se undefined, retorna false
          return user?.roles?.includes(role) ?? false;
        },

        hasAnyRole: (roles: string[]) => {
          const { user } = get();
          // some() → true se AO MENOS UM item passar no teste
          return roles.some((role) => user?.roles?.includes(role)) ?? false;
        },

        hasAllRoles: (roles: string[]) => {
          const { user } = get();
          // every() → true se TODOS os itens passarem no teste
          return roles.every((role) => user?.roles?.includes(role)) ?? false;
        },

        getAccessToken: () => {
          if (typeof window !== "undefined") {
            return localStorage.getItem("access_token");
          }
          return null;
        },

        isTokenExpired: () => {
          const token = get().getAccessToken();
          if (!token) return true;
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const now = Math.floor(Date.now() / 1000);
            return payload.exp < now;
          } catch {
            return true; // Se não consegue ler, considera expirado
          }
        },
      }),

      // =======================================================================
      // CONCEITO 9: Configuração do middleware persist
      //
      // O middleware persist salva automaticamente partes da store no
      // localStorage. Quando o usuário recarrega a página, o estado é
      // restaurado ("rehidratado").
      //
      // "name" → chave no localStorage onde o estado é salvo.
      //   Abra o DevTools > Application > Local Storage para ver.
      //
      // "partialize" → filtro: define QUAIS campos persistir.
      //   Aqui só persistimos "user" (nome, email, etc.).
      //   isAuthenticated NÃO é persistido — será re-verificado pelo token.
      //   Isso é intencional: o token é a fonte da verdade, não o estado.
      // =======================================================================
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          // isAuthenticated propositalmente excluído — sempre verificado via JWT
        }),

        // =====================================================================
        // CONCEITO 10: onRehydrateStorage — código que roda ao restaurar estado
        //
        // Quando a página carrega e o persist restaura o estado do localStorage,
        // este callback é executado para validar o estado restaurado.
        //
        // É como um __post_init__ de um dataclass: roda após a inicialização
        // para garantir consistência dos dados.
        //
        // Aqui: após restaurar "user" do localStorage, verifica se ainda há
        // um token válido. Se não houver (ou estiver expirado), limpa tudo.
        // =====================================================================
        onRehydrateStorage: () => (state) => {
          if (state) {
            const accessToken = typeof window !== "undefined"
              ? localStorage.getItem("access_token")
              : null;

            if (!accessToken) {
              // Sem token = sessão encerrada
              state.user = null;
              state.isAuthenticated = false;
              state.tokens = null;
            } else {
              try {
                const payload = JSON.parse(atob(accessToken.split(".")[1]));
                const now = Math.floor(Date.now() / 1000);

                if (payload.exp && payload.exp < now) {
                  // Token expirado — limpa tudo
                  localStorage.removeItem("access_token");
                  localStorage.removeItem("refresh_token");
                  state.user = null;
                  state.isAuthenticated = false;
                  state.tokens = null;
                } else {
                  // Token ainda válido — marca como autenticado
                  state.isAuthenticated = true;
                }
              } catch {
                // Token corrompido — limpa por segurança
                localStorage.removeItem("access_token");
                localStorage.removeItem("refresh_token");
                state.user = null;
                state.isAuthenticated = false;
                state.tokens = null;
              }
            }
          }
        },
      },
    ),
    { name: "AuthStore" }, // Nome que aparece no Redux DevTools
  ),
);

// =============================================================================
// CONCEITO 11: Seletores — evitando re-renders desnecessários
//
// Problema: se um componente chama useAuthStore() e pega TUDO da store,
// ele vai re-renderizar toda vez que QUALQUER campo mudar — mesmo que ele
// só use o campo "user".
//
// Solução: seletores. São funções que extraem UM pedaço específico da store.
// O Zustand só re-renderiza o componente se AQUELE pedaço específico mudar.
//
// Paralelo: é como usar .values_list('email', flat=True) no Django em vez de
// buscar o queryset inteiro — você pega só o que precisa.
//
// As funções são definidas FORA dos hooks para não serem recriadas a cada
// render (referência estável = comparação por igualdade funciona).
// =============================================================================

const selectUser = (state: AuthState) => state.user;
const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
const selectIsLoading = (state: AuthState) => state.isLoading;
const selectError = (state: AuthState) => state.error;

// Hook que expõe só os DADOS de autenticação (para leitura)
export const useAuth = () => ({
  user: useAuthStore(selectUser),
  isAuthenticated: useAuthStore(selectIsAuthenticated),
  isLoading: useAuthStore(selectIsLoading),
  error: useAuthStore(selectError),
});

const selectLogin = (state: AuthState) => state.login;
const selectRegister = (state: AuthState) => state.register;
const selectLogout = (state: AuthState) => state.logout;
const selectCheckAuth = (state: AuthState) => state.checkAuth;
const selectClearError = (state: AuthState) => state.clearError;

// Hook que expõe só as AÇÕES (para disparar eventos)
// Separar dados de ações é uma boa prática: componentes que só disparam
// ações não re-renderizam quando o estado muda.
export const useAuthActions = () => ({
  login: useAuthStore(selectLogin),
  register: useAuthStore(selectRegister),
  logout: useAuthStore(selectLogout),
  checkAuth: useAuthStore(selectCheckAuth),
  clearError: useAuthStore(selectClearError),
});
