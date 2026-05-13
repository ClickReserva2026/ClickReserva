// ══════════════════════════════════════════════════════════════════
//  CONFIGURAÇÃO DA ESCOLA (backend) — edite apenas este arquivo
//  para cada nova implementação do ClickReserva.
// ══════════════════════════════════════════════════════════════════

export const ESCOLA = {
  // Nome completo (usado nos e-mails enviados aos professores)
  nome: "C.E. Prof. Mário B.T. Braga",

  // Nome do app (usado nos e-mails)
  appNome: "ClickReserva",

  // Domínios de e-mail permitidos no cadastro
  // Adicione ou remova domínios conforme a rede da escola
  emailDominiosPermitidos: [
    "@escola.pr.gov.br",
    "@escola.edu.br",
    ".edu.br",
  ],

  // Palavras aceitas em qualquer parte do e-mail (flexibilidade)
  emailPalavrasPermitidas: ["escola", "edu"],

  // Mensagem de erro exibida quando e-mail não é institucional
  emailErroMensagem: "Use seu e-mail institucional da escola (@escola.pr.gov.br).",

  // Cor primária usada nos e-mails HTML (hex)
  emailCorPrimaria: "#1a4fa0",
  emailCorFundo: "#e8f0fa",
  emailCorBorda: "#c8d6f0",
};
