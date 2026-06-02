export type NavItem = { label: string; href: string; adminOnly?: boolean };
export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "TJGOHub",
  fullName: "TJGO Playwright Results Hub",
  description: "Sistema de gerenciamento de resultados de testes automatizados E2E do TJGO",
  // navItems: links exibidos na navbar desktop
  // adminOnly: true → visível somente para usuários com role "admin"
  navItems: [
    { label: "Dashboard",  href: "/dashboard" },
    { label: "Projetos",   href: "/dashboard/projetos" },
    { label: "Execuções",  href: "/dashboard/execucoes" },
    { label: "Casos",      href: "/dashboard/casos/board" },
    { label: "Usuários",   href: "/dashboard/usuarios", adminOnly: true },
  ] as NavItem[],
  navMenuItems: [
    { label: "Dashboard",  href: "/dashboard" },
    { label: "Projetos",   href: "/dashboard/projetos" },
    { label: "Execuções",  href: "/dashboard/execucoes" },
    { label: "Casos",      href: "/dashboard/casos/board" },
    { label: "Usuários",   href: "/dashboard/usuarios", adminOnly: true },
  ] as NavItem[],
  links: {},
};
