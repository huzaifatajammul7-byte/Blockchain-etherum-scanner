import "dotenv/config"; // loads .env from the project root (if present)
import express from "express";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { PORT, CORS_ORIGIN } from "./config.js";
import routes from "./routes.js";
import { explain } from "./errors.js";

const app = express();
app.disable("x-powered-by");
app.use(compression());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use((req, _, next) => { console.log(new Date().toISOString(), req.method, req.originalUrl); next(); });
app.use("/api", rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute." } }));
app.use("/api", routes);
app.use("/api", (_, res) => res.status(404).json({ error: "Route not found" })); // JSON, never HTML

// Production: serve the built React app (client/dist) from this same server
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");
if (fs.existsSync(dist)) {
  app.use("/assets", express.static(path.join(dist, "assets"), { maxAge: "1y", immutable: true })); // hashed files
  app.use(express.static(dist));
  app.get("*", (_, res) => res.sendFile(path.join(dist, "index.html")));
} else {
  app.get("/", (_, res) => res.status(503).send("Frontend build nahi mila. Terminal mein 'npm run build' chalayein, phir server dobara start karein (npm start)."));
}

// Central error handler: turns blockchain/RPC failures into clear, actionable messages
app.use((err, _req, res, _next) => {
  const [status, message] = explain(err);
  if (status >= 500 || status === 502) console.error("[error]", err.code || "", err.shortMessage || err.message);
  res.status(status).json({ error: message });
});

app.listen(PORT, () => console.log(`EtherReceipt API on http://localhost:${PORT}`));
