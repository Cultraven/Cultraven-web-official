import cors from "cors";
import express from "express";
import helmet from "helmet";
import { SERVICE_PORTS } from "@shop/config";
import { connectMongo } from "@shop/database";
import { createLogger } from "@shop/logger";

const log = createLogger("promotion-service");
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ service: "promotion-service", status: "ok" });
});

// Mount module routers here, e.g.
// app.use("/api/v1/promotion/<module>", moduleRoutes);

async function main() {
  if (process.env.MONGODB_URI) {
    await connectMongo(process.env.MONGODB_URI, "shop_promotion");
  }
  const port = Number(process.env.PORT ?? SERVICE_PORTS["promotion"]);
  app.listen(port, () => log.info(`promotion-service listening on :${port}`));
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
