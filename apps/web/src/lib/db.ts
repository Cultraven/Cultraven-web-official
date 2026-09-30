import dns from "dns";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

// Global is used here to maintain a cached connection across hot reloads in development.
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

/** `mongodb+srv://` needs SRV DNS lookups. Some local resolvers / VPNs refuse them (ECONNREFUSED on querySrv). */
function isSrvDnsFailure(e: any): boolean {
  return (
    e?.syscall === "querySrv" ||
    /querySrv (ECONNREFUSED|ENOTFOUND|ETIMEOUT|ESERVFAIL)/.test(String(e?.message ?? ""))
  );
}

async function connectWithDnsFallback(uri: string) {
  const opts = { bufferCommands: false };
  try {
    return await mongoose.connect(uri, opts);
  } catch (e) {
    if (!uri.startsWith("mongodb+srv://") || !isSrvDnsFailure(e)) throw e;
    // Retry once using public resolvers (override with MONGODB_DNS_SERVERS="ip,ip").
    const servers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim()).filter(Boolean);
    console.warn(`[db] SRV lookup failed with system DNS (${dns.getServers().join(", ")}). Retrying with ${servers.join(", ")}.`);
    dns.setServers(servers);
    return await mongoose.connect(uri, opts);
  }
}

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error(
      "Please define the MONGODB_URI environment variable inside .env"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = connectWithDnsFallback(MONGODB_URI).then((mongoose) => {
      console.log("MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached.conn;
}
