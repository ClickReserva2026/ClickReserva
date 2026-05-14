import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";

const app: Express = express();

// DIZ AO EXPRESS PARA CONFIAR NO PROXY DO RENDER (ESSENCIAL PARA OS COOKIES DE SESSÃO)
app.set("trust proxy", 1);

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

// Libera totalmente as requisições vindas do seu site para evitar qualquer trava de CORS
app.use(cors({
  origin: "https://clickreserva-site-0chq.onrender.com",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET ?? "clickreserva-dev-secret",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: true,      // Funciona agora que ativamos o trust proxy acima
    sameSite: "none",  // Permite cross-site cookie para o site -0chq ler o backend -1cey
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
