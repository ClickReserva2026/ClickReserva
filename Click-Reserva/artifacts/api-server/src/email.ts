import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

import { ESCOLA } from "./escola.config";
const SCHOOL_NAME = ESCOLA.nome;
const APP_NAME = ESCOLA.appNome;
const GREEN = ESCOLA.emailCorPrimaria;
const LIGHT_GREEN = ESCOLA.emailCorFundo;
const BORDER_COLOR = ESCOLA.emailCorBorda;

function baseTemplate(bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f1;font-family:'Segoe UI',Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f1;padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:${GREEN};padding:24px 32px;text-align:center">
            <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.5px">${APP_NAME}</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75)">${SCHOOL_NAME}</p>
          </td>
        </tr>
        <tr><td style="padding:28px 32px">${bodyContent}</td></tr>
        <tr>
          <td style="background:${LIGHT_GREEN};padding:16px 32px;border-top:1px solid ${BORDER_COLOR};text-align:center">
            <p style="margin:0;font-size:11px;color:#6b8f76">Este é um e-mail automático. Não responda a esta mensagem.</p>
            <p style="margin:4px 0 0;font-size:11px;color:#6b8f76">${APP_NAME} &mdash; ${SCHOOL_NAME}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function infoRow(label: string, value: string, last = false): string {
  const border = last ? "" : `border-bottom:1px solid ${BORDER_COLOR};`;
  return `<tr>
    <td style="padding:10px 16px;${border}font-size:13px;color:#5a6e63;width:40%">${label}</td>
    <td style="padding:10px 16px;${border}font-size:14px;font-weight:600;color:#1a2e24">${value}</td>
  </tr>`;
}

function reservationTable(opts: {
  subject: string;
  classGroup: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
}): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;margin-bottom:20px">
      ${infoRow("Disciplina", opts.subject)}
      ${infoRow("Turma", opts.classGroup)}
      ${infoRow("Sala", opts.roomName)}
      ${infoRow("Data", opts.date)}
      ${infoRow("Horário", `${opts.startTime} – ${opts.endTime}`, true)}
    </table>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY não configurado" };
  try {
    const result = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (result.error) return { ok: false, error: JSON.stringify(result.error) };
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message ?? String(err) };
  }
}

// ─── Lembrete antes da aula ─────────────────────────────────────────────────

export async function sendReservationReminder(opts: {
  to: string;
  professorName: string;
  subject: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  classGroup: string;
  minutesBefore: number;
}): Promise<{ ok: boolean; error?: string }> {
  const label = opts.minutesBefore === 1 ? "1 minuto" : `${opts.minutesBefore} minutos`;
  const emoji = opts.minutesBefore === 1 ? "🔔" : opts.minutesBefore <= 5 ? "⏰" : "📅";

  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:${GREEN}">${emoji} Sua aula começa em ${label}!</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.professorName}</strong>! Aqui está o resumo da sua reserva:
    </p>
    ${reservationTable(opts)}
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        <strong>Lembrete:</strong> Não se esqueça de confirmar sua presença no sistema após o início da aula para evitar o registro de falta.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `${emoji} Lembrete ${APP_NAME}: sua aula começa em ${label} — ${opts.subject}`,
    baseTemplate(body)
  );
}

// ─── Reserva solicitada (aguardando aprovação) ───────────────────────────────

export async function sendReservationSubmitted(opts: {
  to: string;
  professorName: string;
  subject: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  classGroup: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:${GREEN}">📋 Solicitação de reserva enviada</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.professorName}</strong>! Sua solicitação de reserva foi registrada e está aguardando aprovação da coordenação.
    </p>
    ${reservationTable(opts)}
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        Você receberá um novo e-mail assim que a coordenação aprovar ou recusar sua solicitação.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `📋 ${APP_NAME}: solicitação de reserva recebida — ${opts.subject}`,
    baseTemplate(body)
  );
}

// ─── Reserva aprovada ────────────────────────────────────────────────────────

export async function sendReservationApproved(opts: {
  to: string;
  professorName: string;
  subject: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  classGroup: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:${GREEN}">✅ Reserva aprovada!</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.professorName}</strong>! Sua reserva foi <strong>aprovada</strong> pela coordenação. Confira os detalhes abaixo:
    </p>
    ${reservationTable(opts)}
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        <strong>Lembrete:</strong> Você receberá um aviso por e-mail e notificação no sistema antes do início da aula. Não se esqueça de confirmar sua presença.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `✅ ${APP_NAME}: reserva aprovada — ${opts.subject} em ${opts.date}`,
    baseTemplate(body)
  );
}

