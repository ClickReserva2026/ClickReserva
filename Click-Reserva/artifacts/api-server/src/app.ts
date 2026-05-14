import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app: Express = express();

app.set("trust proxy", 1);

app.use(pinoHttp({
  logger,
  serializers: {
    req(req) { return { id: req.id, method: req.method, url: req.url?.split("?")[0] }; },
    res(res) { return { statusCode: res.statusCode }; },
  },
}));

app.use(cors({
  origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import pkg from 'pg';
const { Pool } = pkg;
import ConnectPgSimple from 'connect-pg-simple';

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

app.use("/api", router);

// Serve o frontend React buildado
const distPublic = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
if (fs.existsSync(distPublic)) {
  app.use(express.static(distPublic));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPublic, "index.html"));
  });
}

export default app;
