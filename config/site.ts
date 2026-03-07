export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "TJGOHub",
  fullName: "TJGO Playwright Results Hub",
  description: "Sistema de gerenciamento de resultados de testes automatizados E2E do TJGO",
  // navItems: links exibidos na navbar desktop
  navItems: [
    { label: "Dashboard",    href: "/dashboard" },
    { label: "Projetos",     href: "/dashboard/projetos" },
    { label: "Execuções",    href: "/dashboard/execucoes" },
    { label: "Casos",        href: "/dashboard/casos" },
    { label: "Tags",         href: "/dashboard/tags" },
    { label: "Configurações", href: "/dashboard/configuracoes" },
  ] as Array<{ label: string; href: string }>,
  // navMenuItems: itens do menu lateral mobile + dropdown do avatar
  navMenuItems: [
    { label: "Dashboard",    href: "/dashboard" },
    { label: "Projetos",     href: "/dashboard/projetos" },
    { label: "Execuções",    href: "/dashboard/execucoes" },
    { label: "Casos",        href: "/dashboard/casos" },
    { label: "Tags",         href: "/dashboard/tags" },
    { label: "Configurações", href: "/dashboard/configuracoes" },
  ],
  links: {},
};
