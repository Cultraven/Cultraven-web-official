/**
 * One-off copy update — `pnpm --filter @shop/web db:update-copy`            (preview only, changes nothing)
 *                       `pnpm --filter @shop/web db:update-copy -- --apply`  (writes, after saving a backup)
 *
 * The storefront reads its wording (menu, headings, hero text, product descriptions) from MongoDB. db:seed only fills in
 * content that is missing, so the new store-style wording in seed-cms.mjs never reaches an existing database.
 * This script rewrites the OLD seed wording to the NEW wording in place, using exact text matches, so anything
 * you edited yourself in the Admin panel is left alone.
 *
 * --apply first writes every original document it is about to change to scripts/copy-backup-<time>.json.
 */
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const here = path.dirname(fileURLToPath(import.meta.url));
for (const file of [path.join(here, "../.env"), path.join(here, "../.env.local")]) {
  if (!fs.existsSync(file)) continue;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}
const APPLY = process.argv.includes("--apply");

/** exact: the whole text must equal `from`. keys: only touch these CMS sections. Otherwise `from` is replaced wherever it occurs. */
const PAIRS = [
  { from: "ACID STATE DROP IS LIVE", to: "NEW ARRIVALS ARE LIVE", exact: true },
  { from: "DROPS", to: "COLLECTIONS", exact: true, keys: ["site.nav"] },
  { from: "The Culture Files (Blog)", to: "Style Blog", exact: true },
  { from: "The Cult", to: "Company", exact: true, keys: ["site.footer"] },
  { from: "Just Landed", to: "Just In", exact: true, keys: ["home.newDrop"] },
  { from: "New Drop", to: "New Arrivals", exact: true, keys: ["home.newDrop"] },
  { from: "The Ones Everyone Wants.", to: "Best Sellers", exact: true, keys: ["home.bestsellers"] },
  { from: "Worn by the Culture.", to: "Styled by Our Customers", exact: true, keys: ["home.community"] },
  { from: "THE CULTURE", to: "WHY CULTRAVEN", exact: true, keys: ["home.brandStory"] },
  { from: "Clothes aren't just\nwhat you wear.", to: "Premium quality.\nDelivered to your door.", exact: true, keys: ["home.brandStory"] },
  {
    from: "They're how you move through the world. CULTRAVEN is built for\nthe generation that refuses to be defined by anyone else's rules.",
    to: "260 GSM heavyweight cotton, pre-washed fits and easy 7-day returns. Free delivery above ₹1,999 and Cash on Delivery available across India.",
    exact: true, keys: ["home.brandStory"],
  },
  { from: "EXPLORE THE STORY", to: "ABOUT CULTRAVEN", exact: true, keys: ["home.brandStory"] },
  { from: "The cult on concrete.", to: "Made for everyday city wear." },
  { from: "From 1980s rock culture to Gen-Z streetwear", to: "From 1980s rock culture to today's streetwear" },
  { from: "More drops. More stories.", to: "More collections. More stories." },
  { from: "new drops, updated silhouettes and limited editions.", to: "new arrivals, updated fits and limited editions." },
  { from: "CULTRAVEN DHARMA Collection — Gen-Z Streetwear India", to: "CULTRAVEN DHARMA Collection — Oversized T-Shirts & Hoodies", exact: true },
  {
    from: "DHARMA EP01 — 260 GSM heavyweight cotton. Mythic screen-prints. Built for those who create their own identity.",
    to: "DHARMA EP01 — 260 GSM heavyweight cotton with premium screen-prints. Free delivery above ₹1,999.", exact: true,
  },
  { from: "SHOP THE DROP", to: "SHOP NOW", exact: true },
  // Trending links that pointed at products that do not exist
  { from: "/products/dragon-blood-graphic-tee", to: "/products/dragon-blood-graphic-charcoal", exact: true, keys: ["home.trending"] },
  { from: "/products/dharma-ep01-hoodie", to: "/products/dharma-graphic-hoodie-stone", exact: true, keys: ["home.trending"] },
  { from: "/products/raven-cargo-pants", to: "/products/raven-cargo-military-olive", exact: true, keys: ["home.trending"] },
  {
    from: "260 GSM heavyweight cotton built for the streets. Oversized fit, pre-washed texture and graphics made for those who create their own identity.",
    to: "260 GSM heavyweight cotton with an oversized fit, pre-washed texture and premium screen-printed graphics.", exact: true,
  },
];

function rewrite(str, sectionKey, where, log) {
  let out = str;
  for (const p of PAIRS) {
    if (p.keys && !p.keys.includes(sectionKey)) continue;
    if (p.exact ? out === p.from : out.includes(p.from)) {
      const next = p.exact ? p.to : out.split(p.from).join(p.to);
      log.push({ where, from: out, to: next });
      out = next;
    }
  }
  return out;
}

function walk(value, sectionKey, where, log) {
  if (typeof value === "string") return rewrite(value, sectionKey, where, log);
  if (Array.isArray(value)) return value.map((v, i) => walk(v, sectionKey, `${where}[${i}]`, log));
  if (value && typeof value === "object" && !(value instanceof Date) && value.constructor?.name !== "ObjectId") {
    const o = {};
    for (const [k, v] of Object.entries(value)) o[k] = walk(v, sectionKey, `${where}.${k}`, log);
    return o;
  }
  return value;
}

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set (apps/web/.env)");
try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
} catch (e) {
  if (!/querySrv/.test(String(e.message))) throw e;
  const servers = (process.env.MONGODB_DNS_SERVERS || "8.8.8.8,1.1.1.1").split(",").map((s) => s.trim());
  dns.setServers(servers);
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
}
const db = mongoose.connection.db;

// collection → [fields to scan]; null = the whole document
const TARGETS = [
  ["cmssections", ["data"]],
  ["herobanners", ["altText", "eyebrow", "headline", "subheadline", "ctaLabel"]],
  ["shoplooks", null],
  ["products", ["description"]],
];

const backups = [];
const writes = [];
let total = 0;
for (const [coll, fields] of TARGETS) {
  for await (const doc of db.collection(coll).find({})) {
    const sectionKey = coll === "cmssections" ? doc.key : "";
    const set = {};
    const log = [];
    for (const f of fields ?? Object.keys(doc).filter((k) => !["_id", "createdAt", "updatedAt", "__v"].includes(k))) {
      if (!(f in doc)) continue;
      const before = log.length;
      const next = walk(doc[f], sectionKey, `${coll}${sectionKey ? ":" + sectionKey : ""}.${f}`, log);
      if (log.length > before) set[f] = next;
    }
    if (!log.length) continue;
    total += log.length;
    for (const c of log) console.log(`${c.where}\n    - ${JSON.stringify(c.from).slice(0, 150)}\n    + ${JSON.stringify(c.to).slice(0, 150)}`);
    backups.push({ collection: coll, _id: doc._id, original: Object.fromEntries(Object.keys(set).map((f) => [f, doc[f]])) });
    writes.push({ coll, _id: doc._id, set });
  }
}

console.log(`\n${total} text change(s) in ${writes.length} document(s).`);
if (!APPLY) {
  console.log("Preview only - nothing was written. Re-run with --apply to save these changes (a backup file is written first).");
} else if (writes.length) {
  const file = path.join(here, `copy-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, JSON.stringify(backups, null, 2));
  console.log(`Backup of the originals: ${file}`);
  for (const w of writes) await db.collection(w.coll).updateOne({ _id: w._id }, { $set: { ...w.set, updatedAt: new Date() } });
  console.log("Applied.");
}
await mongoose.disconnect();
