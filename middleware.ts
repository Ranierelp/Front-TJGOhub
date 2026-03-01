import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Headers de segurança
  const response = NextResponse.next();

  const connectSrc = ["'self'", "https:"];

  // Em desenvolvimento, permite a conexão com a API via HTTP
  if (process.env.NODE_ENV === "development") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    connectSrc.push(apiUrl);
  }

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src ${connectSrc.join(" ")};
    font-src 'self' data:;
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Headers para evitar cache de dados sensíveis
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  // Log de acesso para auditoria (apenas em desenvolvimento)
  if (process.env.NEXT_PUBLIC_DEBUG_MODE === "true") {
    const userAgent = request.headers.get("user-agent") || "";
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    console.log(
      `[${new Date().toISOString()}] Access: ${ip} - ${pathname} - ${userAgent}`,
    );
  }

  // Verificar se é uma rota protegida
  const protectedPaths = ["/dashboard"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path),
  );

  if (isProtectedPath) {
    // A verificação de autenticação é feita no lado cliente
    // pelo DashboardLayoutClient que tem acesso ao localStorage
    return response;
  }

  // Rotas públicas permitidas
  const publicPaths = ["/", "/auth"];

  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js|workbox-*).*)",
  ],
};
