import cors from "cors";
import express from "express";
import helmet from "helmet";
import { createProxyMiddleware } from "http-proxy-middleware";
import { SERVICE_PORTS } from "@shop/config";
import { createLogger } from "@shop/logger";

const log = createLogger("gateway");
const app = express();

const origins = (
  process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:3001,http://localhost:3002"
).split(",");

app.use(helmet());
app.use(cors({ origin: origins, credentials: true }));
// NOTE: no body parser here — the proxy must stream request bodies untouched.

app.get("/health", (_req, res) => {
  res.json({ service: "gateway", status: "ok" });
});

// /api/v1/<name>/* -> <NAME>_SERVICE_URL (falls back to localhost:<port>)
const routes = [
  "auth",
  "user",
  "catalog",
  "inventory",
  "cart",
  "order",
  "payment",
  "delivery",
  "notification",
  "cms",
  "promotion",
  "review",
  "analytics",
] as const;

for (const name of routes) {
  const target =
    process.env[`${name.toUpperCase()}_SERVICE_URL`] ?? `http://localhost:${SERVICE_PORTS[name]}`;
  app.use(createProxyMiddleware({ pathFilter: `/api/v1/${name}`, target, changeOrigin: true }));
}

const port = Number(process.env.PORT ?? SERVICE_PORTS.gateway);
app.listen(port, () => log.info(`gateway listening on :${port}`));
