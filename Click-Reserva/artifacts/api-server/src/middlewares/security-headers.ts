// artifacts/api-server/src/middlewares/security-headers.ts
// Headers de segurança HTTP — sem dependências extras.

import { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Impede clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Impede MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Força HTTPS
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

  // Controla informações do referrer
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove header que expõe tecnologia
  res.removeHeader("X-Powered-By");

  // Política de permissões (desativa features desnecessárias)
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // Content Security Policy básico
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'"
  );

  next();
}

// ── Sanitização básica de inputs ─────────────────────────────────
// Remove caracteres perigosos de strings para evitar XSS e injeção
export function sanitizeInput(input: unknown): unknown {
  if (typeof input === "string") {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim();
  }
  if (Array.isArray(input)) return input.map(sanitizeInput);
  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([k, v]) => [k, sanitizeInput(v)])
    );
  }
  return input;
}

// Middleware que sanitiza req.body automaticamente
export function sanitizeBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }
  next();
}
