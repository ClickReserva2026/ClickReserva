import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import fs from "fs";
import path from "path";

const app: Express = express();

// Garante que o Express confie no proxy do Render para repassar os cookies de sessão de forma segura
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

// Libera o CORS especificamente para a URL atual do seu front-end
app.use(cors({
  origin: process.env["FRONTEND_URL"] ?? "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET ?? "clickreserva-dev-secret",
  resave: true,
  saveUninitialized: true,
  cookie: {
    secure: true,      // Exige HTTPS em produção (essencial para navegadores modernos)
    sameSite: "none",  // Permite o envio do cookie entre domínios diferentes do Render
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
// Serve o frontend React buildado
const distPath = path.join(path.dirname(new URL(import.meta.url).pathname), "../../dist/public");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}
// Serve o frontend
const distPublic = path.join(path.dirname(fileURLToPath(new URL(import.meta.url))), 'public');
if (fs.existsSync(distPublic)) {
  app.use(express.static(distPublic));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(distPublic, 'index.html'));
  });
}
export default app;
