// ══════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DA ESCOLA — edite apenas este arquivo para cada
//  nova implementação do ClickReserva em uma escola diferente.
// ══════════════════════════════════════════════════════════════════

export const ESCOLA = {
  // Nome completo exibido na tela de login e rodapé
  nome: "C.E. Prof. Mário B.T. Braga",

  // Nome curto (para título do app PWA, notificações, etc.)
  nomeAbreviado: "CE Braga",

  // Slogan exibido no rodapé da tela de login
  tagline: "Sistema de agendamento • C.E. Prof. Mario B.T. Braga",

  // Domínio institucional (usado no placeholder dos campos de e-mail)
  emailDominio: "escola.pr.gov.br",

  // ── Cores do tema ──────────────────────────────────────────────
  // Valores em HSL sem a função hsl() — ex: "216 72% 36%"
  // Use https://hslpicker.com para converter hex → HSL
  cores: {
    // Cor principal (botões, links, destaques)
    primaria: "216 72% 36%",

    // Cor secundária (gradiente, badges)
    secundaria: "174 80% 26%",

    // Sidebar (menu lateral) — fundo escuro
    sidebar: "216 60% 16%",
    sidebarPrimaria: "174 70% 45%",
    sidebarAccent: "216 50% 22%",

    // Fundo geral das páginas
    fundo: "210 30% 97%",

    // Cor de foco/anel
    anel: "216 72% 36%",

    // Cor do theme-color do PWA (hex, para barra do celular)
    themeHex: "#1a4fa0",
  },
};
