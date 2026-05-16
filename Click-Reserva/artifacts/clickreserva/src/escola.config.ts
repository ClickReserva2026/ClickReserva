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
  tagline: "Tecnologia que Organiza, Escola que Avança",

  // Domínio institucional (usado no placeholder dos campos de e-mail)
  emailDominio: "escola.pr.gov.br",

  // ── Cores do tema ──────────────────────────────────────────────
  // Valores em HSL sem a função hsl() — ex: "155 79% 24%"
  // Use https://hslpicker.com para converter hex → HSL
  cores: {
    // Cor principal (botões, links, destaques) — verde floresta
    primaria: "155 79% 24%",

    // Cor secundária (gradiente, badges) — verde teal
    secundaria: "160 84% 34%",

    // Sidebar (menu lateral) — verde escuro
    sidebar: "150 72% 14%",
    sidebarPrimaria: "150 70% 48%",
    sidebarAccent: "150 55% 20%",

    // Fundo geral das páginas — verde suavíssimo
    fundo: "150 40% 97%",

    // Cor de foco/anel
    anel: "155 79% 24%",

    // Cor do theme-color do PWA (hex, para barra do celular)
    themeHex: "#0d6e4a",
  },
};
