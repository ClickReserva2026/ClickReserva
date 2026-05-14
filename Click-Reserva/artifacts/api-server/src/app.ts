import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// Libera o CORS dinamicamente para aceitar a URL do front-end independente do sufixo gerado pelo Render
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de sessão robusta para aceitar tráfego HTTPS seguro entre subdomínios diferentes no Render
app.use(session({
  secret: process.env.SESSION_SECRET ?? "clickreserva-dev-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,      // Obriga o uso de HTTPS em produção
    sameSite: "none",  // Permite o envio de cookies de sessão cross-site do front para o back
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

app.use("/api", router);

app.get("/api/download-projeto", (req, res) => {
  const zipPath = "/tmp/clickreserva-projeto.zip";
  if (!fs.existsSync(zipPath)) {
    res.status(404).send("Arquivo não encontrado. Peça ao agente para gerar novamente.");
    return;
  }
  res.setHeader("Content-Disposition", "attachment; filename=clickreserva-projeto.zip");
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Length", fs.statSync(zipPath).size);
  fs.createReadStream(zipPath).pipe(res);
});

export default app;
