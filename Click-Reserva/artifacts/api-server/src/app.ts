import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";
import pkg from "pg";
const { Pool } = pkg;
import ConnectPgSimple from "connect-pg-simple";
import { securityHeaders, sanitizeBody } from "./middlewares/security-headers"; // ← NOVO
import { apiRateLimit } from "./middlewares/rate-limit";                        // ← NOVO

const app: Express = express();

app.set("trust proxy", 1);

// ── Segurança: headers HTTP ──────────────────────────────────────
app.use(securityHeaders); // ← NOVO

// ── Logs ────────────────────────────────────────────────────────
app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

// ── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
  credentials: true,
}));

// ── Body parsing + sanitização ───────────────────────────────────
app.use(express.json({ limit: "1mb" }));           // limita tamanho do body
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(sanitizeBody); // ← NOVO — sanitiza inputs automaticamente

// ── Sessão ───────────────────────────────────────────────────────
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const PgSession = ConnectPgSimple(session);

app.use(session({
  store: new PgSession({
    pool: pgPool,
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET ?? "clickreserva-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    sameSite: "none",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// ── Rate limiting geral da API ───────────────────────────────────
app.use("/api", apiRateLimit); // ← NOVO — 200 req/min por IP

// ── Rotas ────────────────────────────────────────────────────────
app.use("/api", router);

// ── Frontend React buildado ──────────────────────────────────────
const distPublic = path.join(__dirname, "public");
if (fs.existsSync(distPublic)) {
  app.use(express.static(distPublic));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPublic, "index.html"));
  });
}

export default app;
