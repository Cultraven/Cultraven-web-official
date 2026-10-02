/**
 * Seed per-size pricing on existing products.
 * Run:  node apps/web/scripts/seed-size-prices.mjs
 *
 * Adds realistic size-based price overrides (S cheaper, XL costs more) so
 * the product page shows live price changes when a customer selects a size.
 * Safe to re-run — only updates products that still have sizeOptions = [].
 * Pass --force to overwrite even products that already have size options set.
 */
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

const FORCE = process.argv.includes("--force");

if (!process.env.MONGODB_URI) {
  console.error("❌  MONGODB_URI not set. Make sure apps/web/.env exists.");
  process.exit(1);
}

/** Returns sizeOptions for a given base price (paise). Pricing tiers:
 *  S  → -5%   M  → base   L  → base   XL  → +8%   XXL → +12%
 *  All other sizes (Free Size, OS, etc.) → no override (use base). */
function buildSizeOptions(sizes, basePricePaise, baseMrpPaise) {
  const TIER = { S: -0.05, XS: -0.08, M: 0, L: 0, XL: 0.08, XXL: 0.12, "2XL": 0.12, "3XL": 0.16 };
  const out = [];
  for (const size of sizes) {
    const pct = TIER[size];
    if (pct === undefined || pct === 0) continue; // no override needed for 0-diff sizes
    const pricePaise = Math.round(basePricePaise * (1 + pct) / 100) * 100; // round to nearest ₹1
    const mrpPaise   = Math.round(baseMrpPaise  * (1 + pct) / 100) * 100;
    out.push({ size, pricePaise, mrpPaise });
  }
  return out;
}

const ProductSchema = new mongoose.Schema(
  { title: String, slug: String, pricePaise: Number, mrpPaise: Number,
    sizes: [String], sizeOptions: { type: mongoose.Schema.Types.Mixed, default: [] } },
  { strict: false, timestamps: true }
);
const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅  Connected to MongoDB\n");

  const products = await Product.find({}).lean();
  console.log(`Found ${products.length} product(s).\n`);

  let updated = 0, skipped = 0;

  for (const p of products) {
    const hasSizeOpts = Array.isArray(p.sizeOptions) && p.sizeOptions.length > 0;
    if (hasSizeOpts && !FORCE) {
      console.log(`  ⏭  ${p.title} — already has per-size pricing, skipping (use --force to overwrite)`);
      skipped++;
      continue;
    }

    const sizes = Array.isArray(p.sizes) ? p.sizes.filter(Boolean) : [];
    if (!sizes.length) {
      console.log(`  ⏭  ${p.title} — no sizes defined, skipping`);
      skipped++;
      continue;
    }

    const base  = Number(p.pricePaise) || 0;
    const mrp   = Number(p.mrpPaise ?? p.pricePaise) || base;
    const opts  = buildSizeOptions(sizes, base, mrp);

    if (!opts.length) {
      console.log(`  ⏭  ${p.title} — sizes ${sizes.join(", ")} have no tier overrides (all same price)`);
      skipped++;
      continue;
    }

    await Product.findByIdAndUpdate(p._id, { $set: { sizeOptions: opts } });

    const preview = opts.map(o => `${o.size}=₹${o.pricePaise/100}`).join(", ");
    console.log(`  ✅  ${p.title}  [${sizes.join(", ")}]`);
    console.log(`      → ${preview}\n`);
    updated++;
  }

  console.log(`\nDone — ${updated} updated, ${skipped} skipped.`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
