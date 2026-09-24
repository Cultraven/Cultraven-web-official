import cors from "cors";
import express from "express";
import helmet from "helmet";
import { SERVICE_PORTS } from "@shop/config";
import { connectMongo } from "@shop/database";
import { createLogger } from "@shop/logger";

const log = createLogger("order-service");
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ service: "order-service", status: "ok" });
});

// Mount module routers here, e.g.
// app.use("/api/v1/order/<module>", moduleRoutes);

async function main() {
  if (process.env.MONGODB_URI) {
    await connectMongo(process.env.MONGODB_URI, "shop_order");
  }
  const port = Number(process.env.PORT ?? SERVICE_PORTS["order"]);
  app.listen(port, () => log.info(`order-service listening on :${port}`));
}

main().catch((err) => {
  log.error(err);
  process.exit(1);
});
