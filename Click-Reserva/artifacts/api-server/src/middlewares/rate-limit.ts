// artifacts/api-server/src/middlewares/rate-limit.ts
// Rate limiting em memória — sem dependências extras.

import { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}

// Limpa entradas antigas a cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstRequest > 60 * 60 * 1000) store.delete(key);
  }
}, 10 * 60 * 1000);

// ── Rate limiter genérico ────────────────────────────────────────
export function createRateLimit(opts: {
  windowMs: number;   // janela de tempo em ms
  max: number;        // máximo de requisições na janela
  blockMs: number;    // tempo de bloqueio após exceder
  message: string;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = getClientIp(req);
    const key = `${req.path}:${ip}`;
    const now = Date.now();

    const entry = store.get(key) ?? { count: 0, firstRequest: now };

    // Está bloqueado?
    if (entry.blockedUntil && now < entry.blockedUntil) {
      const remaining = Math.ceil((entry.blockedUntil - now) / 1000);
      res.status(429).json({
        error: "Muitas tentativas",
        message: opts.message,
        retryAfterSeconds: remaining,
      });
      return;
    }

    // Janela expirou — reinicia contagem
    if (now - entry.firstRequest > opts.windowMs) {
      entry.count = 0;
      entry.firstRequest = now;
      entry.blockedUntil = undefined;
    }

    entry.count++;

    if (entry.count > opts.max) {
      entry.blockedUntil = now + opts.blockMs;
      store.set(key, entry);
      res.status(429).json({
        error: "Muitas tentativas",
        message: opts.message,
        retryAfterSeconds: Math.ceil(opts.blockMs / 1000),
      });
      return;
    }

    store.set(key, entry);
    next();
  };
}

// ── Rate limiters prontos para uso ───────────────────────────────

// Login: máx 10 tentativas em 15 min → bloqueia por 30 min
export const loginRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  blockMs: 30 * 60 * 1000,
  message: "Muitas tentativas de login. Tente novamente em 30 minutos.",
});

// Cadastro: máx 5 cadastros por hora por IP
export const registerRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  blockMs: 60 * 60 * 1000,
  message: "Muitos cadastros realizados. Tente novamente em 1 hora.",
});

// API geral: máx 200 req por minuto por IP
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 200,
  blockMs: 5 * 60 * 1000,
  message: "Muitas requisições. Aguarde alguns minutos.",
});