// ─── Reserva recusada ────────────────────────────────────────────────────────

export async function sendReservationRejected(opts: {
  to: string;
  professorName: string;
  subject: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  classGroup: string;
  reason?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#c0392b">❌ Reserva recusada</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.professorName}</strong>. Infelizmente sua solicitação de reserva foi <strong>recusada</strong> pela coordenação.
    </p>
    ${reservationTable(opts)}
    ${opts.reason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin-bottom:16px">
      <p style="margin:0;font-size:13px;color:#991b1b">
        <strong>Motivo:</strong> ${opts.reason}
      </p>
    </div>` : ""}
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        Entre em contato com a coordenação para mais informações ou realize uma nova solicitação em outro horário disponível.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `❌ ${APP_NAME}: reserva recusada — ${opts.subject} em ${opts.date}`,
    baseTemplate(body)
  );
}

// ─── Reserva cancelada ───────────────────────────────────────────────────────

export async function sendReservationCancelled(opts: {
  to: string;
  professorName: string;
  subject: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  classGroup: string;
  cancelledByCoordinator?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#b45309">🚫 Reserva cancelada</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.professorName}</strong>. ${opts.cancelledByCoordinator
        ? "Sua reserva foi <strong>cancelada pela coordenação</strong>."
        : "Sua reserva foi <strong>cancelada com sucesso</strong>."}
    </p>
    ${reservationTable(opts)}
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        Caso precise, você pode realizar uma nova reserva diretamente no ${APP_NAME}.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `🚫 ${APP_NAME}: reserva cancelada — ${opts.subject} em ${opts.date}`,
    baseTemplate(body)
  );
}

// ─── Cadastro aprovado ───────────────────────────────────────────────────────

export async function sendRegistrationApproved(opts: {
  to: string;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:${GREEN}">✅ Cadastro aprovado!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.name}</strong>! Seu cadastro no <strong>${APP_NAME}</strong> foi aprovado pela coordenação.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#5a6e63">
      Agora você pode acessar o sistema e fazer reservas de salas de informática e laboratórios normalmente.
    </p>
    <div style="background:${LIGHT_GREEN};border:1px solid ${BORDER_COLOR};border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${GREEN}">
        <strong>Bem-vindo(a) ao ${APP_NAME}!</strong> Acesse o sistema com o e-mail e senha cadastrados.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `✅ ${APP_NAME}: seu cadastro foi aprovado — Bem-vindo(a)!`,
    baseTemplate(body)
  );
}

// ─── Cadastro recusado ───────────────────────────────────────────────────────

export async function sendRegistrationRejected(opts: {
  to: string;
  name: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:#c0392b">❌ Cadastro não aprovado</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.name}</strong>. Infelizmente seu cadastro no <strong>${APP_NAME}</strong> não foi aprovado pela coordenação.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:#991b1b">
        Entre em contato com a coordenação do C.E. Prof. Mário B.T. Braga para mais informações.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `❌ ${APP_NAME}: solicitação de cadastro não aprovada`,
    baseTemplate(body)
  );
}

// ─── Redefinição de senha ────────────────────────────────────────────────────

export async function sendPasswordReset(opts: {
  to: string;
  name: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  const body = `
    <h2 style="margin:0 0 6px;font-size:20px;color:${GREEN}">🔑 Redefinição de senha</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#5a6e63">
      Olá, <strong>${opts.name}</strong>! A coordenação redefiniu sua senha de acesso ao <strong>${APP_NAME}</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
      style="border:1px solid ${BORDER_COLOR};border-radius:8px;overflow:hidden;margin-bottom:20px">
      ${infoRow("Nova senha temporária", opts.newPassword, true)}
    </table>
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:#b77a00">
        <strong>Importante:</strong> Após o primeiro acesso, altere sua senha nas configurações do seu perfil para garantir a segurança da sua conta.
      </p>
    </div>`;

  return sendEmail(
    opts.to,
    `🔑 ${APP_NAME}: sua senha foi redefinida pela coordenação`,
    baseTemplate(body)
  );
}
