// =============================================================================
// CONCEITO 1: O que é um "Hook" customizado
//
// Hooks são funções que começam com "use" e podem usar outros hooks por dentro.
// Eles encapsulam lógica reutilizável — é o principal mecanismo de
// compartilhamento de comportamento no React.
//
// Paralelo Django: pense num hook como um mixin de uma CBV, ou em um decorator
// de view reutilizável — você define a lógica uma vez e aplica em vários lugares.
//
// Hooks do React que este arquivo usa:
//   useEffect → roda código em resposta a mudanças de estado
//   useState  → estado local do hook
//   useRouter → hook do Next.js para navegar entre rotas
// =============================================================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "./useAuth";

// =============================================================================
// CONCEITO 2: Interface com campos opcionais e valores padrão
//
// UseAuthGuardOptions define as configurações do hook.
// Todo campo com "?" é opcional — quem usar o hook pode não passar nenhum.
//
// Isso é o padrão "Options Object" — em vez de vários parâmetros posicionais,
// você passa um objeto com os campos que quiser sobrescrever.
//
// Paralelo Python: é como **kwargs com defaults em uma função:
//   def useAuthGuard(redirect_to="/auth/login", requires_guest=False, ...):
// =============================================================================
interface UseAuthGuardOptions {
  redirectTo?: string;      // Para onde ir se não autenticado (default: /auth/login)
  requiresGuest?: boolean;  // true = redireciona autenticados para fora desta rota
  guestRedirectTo?: string; // Para onde ir quando autenticado (default: /dashboard)
  autoCheck?: boolean;      // Se deve verificar automaticamente ao montar
}

// =============================================================================
// CONCEITO 3: useAuthGuard — o hook principal
//
// Este hook é o "guardião" de rotas. Ele resolve uma pergunta:
// "Este usuário pode estar nesta página agora?"
//
// Existem dois tipos de página:
//   • Protegidas   (requiresGuest=false): só autenticados entram
//                  Se não autenticado → redireciona para /auth/login
//
//   • De visitante (requiresGuest=true): só NÃO autenticados entram
//                  Ex: tela de login — se já logado, redireciona para /dashboard
//
// O hook retorna dados e funções que o componente usa para:
//   1. Saber se ainda está carregando a verificação
//   2. Redirecionar manualmente quando necessário
// =============================================================================
export function useAuthGuard(options: UseAuthGuardOptions = {}) {

  // Valores padrão via desestruturação — se a opção não foi passada, usa o default
  const {
    redirectTo = "/auth/login",
    requiresGuest = false,
    guestRedirectTo = "/dashboard",
    autoCheck = true,
  } = options;

  // =============================================================================
  // CONCEITO 4: Compondo hooks — usando outros hooks dentro de um hook
  //
  // useAuth() → dados da store (isAuthenticated, isLoading, checkAuth)
  // useRouter() → objeto de navegação do Next.js
  //   router.push("/rota")    → navega para a rota (como HttpResponseRedirect)
  //   router.replace("/rota") → navega sem deixar histórico (sem botão "voltar")
  // =============================================================================
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const router = useRouter();

  // Estado local do hook — não precisa estar na store global porque
  // só interessa para este hook específico
  const [hasInitialized, setHasInitialized] = useState(false); // já verificou o token?
  const [isRedirecting, setIsRedirecting] = useState(false);   // está redirecionando?

  // =============================================================================
  // CONCEITO 5: useEffect com array de dependências
  //
  // useEffect(função, [dep1, dep2, ...])
  //
  // O React executa a função sempre que alguma dependência do array mudar.
  // Se você omitir o array, roda em todo render (geralmente indesejado).
  // Se passar [] vazio, roda apenas uma vez (quando o componente monta).
  //
  // REGRA IMPORTANTE: qualquer variável do componente usada dentro do useEffect
  // deve estar listada nas dependências. O ESLint avisa se você esquecer.
  //
  // Aqui o array tem várias dependências porque o efeito precisa reagir a
  // mudanças em isAuthenticated, isLoading, hasInitialized, etc.
  // =============================================================================
  useEffect(() => {
    if (!autoCheck || isRedirecting) return;

    // ==========================================================================
    // CONCEITO 6: Função async dentro de useEffect
    //
    // useEffect não aceita uma função async diretamente (retornaria uma Promise,
    // mas o useEffect espera void ou uma função de cleanup).
    //
    // A solução padrão é definir uma função async DENTRO do useEffect e
    // chamá-la imediatamente. É um padrão muito comum no React.
    //
    // Paralelo: é como chamar asyncio.run() para executar uma coroutine.
    // ==========================================================================
    const initializeAuth = async () => {

      // Primeira execução: verifica o token na API/localStorage
      if (!hasInitialized) {
        try {
          await checkAuth(); // chama checkAuth() da store
        } catch (error) {
          console.error("Erro na verificação inicial:", error);
        }
        setHasInitialized(true);
        return; // Para aqui — o useEffect vai rodar de novo porque hasInitialized mudou
      }

      // Ainda carregando → aguarda próxima execução
      if (isLoading) return;

      // =======================================================================
      // CONCEITO 7: Lógica de redirecionamento
      //
      // Só chegamos aqui depois que:
      //   1. hasInitialized é true (checkAuth já rodou)
      //   2. isLoading é false (a verificação terminou)
      //
      // Aí decidimos se redireciona baseado em requiresGuest + isAuthenticated.
      //
      // Caso 1 — Página de visitante (ex: login) + usuário autenticado:
      //   Redireciona para /dashboard (ou para onde ?redirect= aponta)
      //
      // Caso 2 — Página protegida (ex: dashboard) + usuário não autenticado:
      //   Redireciona para /auth/login?redirect=/dashboard
      //   O ?redirect= guarda onde o usuário queria ir, para mandar de volta
      //   após o login — como o next= do Django login_required.
      // =======================================================================

      if (requiresGuest && isAuthenticated) {
        setIsRedirecting(true);
        const currentParams = new URLSearchParams(window.location.search);
        const redirect = currentParams.get("redirect") || guestRedirectTo;
        router.push(redirect);

      } else if (!requiresGuest && !isAuthenticated) {
        setIsRedirecting(true);
        const currentPath = window.location.pathname + window.location.search;
        const loginUrl = new URL(redirectTo, window.location.origin);

        // Só adiciona ?redirect= se não estiver já numa página de auth
        if (currentPath !== "/" && !currentPath.includes("/auth/")) {
          loginUrl.searchParams.set("redirect", currentPath);
        }

        router.push(loginUrl.toString());
      }
    };

    initializeAuth();
  }, [
    // Todas as variáveis externas usadas dentro do useEffect
    autoCheck,
    hasInitialized,
    isLoading,
    isAuthenticated,
    requiresGuest,
    isRedirecting,
    checkAuth,
    router,
    redirectTo,
    guestRedirectTo,
  ]);

  // =============================================================================
  // CONCEITO 8: Derivando estado — calcular valores a partir do estado existente
  //
  // effectiveIsLoading combina 3 condições:
  //   • isLoading        → a store ainda está verificando o token
  //   • !hasInitialized  → ainda não rodamos checkAuth() pela primeira vez
  //   • isRedirecting    → já decidimos redirecionar, aguardando a navegação
  //
  // Para o componente consumidor, qualquer uma dessas condições significa
  // "ainda não está pronto para mostrar conteúdo".
  //
  // Isso é "estado derivado" — calculado a partir de outros estados,
  // sem precisar de um useState extra.
  // =============================================================================
  const effectiveIsLoading = isLoading || !hasInitialized || isRedirecting;

  // O hook retorna um objeto com dados e funções
  // O componente escolhe o que desestruturar: const { redirectToSystem } = useGuestRoute()
  return {
    isAuthenticated,
    isLoading: effectiveIsLoading,

    checkAuth,

    // Redireciona para login guardando a rota atual no ?redirect=
    // Para que após o login o usuário volte para onde queria
    redirectToLogin: () => {
      const currentPath = window.location.pathname + window.location.search;
      const loginUrl = new URL(redirectTo, window.location.origin);

      if (currentPath !== "/" && !currentPath.includes("/auth/")) {
        loginUrl.searchParams.set("redirect", currentPath);
      }

      router.push(loginUrl.toString());
    },

    // Redireciona para o dashboard (ou para ?redirect= se existir)
    redirectToSystem: () => {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get("redirect") || guestRedirectTo;
      router.push(redirect);
    },
  };
}

// =============================================================================
// CONCEITO 9: Hooks especializados — o padrão "façade"
//
// useProtectedRoute e useGuestRoute são wrappers de useAuthGuard com
// configurações pré-definidas para cada cenário de uso.
//
// Por que separar?
//   1. Legibilidade: useProtectedRoute() deixa claro a intenção
//   2. Consistência: todos os dashboards usam a mesma configuração
//   3. DRY: se mudar o redirect padrão, muda em um só lugar
//
// Paralelo Django: são como decorators específicos construídos em cima de
// um decorator genérico:
//   @login_required = @permission_required com verificação de autenticação
// =============================================================================

// Para páginas protegidas — redireciona para login se não autenticado
export function useProtectedRoute() {
  return useAuthGuard({
    redirectTo: "/auth/login",
    requiresGuest: false,
    autoCheck: true,
  });
}

// Para páginas de visitante — redireciona para dashboard se já autenticado
export function useGuestRoute() {
  return useAuthGuard({
    redirectTo: "/auth/login",
    requiresGuest: true,
    guestRedirectTo: "/dashboard",
    autoCheck: true,
  });
}

export default useAuthGuard;
