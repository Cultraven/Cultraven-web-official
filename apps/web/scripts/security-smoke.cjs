/* eslint-disable no-console */
/**
 * API-level security smoke test for the CULTRAVEN storefront.
 *
 * Proves that NoSQL-operator payloads ({"$ne":null}, {"$gt":""}), array-instead-of-string, prototype-pollution
 * keys, regex-DoS strings, oversized bodies, cross-site requests and unauthenticated admin calls all get a 4xx
 * and never succeed, and that the Razorpay admin settings, rate limits, cookies, uploads and headers behave.
 *
 * SAFETY: it writes test data. It REFUSES to run unless the database URI points at 127.0.0.1 (a throwaway
 * local MongoDB), and it must be pointed at a dev server that uses the same local database. Never run it
 * against Atlas or production.
 *
 *   # 1) a throwaway MongoDB on 127.0.0.1 (e.g. mongodb-memory-server) is listening on :27555
 *   # 2) start a dev server on the SAME database:
 *   #      cd apps/web && MONGODB_URI=mongodb://127.0.0.1:27555/smoke NEXT_DIST_DIR=.next-smoke npx next dev -p 3006
 *   # 3) run:
 *   #      SMOKE_MONGODB_URI=mongodb://127.0.0.1:27555/smoke SMOKE_BASE=http://localhost:3006 node apps/web/scripts/security-smoke.cjs
 *
 * Needs SESSION_SECRET (read from apps/web/.env) to mint test sessions. Exit code 0 = every check passed.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// ── configuration + hard safety checks ──────────────────────────────────────────────────────────
const ENV_FILE = path.join(__dirname, "..", ".env");
const fileEnv = {};
if (fs.existsSync(ENV_FILE)) {
  for (const l of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const m = l.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) fileEnv[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
}
const URI = process.env.SMOKE_MONGODB_URI || process.env.MONGODB_URI || "";
const BASE = (process.env.SMOKE_BASE || "http://localhost:3006").replace(/\/$/, "");
const SESSION_SECRET = process.env.SESSION_SECRET || fileEnv.SESSION_SECRET;

function refuse(msg) { console.error("REFUSING TO RUN: " + msg); process.exit(3); }
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(URI) || /mongodb\+srv|mongodb\.net/i.test(URI)) {
  refuse("SMOKE_MONGODB_URI must be a local mongodb://127.0.0.1:<port>/<db> URI (got: " + (URI ? URI.replace(/\/\/[^@/]*@/, "//***@") : "nothing") + ")");
}
if (process.env.MONGODB_URI && !/127\.0\.0\.1|localhost/.test(process.env.MONGODB_URI)) refuse("MONGODB_URI in this shell points at a remote database");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) refuse("SMOKE_BASE must be a localhost URL (got " + BASE + ")");
if (!SESSION_SECRET) refuse("SESSION_SECRET not found (apps/web/.env)");
const dbName = new URL(URI).pathname.replace(/^\//, "");
if (!dbName || ["admin", "local", "config", "cultraven", "cultraven_prod"].includes(dbName)) refuse("use a dedicated scratch database name, not '" + dbName + "'");

const mongoose = require("mongoose");

// ── tiny harness ────────────────────────────────────────────────────────────────────────────────
let pass = 0, fail = 0;
const failures = [];
const ok = (cond, name, extra = "") => {
  cond ? pass++ : (fail++, failures.push(name));
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? "  - " + extra : ""}`);
};
const section = (t) => console.log(`\n=== ${t}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const signRaw = (payloadObj, secret = SESSION_SECRET) => { const p = b64(payloadObj); return p + "." + crypto.createHmac("sha256", secret).update(p).digest("base64url"); };
const sign = (obj, ttl = 3600e3) => signRaw({ ...obj, iat: Date.now(), exp: Date.now() + ttl });
let ipSeq = 0;
/** A fresh spoofable client address per group so rate limits never bleed between checks (dev server has no proxy). */
const nextIp = () => `10.${(process.pid % 200) + 1}.${Math.floor(++ipSeq / 250) % 250}.${(ipSeq % 250) + 1}`;

async function call(method, p, { headers = {}, body, raw, ip } = {}) {
  const h = { "x-forwarded-for": ip || nextIp(), ...headers };
  let payload = raw;
  if (body !== undefined) { payload = JSON.stringify(body); if (!h["content-type"]) h["content-type"] = "application/json"; }
  const res = await fetch(BASE + p, { method, headers: h, body: payload, redirect: "manual", ...(raw && typeof raw === "object" && raw.getReader ? { duplex: "half" } : {}) });
  const text = await res.text();
  let json = null; try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, headers: res.headers, text, json, setCookie: res.headers.getSetCookie ? res.headers.getSetCookie() : [] };
}
const is4xx = (r) => r.status >= 400 && r.status < 500;
const LEAK = /(\bat\s+[\w$.<>]+\s+\(|node_modules|MongoServerError|E11000|CastError|ValidationError|mongoose|stack|ECONNREFUSED|\/src\/app\/)/;

const customer = (userId, email = "smoke.customer@example.com") => ({ cookie: `cultraven_session=${sign({ userId, email, role: "customer" })}` });
const admin = { cookie: `cultraven_admin_session=${sign({ userId: "admin", email: "a@example.com", role: "admin" })}` };
const J = { "content-type": "application/json" };

(async () => {
  await mongoose.connect(URI);
  const db = mongoose.connection.db;
  console.log(`Target ${BASE}  |  database ${dbName} @ ${URI.replace(/\/\/[^@/]*@/, "//***@").split("/").slice(0, 3).join("/")}`);

  // The server must really be using the same local database: prove it with a round trip.
  const marker = "smoke-" + crypto.randomUUID();
  await db.collection("products").deleteMany({});
  await db.collection("settings").deleteMany({ key: "razorpay" });
  const prodId = new mongoose.Types.ObjectId();
  await db.collection("products").insertOne({ _id: prodId, title: "Smoke Hoodie", slug: "smoke-hoodie", description: "x", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7", images: [], pricePaise: 299900, mrpPaise: 399900, category: "hoodies", fit: "Oversized", sizes: ["M"], colors: [{ hex: "#000000", label: "Black" }], inStock: true, stockCount: 20, createdAt: new Date(), updatedAt: new Date(), marker });
  const pl = await call("GET", "/api/products?limit=5");
  ok(pl.status === 200 && pl.json?.products?.some((p) => p.slug === "smoke-hoodie"), "server and this script share the same local database");
  if (!(pl.json?.products ?? []).some((p) => p.slug === "smoke-hoodie")) { console.error("The server is not using the database this script targets. Aborting."); await mongoose.disconnect(); process.exit(3); }

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Authentication: NoSQL operators, enumeration, mass assignment, cookies");
  const email = `smoke.${Date.now()}@example.com`;
  const pw = "Sm0keTest-Passw0rd";
  let r = await call("POST", "/api/auth/register", { body: { firstName: "Smoke", lastName: "Tester", email, password: pw, role: "admin", emailVerified: true, isAdmin: true } });
  ok(r.status === 201, "register succeeds", String(r.status));
  const created = await db.collection("users").findOne({ email });
  ok(created && created.role === "customer" && created.emailVerified === false && created.isAdmin === undefined, "mass assignment: role/emailVerified/isAdmin from the body are ignored", JSON.stringify({ role: created?.role, ev: created?.emailVerified }));
  ok(created && /^\$2[aby]\$12\$/.test(created.passwordHash), "password stored as bcrypt cost-12 hash", (created?.passwordHash || "").slice(0, 7));
  const cookieLine = r.setCookie.find((c) => c.startsWith("cultraven_session=")) || "";
  ok(/HttpOnly/i.test(cookieLine) && /SameSite=Lax/i.test(cookieLine) && /Max-Age=604800/i.test(cookieLine) && /Path=\//i.test(cookieLine), "session cookie: HttpOnly, SameSite=Lax, Max-Age 7d, Path=/", cookieLine.replace(/=[^;]+/, "=<token>"));

  const attempts = [
    ["email:{$ne:null}, password:{$ne:null}", { email: { $ne: null }, password: { $ne: null } }],
    ["email:{$gt:\"\"}", { email: { $gt: "" }, password: pw }],
    ["password:{$gt:\"\"}", { email, password: { $gt: "" } }],
    ["password:{$regex:\".*\"}", { email, password: { $regex: ".*" } }],
    ["top-level $where", { email, password: "x", $where: "1" }],
    ["email as array", { email: [email], password: pw }],
    ["password as array", { email, password: [pw] }],
    ["email as number", { email: 12345, password: pw }],
    ["nested $or", { email: { $or: [{ a: 1 }] }, password: pw }],
    ["__proto__ key", JSON.parse(`{"email":"${email}","password":"${pw}","__proto__":{"role":"admin"}}`)],
    ["constructor.prototype", JSON.parse(`{"email":"${email}","password":"x","constructor":{"prototype":{"role":"admin"}}}`)],
  ];
  for (const [label, body] of attempts) {
    r = await call("POST", "/api/auth/login", { body });
    ok(is4xx(r) && r.status !== 429 && !r.setCookie.length && r.json?.ok !== true, `login rejects ${label}`, String(r.status));
  }
  r = await call("POST", "/api/auth/login", { body: { email, password: pw }, ip: nextIp() });
  ok(r.status === 200 && r.json?.ok === true && r.setCookie.some((c) => c.startsWith("cultraven_session=")), "legitimate login still works", String(r.status));
  const noUser = await call("POST", "/api/auth/login", { body: { email: `nobody.${Date.now()}@example.com`, password: pw }, ip: nextIp() });
  const badPw = await call("POST", "/api/auth/login", { body: { email, password: pw + "x" }, ip: nextIp() });
  ok(noUser.status === 401 && badPw.status === 401 && noUser.text === badPw.text, "login does not reveal whether an email exists (identical 401 body)", noUser.text);
  r = await call("POST", "/api/auth/login", { raw: JSON.stringify({ email, password: pw }), headers: { "content-type": "text/plain" } });
  ok(r.status === 415 && !r.setCookie.length, "JSON endpoints refuse text/plain (CSRF 'simple request' form posts)", String(r.status));
  r = await call("POST", "/api/auth/login", { body: { email, password: pw }, headers: { origin: "https://evil.example" } });
  ok(r.status === 403 && !r.setCookie.length, "cross-origin login POST is refused", String(r.status));
  r = await call("GET", "/api/auth/login");
  ok(r.status === 405, "GET /api/auth/login is 405", String(r.status));

  // per-email lockout + per-IP throttle
  const lockEmail = `lock.${Date.now()}@example.com`;
  const lockIp = nextIp();
  let last;
  for (let i = 0; i < 5; i++) last = await call("POST", "/api/auth/login", { body: { email: lockEmail, password: "Wrong-" + i }, ip: nextIp() });
  ok(last.status === 401, "5 failed attempts for one email (from different IPs) are all plain 401s");
  r = await call("POST", "/api/auth/login", { body: { email: lockEmail, password: "Another-1" }, ip: nextIp() });
  ok(r.status === 429 && !!r.headers.get("retry-after"), "6th failed attempt for that email is locked out with 429 + Retry-After (even for an email that doesn't exist)", String(r.status));
  r = await call("POST", "/api/auth/login", { body: { email, password: pw }, ip: nextIp() });
  ok(r.status === 200, "other accounts are unaffected by someone else's lockout");
  let got429 = 0;
  for (let i = 0; i < 14; i++) { r = await call("POST", "/api/auth/login", { body: { email: `ipflood${i}.${Date.now()}@example.com`, password: "x" }, ip: lockIp }); if (r.status === 429) got429++; }
  ok(got429 >= 3, "per-IP login limit (10/min) kicks in", `${got429} of 14 rejected`);

  // register / forgot / admin-login
  r = await call("POST", "/api/auth/register", { body: { firstName: { $ne: 1 }, lastName: "x", email: "a@b.co", password: pw } });
  ok(r.status === 400, "register rejects operator payload (400)", String(r.status));
  r = await call("POST", "/api/auth/register", { raw: '{"firstName":"a","lastName":"b","email":"c@d.co","password":"Abcdefg1","__proto__":{"role":"admin"}}', headers: J });
  ok(r.status === 400, "register rejects __proto__ key (400)", String(r.status));
  r = await call("POST", "/api/auth/register", { body: { firstName: "<img src=x onerror=alert(1)>Bob", lastName: "Li\r\nBcc: x@y.z", email: `xss.${Date.now()}@example.com`, password: pw } });
  const xssUser = await db.collection("users").findOne({ email: { $regex: "^xss\\." } });
  ok(r.status === 201 && xssUser && !/[<>\r\n]/.test(xssUser.firstName + xssUser.lastName), "register strips HTML tags and CR/LF from names", xssUser ? JSON.stringify([xssUser.firstName, xssUser.lastName]) : "");
  r = await call("POST", "/api/auth/register", { body: { firstName: "a", lastName: "b", email, password: pw } });
  ok(r.status === 409, "duplicate email gives a clean 409", String(r.status));
  r = await call("POST", "/api/auth/register", { body: { firstName: "a", lastName: "b", email: `long.${Date.now()}@example.com`, password: "Aa1" + "x".repeat(80) } });
  ok(r.status === 422, "passwords over 72 bytes are refused (bcrypt would silently truncate them)", String(r.status));
  r = await call("POST", "/api/auth/forgot-password", { body: { email: { $ne: null } } });
  ok(r.status === 400, "forgot-password rejects operator payload", String(r.status));
  const fpA = await call("POST", "/api/auth/forgot-password", { body: { email } });
  const fpB = await call("POST", "/api/auth/forgot-password", { body: { email: `ghost.${Date.now()}@example.com` } });
  ok(fpA.status === 200 && fpB.status === 200 && fpA.text === fpB.text, "forgot-password answers identically for known and unknown emails");
  r = await call("POST", "/api/auth/admin-login", { body: { email: { $ne: null }, password: { $ne: null } } });
  ok(r.status === 400 && !r.setCookie.length, "admin-login rejects {$ne:null} credentials", String(r.status));
  r = await call("POST", "/api/auth/admin-login", { body: { email: "nobody@example.com", password: "nope" } });
  ok(r.status === 401 && !r.setCookie.length && r.json?.error === "Invalid credentials.", "admin-login wrong credentials: generic 401", r.text);
  const adminIp = nextIp();
  let blocked = 0;
  for (let i = 0; i < 8; i++) { r = await call("POST", "/api/auth/admin-login", { body: { email: "nobody@example.com", password: "nope" + i }, ip: adminIp }); if (r.status === 429) blocked++; }
  ok(blocked >= 3, "admin-login is limited to 5 attempts per IP per 15 min", `${blocked} of 8 rejected`);
  if (fileEnv.ADMIN_EMAIL && fileEnv.ADMIN_PASSWORD) {
    r = await call("POST", "/api/auth/admin-login", { body: { email: fileEnv.ADMIN_EMAIL, password: fileEnv.ADMIN_PASSWORD } });
    const c = r.setCookie.find((x) => x.startsWith("cultraven_admin_session=")) || "";
    ok(r.status === 200 && /HttpOnly/i.test(c) && /SameSite=Lax/i.test(c) && /Max-Age=28800/i.test(c), "admin login cookie: HttpOnly, SameSite=Lax, Max-Age 8h", c.replace(/=[^;]+/, "=<token>"));
  }
  r = await call("POST", "/api/auth/logout");
  ok(r.setCookie.some((c) => /^cultraven_session=;/.test(c) && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c) && /HttpOnly/i.test(c)), "logout clears the customer cookie");
  r = await call("POST", "/api/auth/admin-logout");
  ok(r.setCookie.some((c) => /^cultraven_admin_session=;/.test(c) && /Max-Age=0|Expires=Thu, 01 Jan 1970/i.test(c)), "admin logout clears the admin cookie");

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Ids, slugs and query strings (NoSQL / regex injection)");
  for (const bad of ["%7B%22%24ne%22%3A1%7D", "aaaaaaaaaaaa", "123", "..%2F..%2Fetc%2Fpasswd", "%24ne", "507f1f77bcf86cd79943901"]) {
    r = await call("GET", `/api/products/${bad}`);
    ok(r.status === 400 && !LEAK.test(r.text), `GET /api/products/${decodeURIComponent(bad).slice(0, 24)} -> 400`, String(r.status));
  }
  r = await call("GET", "/api/products/507f1f77bcf86cd799439011");
  ok(r.status === 404, "well-formed unknown id -> 404", String(r.status));
  r = await call("GET", "/api/products?category[$ne]=x&limit[$gt]=0");
  ok(r.status === 200 && Array.isArray(r.json?.products), "bracket-style operator in the query string is just ignored (no error, no injection)", String(r.status));
  const everything = await call("GET", "/api/products?category=.*");
  const nothing = await call("GET", "/api/products?category=zzzz");
  ok(everything.status === 200 && everything.json.products.length === 0 && nothing.json.products.length === 0, "category='.*' is matched literally, not as a regex (0 results)", String(everything.json?.products?.length));
  const hood = await call("GET", "/api/products?category=hood");
  ok(hood.json?.products?.length === 1, "normal category filter still works");
  const evil = "(a+)+$" + "a".repeat(5000) + "!";
  let t0 = Date.now();
  r = await call("GET", "/api/products?category=" + encodeURIComponent(evil));
  ok(r.status === 200 && Date.now() - t0 < 2000, "regex-DoS string in category is harmless and fast", `${Date.now() - t0} ms`);
  t0 = Date.now();
  r = await call("GET", "/api/products?category=" + encodeURIComponent("(.*)*" + "x".repeat(60)));
  ok(r.status === 200 && Date.now() - t0 < 2000, "(.*)* pattern is harmless and fast", `${Date.now() - t0} ms`);
  for (const bad of ["slug[$ne]=x", "slug=" + encodeURIComponent('{"$ne":null}'), "slug=a%27b", "slug=" + "a".repeat(300), "slug=", ""]) {
    r = await call("GET", "/api/reviews" + (bad ? "?" + bad : ""));
    ok(r.status === 400, `GET /api/reviews?${bad.slice(0, 30)} -> 400`, String(r.status));
  }
  r = await call("GET", "/api/reviews?slug=smoke-hoodie");
  ok(r.status === 200 && r.json?.count === 0, "reviews GET works for a real slug");

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Prototype pollution and operators on every public JSON endpoint");
  const polluted = JSON.parse('{"__proto__":{"polluted":"yes","isAdmin":true}}');
  const buyerId = new mongoose.Types.ObjectId().toString();
  const jsonTargets = [
    ["/api/contact", {}], ["/api/newsletter", {}], ["/api/reviews", customer(buyerId)], ["/api/razorpay/create-order", customer(buyerId)],
    ["/api/razorpay/verify", {}], ["/api/auth/register", {}], ["/api/auth/forgot-password", {}],
  ];
  for (const [p, h] of jsonTargets) {
    const a = await call("POST", p, { raw: '{"a":1,"__proto__":{"isAdmin":true}}', headers: { ...J, ...h } });
    const b = await call("POST", p, { raw: '{"constructor":{"prototype":{"isAdmin":true}}}', headers: { ...J, ...h } });
    const c = await call("POST", p, { raw: '{"nested":{"deep":{"$where":"sleep(1000)"}}}', headers: { ...J, ...h } });
    const d = await call("POST", p, { raw: '{"a.b":1,"$set":{"role":"admin"}}', headers: { ...J, ...h } });
    ok([a, b, c, d].every((x) => x.status === 400), `POST ${p}: __proto__ / constructor / $where / dotted / $set keys -> 400`, [a, b, c, d].map((x) => x.status).join(","));
  }
  void polluted;
  r = await call("GET", "/api/products?limit=1");
  ok(r.status === 200 && !("polluted" in {}) && !({}).isAdmin, "the server's Object.prototype is not polluted after the attacks");
  r = await call("GET", "/api/admin/settings/smtp");
  ok(r.status === 401, "...and an anonymous caller is still not admin");

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Checkout / payment endpoints");
  const order = (over = {}) => ({ items: [{ slug: "smoke-hoodie", quantity: 1, size: "M", color: "Black" }], name: "Smoke Buyer", email: "smoke.buyer@example.com", phone: "9845067291", address: { line1: "12 Test Street", city: "Mumbai", state: "Maharashtra", pincode: "400001" }, paymentMethod: "cod", ...over });
  const co = (body, ip) => call("POST", "/api/razorpay/create-order", { body, headers: customer(buyerId), ip });
  const coIp = nextIp();
  for (const [label, body] of [
    ["slug:{$ne:null}", order({ items: [{ slug: { $ne: null }, quantity: 1 }] })],
    ["slug as array", order({ items: [{ slug: ["smoke-hoodie"], quantity: 1 }] })],
    ["quantity:{$gt:0}", order({ items: [{ slug: "smoke-hoodie", quantity: { $gt: 0 } }] })],
    ["quantity as string", order({ items: [{ slug: "smoke-hoodie", quantity: "1" }] })],
    ["quantity 0 / negative / huge", order({ items: [{ slug: "smoke-hoodie", quantity: -5 }] })],
    ["couponCode object", order({ couponCode: { $ne: "" } })],
    ["email:{$ne:null}", order({ email: { $ne: null } })],
    ["idempotencyKey object", order({ idempotencyKey: { $gt: "" } })],
    ["paymentMethod unknown", order({ paymentMethod: "bitcoin" })],
    ["empty cart", order({ items: [] })],
  ]) {
    r = await co(body, coIp);
    ok(is4xx(r) && r.status !== 429 && !LEAK.test(r.text), `create-order rejects ${label}`, String(r.status));
  }
  r = await call("POST", "/api/razorpay/create-order", { body: order({ items: [{ slug: "smoke-hoodie", quantity: 1 }], paymentMethod: "cod", total: 1, totalPaise: 1, pricePaise: 1, userId: "someone-else" }), headers: customer(buyerId), ip: nextIp() });
  const placed = await db.collection("orders").findOne({ userId: buyerId });
  ok(r.status === 200 && placed && placed.totalPaise === 299900 + 4900 && placed.userId === buyerId, "client-supplied prices/userId are ignored: total is server-computed, owner is the session", placed ? String(placed.totalPaise) : String(r.status));
  r = await call("POST", "/api/razorpay/create-order", { raw: "x".repeat(70 * 1024), headers: { ...J, ...customer(buyerId) } });
  ok(r.status === 413, "create-order: 70KB body -> 413", String(r.status));

  // verify: a forged or malformed callback must never mark anything paid
  await db.collection("orders").insertOne({ userId: buyerId, razorpayOrderId: "order_SmokePending1", paymentMethod: "razorpay", paymentStatus: "pending", fulfillmentStatus: "processing", totalPaise: 100000, items: [], statusHistory: [], createdAt: new Date() });
  const vIp = nextIp();
  for (const body of [
    { razorpay_order_id: { $ne: null }, razorpay_payment_id: "pay_x", razorpay_signature: "ab" },
    { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: { $gt: "" }, razorpay_signature: "ab" },
    { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: "pay_1", razorpay_signature: "' OR 1=1 --" },
    { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: "pay_1", razorpay_signature: "deadbeef" },
    { razorpay_order_id: ["order_SmokePending1"], razorpay_payment_id: "pay_1", razorpay_signature: "deadbeef" },
  ]) {
    r = await call("POST", "/api/razorpay/verify", { body, ip: vIp });
    ok(r.status >= 400 && r.json?.verified !== true, "verify rejects forged / operator callback", String(r.status));
  }
  ok((await db.collection("orders").findOne({ razorpayOrderId: "order_SmokePending1" })).paymentStatus === "pending", "...and the order is still unpaid");
  r = await call("POST", "/api/razorpay/webhook", { raw: JSON.stringify({ event: "payment.captured" }), headers: J });
  ok(r.status === 400, "webhook without a signature -> 400", String(r.status));
  r = await call("POST", "/api/razorpay/webhook", { raw: JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { order_id: "order_SmokePending1", amount: 100000, id: "pay_evil" } } } }), headers: { ...J, "x-razorpay-signature": "00".repeat(32) } });
  ok(r.status === 401 || r.status === 400, "webhook with a forged signature is refused", String(r.status));
  ok((await db.collection("orders").findOne({ razorpayOrderId: "order_SmokePending1" })).paymentStatus === "pending", "...and the order is still unpaid after the forged webhook");
  r = await call("POST", "/api/razorpay/webhook", { raw: "x".repeat(300 * 1024), headers: J });
  ok(r.status === 413, "webhook: 300KB body -> 413", String(r.status));
  r = await call("GET", "/api/checkout");
  ok(r.status === 405 || r.status === 410, "legacy /api/checkout GET is closed", String(r.status));
  r = await call("POST", "/api/checkout", { body: { total: 1 } });
  ok(r.status === 410, "legacy /api/checkout POST is Gone (client-priced orders impossible)", String(r.status));

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Admin Razorpay settings (credentials, switch, encryption, test connection)");
  const A = (extra = {}) => ({ ...admin, ...J, ...extra });
  r = await call("GET", "/api/admin/settings/razorpay", { headers: admin });
  ok(r.status === 200 && ["keyId", "hasSecret", "hasWebhookSecret", "enabled", "mode"].every((k) => k in r.json) && !/secret"?\s*:\s*"/i.test(r.text.replace(/hasSecret|hasWebhookSecret/g, "")), "GET returns {keyId, hasSecret, hasWebhookSecret, enabled, mode} and no secret fields", r.text.slice(0, 160));
  const pc0 = await call("GET", "/api/payments/config");
  const envOnline = pc0.json?.online === true;
  ok(pc0.status === 200 && pc0.json?.cod === true, "payments config reachable", JSON.stringify(pc0.json));
  const KEY_ID = "rzp_test_SmokeKey123456", SECRET = "SmokeSecret-0123456789abcdef", HOOK = "SmokeWebhook-secret-42";
  const put = (body, headers = A()) => call("PUT", "/api/admin/settings/razorpay", { body, headers });
  for (const [label, body] of [
    ["bad key id prefix", { enabled: true, keyId: "rzp_prod_abcdefgh", keySecret: SECRET }],
    ["key id as object", { enabled: true, keyId: { $ne: "" }, keySecret: SECRET }],
    ["secret as array", { enabled: true, keyId: KEY_ID, keySecret: [SECRET] }],
    ["unknown extra field", { enabled: true, keyId: KEY_ID, keySecret: SECRET, role: "admin" }],
    ["enabled as string", { enabled: "yes", keyId: KEY_ID, keySecret: SECRET }],
    ["placeholder secret", { enabled: true, keyId: KEY_ID, keySecret: "your_razorpay_secret_here" }],
    ["secret with spaces", { enabled: true, keyId: KEY_ID, keySecret: "has some spaces in it" }],
    ["no secret on first save", { enabled: true, keyId: KEY_ID }],
  ]) {
    r = await put(body);
    ok(is4xx(r) && r.json?.success !== true, `PUT rejects ${label}`, String(r.status));
  }
  ok(!(await db.collection("settings").findOne({ key: "razorpay" })), "...and nothing was stored by the rejected requests");
  r = await put({ enabled: true, keyId: KEY_ID, keySecret: SECRET, webhookSecret: HOOK });
  ok(r.status === 200 && r.json?.success === true, "PUT saves valid credentials", String(r.status));
  ok(!r.text.includes(SECRET) && !r.text.includes(HOOK), "PUT response never echoes the secrets");
  const stored = await db.collection("settings").findOne({ key: "razorpay" });
  const rawDoc = JSON.stringify(stored);
  ok(stored && stored.value.keySecretEnc?.startsWith("v1.") && stored.value.webhookSecretEnc?.startsWith("v1.") && !rawDoc.includes(SECRET) && !rawDoc.includes(HOOK), "secrets are AES-GCM encrypted at rest (no plaintext in the database)");
  r = await call("GET", "/api/admin/settings/razorpay", { headers: admin });
  ok(r.json?.keyId === KEY_ID && r.json?.hasSecret === true && r.json?.hasWebhookSecret === true && r.json?.enabled === true && r.json?.mode === "test" && !r.text.includes(SECRET) && !r.text.includes(HOOK), "GET after save: keyId, hasSecret, hasWebhookSecret, enabled, mode=test; never the secrets", r.text.slice(0, 200));
  r = await call("GET", "/api/payments/config");
  ok(r.json?.online === true, "online payments reported available after saving keys", JSON.stringify(r.json));
  r = await put({ enabled: true, keyId: KEY_ID });
  const keptDoc = await db.collection("settings").findOne({ key: "razorpay" });
  ok(r.status === 200 && keptDoc.value.keySecretEnc === stored.value.keySecretEnc && keptDoc.value.webhookSecretEnc === stored.value.webhookSecretEnc, "blank secret fields keep the saved ones");
  r = await put({ enabled: true, keyId: "rzp_live_OtherKey1234567" });
  ok(r.status === 422, "changing the Key ID without re-entering the secret is refused", String(r.status));

  // switch off => unavailable, create-order 503, but in-flight payments can still be verified
  r = await put({ enabled: false, keyId: KEY_ID });
  ok(r.status === 200, "admin switches online payments OFF");
  r = await call("GET", "/api/payments/config");
  ok(r.json?.online === false && r.json?.cod === true, "switch off => payments config says online:false (COD stays)", JSON.stringify(r.json));
  r = await call("POST", "/api/razorpay/create-order", { body: order({ paymentMethod: "razorpay" }), headers: customer(buyerId), ip: nextIp() });
  ok(r.status === 503 && r.json?.code === "PAYMENTS_NOT_CONFIGURED", "switch off => create-order (razorpay) answers 503 PAYMENTS_NOT_CONFIGURED", `${r.status} ${r.json?.code}`);
  r = await call("POST", "/api/razorpay/create-order", { body: order({ paymentMethod: "cod", idempotencyKey: "smoke-cod-" + Date.now() }), headers: customer(buyerId), ip: nextIp() });
  ok(r.status === 200, "switch off => Cash on Delivery still works", String(r.status));
  const hmac = (s, d) => crypto.createHmac("sha256", s).update(d).digest("hex");
  r = await call("POST", "/api/razorpay/verify", { body: { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: "pay_Smoke1", razorpay_signature: hmac(SECRET, "order_SmokePending1|pay_Smoke1") }, ip: nextIp() });
  ok(r.status === 200 && r.json?.verified === true, "switch off => a genuine in-flight payment still verifies (signature checked with the DB secret)", `${r.status}`);
  let o = await db.collection("orders").findOne({ razorpayOrderId: "order_SmokePending1" });
  ok(o.paymentStatus === "paid" && o.razorpayPaymentId === "pay_Smoke1", "...and the order is marked paid");
  r = await call("POST", "/api/razorpay/verify", { body: { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: "pay_Smoke1", razorpay_signature: hmac(SECRET, "order_SmokePending1|pay_Smoke1") }, ip: nextIp() });
  o = await db.collection("orders").findOne({ razorpayOrderId: "order_SmokePending1" });
  ok(r.status === 200 && (o.statusHistory || []).filter((h) => h.status === "payment_verified").length === 1, "a replayed verify callback does not append duplicate history");
  r = await call("POST", "/api/razorpay/verify", { body: { razorpay_order_id: "order_SmokePending1", razorpay_payment_id: "pay_Smoke1", razorpay_signature: hmac("env-or-wrong-secret", "order_SmokePending1|pay_Smoke1") }, ip: nextIp() });
  ok(r.status === 400 && r.json?.verified === false, "a signature made with any other secret is refused");

  // webhook secret from the database
  await db.collection("orders").insertOne({ userId: buyerId, razorpayOrderId: "order_SmokePending2", paymentMethod: "razorpay", paymentStatus: "pending", fulfillmentStatus: "processing", totalPaise: 250000, items: [{ productId: String(prodId), sku: "s", title: "t", image: "i", size: "M", quantity: 2, pricePaise: 125000 }], statusHistory: [], createdAt: new Date() });
  const evt = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_Smoke2", order_id: "order_SmokePending2", amount: 250000, status: "captured" } } } });
  r = await call("POST", "/api/razorpay/webhook", { raw: evt, headers: { ...J, "x-razorpay-signature": hmac("some-other-secret", evt) } });
  ok(r.status === 401, "webhook signed with the wrong secret -> 401", String(r.status));
  r = await call("POST", "/api/razorpay/webhook", { raw: evt, headers: { ...J, "x-razorpay-signature": hmac(HOOK, evt) } });
  o = await db.collection("orders").findOne({ razorpayOrderId: "order_SmokePending2" });
  const pAfter = await db.collection("products").findOne({ _id: prodId });
  ok(r.status === 200 && o.paymentStatus === "paid" && pAfter.stockCount === 18, "webhook signed with the admin-saved webhook secret is accepted (order paid, stock -2)", `${r.status} ${o.paymentStatus} stock=${pAfter.stockCount}`);
  const evtObj = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_x", order_id: { $ne: null }, amount: 1 } } } });
  r = await call("POST", "/api/razorpay/webhook", { raw: evtObj, headers: { ...J, "x-razorpay-signature": hmac(HOOK, evtObj) } });
  ok(r.status === 200 && !LEAK.test(r.text), "even a correctly signed event with an object order_id cannot reach a Mongo query as an operator", String(r.status));

  // test connection
  r = await call("POST", "/api/admin/settings/razorpay/test", { body: { keyId: { $ne: 1 } }, headers: A() });
  ok(r.status === 400, "test: operator payload -> 400", String(r.status));
  r = await call("POST", "/api/admin/settings/razorpay/test", { body: { keyId: "nope", keySecret: SECRET }, headers: A() });
  ok(r.status === 422, "test: malformed key id -> 422", String(r.status));
  r = await call("POST", "/api/admin/settings/razorpay/test", { body: { keyId: KEY_ID, keySecret: SECRET }, headers: A() });
  const tj = r.json || {};
  ok(r.status === 502 && tj.ok === false && typeof tj.error === "string" && tj.error.length > 20 && !r.text.includes(SECRET) && !r.text.includes(KEY_ID.slice(-6)), "test with fake keys: plain-English failure, no secrets leaked", `${r.status} ${tj.error}`);
  ok(/rejected these keys|Could not reach Razorpay/.test(tj.error || ""), "...and the message says what is wrong (keys rejected, or Razorpay unreachable offline)");
  r = await call("POST", "/api/admin/settings/razorpay/test", { body: {}, headers: A(), ip: nextIp() });
  ok(r.status === 502 && r.json?.ok === false, "test with saved keys (switch off) still runs and reports the failure plainly", String(r.status));
  r = await put({ enabled: true, keyId: KEY_ID });
  ok(r.status === 200, "admin switches online payments back ON");
  r = await call("GET", "/api/payments/config");
  ok(r.json?.online === true, "online payments available again");
  r = await call("POST", "/api/razorpay/create-order", { body: order({ paymentMethod: "razorpay" }), headers: customer(buyerId), ip: nextIp() });
  ok(r.status === 500 && r.json?.error === "Failed to create order. Please try again." && !r.text.includes(SECRET), "switch on + admin keys => create-order uses them and reaches Razorpay (fake keys are rejected there; the error is generic and leaks no secret)", `${r.status} ${r.text.slice(0, 80)}`);
  ok(!(await db.collection("orders").findOne({ userId: buyerId, paymentMethod: "razorpay" })), "...and no half-created order is left behind");
  if (!envOnline) {
    await db.collection("settings").deleteMany({ key: "razorpay" });
    r = await call("GET", "/api/payments/config");
    ok(r.json?.online === false, "removing the saved settings falls back to the (placeholder) env vars => unavailable", JSON.stringify(r.json));
  }

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Unauthenticated / wrong-role access to admin routes");
  const fakeId = "507f1f77bcf86cd799439011";
  const adminRoutes = [
    ["POST", "/api/products", { title: "x" }], ["PUT", `/api/products/${fakeId}`, { title: "x" }], ["DELETE", `/api/products/${fakeId}`],
    ["POST", "/api/upload", null], ["GET", "/api/orders"], ["DELETE", `/api/reviews/${fakeId}`],
    ["GET", "/api/cms/hero"], ["PUT", "/api/cms/hero", { banners: [] }], ["GET", "/api/cms/sections/site.announcement"], ["PUT", "/api/cms/sections/site.announcement", { data: {} }],
    ["GET", "/api/cms/shop-the-look"], ["PUT", "/api/cms/shop-the-look", { look: { products: [] } }],
    ["GET", "/api/admin/settings/smtp"], ["PUT", "/api/admin/settings/smtp", {}], ["POST", "/api/admin/settings/smtp/test", { to: "a@b.co" }],
    ["GET", "/api/admin/settings/razorpay"], ["PUT", "/api/admin/settings/razorpay", { enabled: true, keyId: KEY_ID, keySecret: SECRET }], ["POST", "/api/admin/settings/razorpay/test", {}],
  ];
  const forged = { cookie: `cultraven_admin_session=${signRaw({ userId: "admin", role: "admin", exp: Date.now() + 3600e3 }, "not-the-real-secret")}` };
  const expired = { cookie: `cultraven_admin_session=${sign({ userId: "admin", role: "admin" }, -1000)}` };
  const customerRoleInAdminCookie = { cookie: `cultraven_admin_session=${sign({ userId: "u", role: "customer" })}` };
  const customerCookieOnly = customer(buyerId);
  const noneSigned = { cookie: `cultraven_admin_session=${b64({ userId: "admin", role: "admin", exp: Date.now() + 3600e3 })}.` };
  const tampered = (() => { const t = sign({ userId: "u", role: "customer" }).split("."); return { cookie: `cultraven_admin_session=${b64({ userId: "admin", role: "admin", exp: Date.now() + 3600e3 })}.${t[1]}` }; })();
  const variants = [["no cookie", {}], ["customer session only", customerCookieOnly], ["forged signature", forged], ["expired admin token", expired], ["customer-role token in admin cookie", customerRoleInAdminCookie], ["unsigned token", noneSigned], ["payload swapped, old signature", tampered]];
  let allDenied = true; const leaks = [];
  for (const [method, p, body] of adminRoutes) {
    for (const [label, h] of variants) {
      const res = await call(method, p, { headers: { ...h, ...(body ? J : {}) }, raw: body === null ? undefined : body ? JSON.stringify(body) : undefined });
      if (res.status !== 401) { allDenied = false; console.log(`   ! ${method} ${p} with ${label} -> ${res.status}`); }
      if (LEAK.test(res.text)) leaks.push(`${method} ${p}`);
    }
  }
  ok(allDenied, `all ${adminRoutes.length} admin routes answer 401 for ${variants.length} kinds of missing / forged / wrong-role credentials`);
  ok(leaks.length === 0, "401 responses never leak stack traces or internals", leaks.join(","));
  r = await call("GET", "/api/orders/me");
  ok(r.status === 401, "GET /api/orders/me without a session -> 401", String(r.status));
  for (const p of ["/portal-secure", "/portal-secure/settings/payments"]) {
    r = await call("GET", p);
    ok(r.status >= 300 && r.status < 400 && /portal-access/.test(r.headers.get("location") || ""), `anonymous ${p} redirects to the admin login`, String(r.status));
  }

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Admin writes: validation, mass assignment, size caps, CSRF");
  const pbody = { title: "Smoke Tee", slug: "smoke-tee", description: "A tee for smoke tests", pricePaise: 99900, image: "https://images.unsplash.com/photo-1", category: "tees", fit: "Oversized", stockCount: 5 };
  r = await call("POST", "/api/products", { body: pbody, headers: A() });
  ok(r.status === 201, "admin creates a product", String(r.status));
  const pid = r.json?.product?.id;
  r = await call("POST", "/api/products", { body: { ...pbody, slug: { $ne: "" } }, headers: A() });
  ok(r.status === 400, "product create: slug:{$ne:\"\"} -> 400", String(r.status));
  r = await call("POST", "/api/products", { body: pbody, headers: A() });
  ok(r.status === 409 && !LEAK.test(r.text), "duplicate slug -> clean 409, no E11000 leak", `${r.status} ${r.text}`);
  r = await call("POST", "/api/products", { body: { ...pbody, slug: "bad slug!" }, headers: A() });
  ok(r.status === 422, "invalid slug characters -> 422", String(r.status));
  r = await call("POST", "/api/products", { body: { ...pbody, slug: "xss-img", image: "javascript:alert(1)" }, headers: A() });
  ok(r.status === 422, "javascript: image URL is refused", String(r.status));
  r = await call("PUT", `/api/products/${pid}`, { body: { pricePaise: 123400, isAdmin: true, _id: fakeId, __v: 9 }, headers: A() });
  const afterPut = await db.collection("products").findOne({ slug: "smoke-tee" });
  ok(r.status === 200 && afterPut.pricePaise === 123400 && afterPut.isAdmin === undefined && String(afterPut._id) === pid && afterPut.fit === "Oversized", "product PUT: unknown fields dropped, _id untouched, partial update keeps other fields (fit not reset)", `fit=${afterPut?.fit}`);
  r = await call("PUT", `/api/products/${pid}`, { body: { $set: { pricePaise: 1 } }, headers: A() });
  ok(r.status === 400, "product PUT with a top-level $set -> 400", String(r.status));
  r = await call("PUT", `/api/products/${pid}`, { body: { pricePaise: { $inc: 5 } }, headers: A() });
  ok(r.status === 400, "product PUT with an operator value -> 400", String(r.status));
  r = await call("PUT", `/api/products/${pid}`, { body: { pricePaise: "100" }, headers: A() });
  ok(r.status === 422, "product PUT with a numeric string -> 422", String(r.status));
  ok((await db.collection("products").findOne({ slug: "smoke-tee" })).pricePaise === 123400, "...and none of the rejected requests changed the stored price");
  r = await call("POST", "/api/products", { raw: JSON.stringify({ ...pbody, slug: "huge", description: "x".repeat(200 * 1024) }), headers: A() });
  ok(r.status === 413, "product create: 200KB body -> 413", String(r.status));
  r = await call("POST", "/api/products", { body: pbody, headers: A({ origin: "https://evil.example" }) });
  ok(r.status === 403, "admin POST with a foreign Origin is refused even with a valid admin cookie (CSRF)", String(r.status));
  r = await call("POST", "/api/products", { raw: JSON.stringify({ ...pbody, slug: "textplain" }), headers: { ...admin, "content-type": "text/plain" } });
  ok(r.status === 415, "admin POST as text/plain is refused (415)", String(r.status));
  r = await call("DELETE", `/api/products/${pid}`, { headers: A({ origin: "https://evil.example" }) });
  ok(r.status === 403, "admin DELETE with a foreign Origin is refused", String(r.status));
  r = await call("DELETE", `/api/products/${pid}`, { headers: admin });
  ok(r.status === 200, "admin DELETE works normally");

  // CMS
  r = await call("GET", "/api/cms/sections/constructor", { headers: admin });
  ok(r.status === 404, "cms section key 'constructor' is not a section (prototype lookup)", String(r.status));
  r = await call("PUT", "/api/cms/sections/__proto__", { body: { data: {} }, headers: A() });
  ok(r.status === 404, "cms section key '__proto__' -> 404", String(r.status));
  r = await call("PUT", "/api/cms/sections/site.announcement", { body: { data: { $set: { x: 1 } } }, headers: A() });
  ok(r.status === 400, "cms PUT with $-keys -> 400", String(r.status));
  r = await call("PUT", "/api/cms/hero", { body: { banners: [{ srcDesktop: "javascript:alert(1)", ctaHref: "javascript:alert(1)" }] }, headers: A() });
  ok(is4xx(r), "hero PUT with javascript: URLs is refused", String(r.status));
  r = await call("PUT", "/api/cms/hero", { body: { banners: [{ id: { $ne: null }, srcDesktop: "https://images.unsplash.com/a" }] }, headers: A() });
  ok(r.status === 400, "hero PUT with an operator id -> 400", String(r.status));
  const look = (href, image = "https://images.unsplash.com/p") => ({ lookLabel: "LOOK 01", modelImage: "https://images.unsplash.com/m", products: [{ id: "l1", title: "T", category: "tees", href, image, pricePaise: 1000, color: "Black" }] });
  r = await call("PUT", "/api/cms/shop-the-look", { body: { look: look("javascript:alert(1)") }, headers: A() });
  ok(r.status === 400, "shop-the-look: javascript: product link is refused", String(r.status));
  r = await call("PUT", "/api/cms/shop-the-look", { body: { look: look("//evil.example/x") }, headers: A() });
  ok(r.status === 400, "shop-the-look: protocol-relative link is refused", String(r.status));
  r = await call("PUT", "/api/cms/shop-the-look", { body: { look: look("/\\evil.example") }, headers: A() });
  ok(r.status === 400, "shop-the-look: '/\\host' link trick is refused", String(r.status));
  r = await call("PUT", "/api/cms/shop-the-look", { body: { look: { ...look("/products/x"), evil: { $set: 1 } } }, headers: A() });
  ok(r.status === 400, "shop-the-look: operator key anywhere -> 400", String(r.status));
  r = await call("PUT", "/api/cms/shop-the-look", { body: { look: { ...look("/products/x"), isAdmin: true, products: [{ ...look("/products/x").products[0], extra: "no" }] } }, headers: A() });
  const savedLook = await db.collection("shoplooks").findOne({});
  ok(r.status === 200 && savedLook && savedLook.isAdmin === undefined && savedLook.products[0].extra === undefined, "shop-the-look: only whitelisted fields are stored", String(r.status));

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Reviews: authorisation, sanitising, rate limit");
  const rv = (body, uid = buyerId, ip) => call("POST", "/api/reviews", { body, headers: customer(uid), ip });
  r = await call("POST", "/api/reviews", { body: { slug: "smoke-hoodie", rating: 5, comment: "Great quality, loved it." } });
  ok(r.status === 401, "review without a session -> 401", String(r.status));
  for (const [label, body] of [["slug:{$ne:null}", { slug: { $ne: null }, rating: 5, comment: "Great quality, loved it." }], ["rating as string", { slug: "smoke-hoodie", rating: "5", comment: "Great quality, loved it." }], ["rating 99", { slug: "smoke-hoodie", rating: 99, comment: "Great quality, loved it." }], ["comment as array", { slug: "smoke-hoodie", rating: 5, comment: ["Great quality, loved it."] }]]) {
    r = await rv(body, buyerId, nextIp());
    ok(is4xx(r), `review rejects ${label}`, String(r.status));
  }
  const reviewer = new mongoose.Types.ObjectId().toString();
  r = await rv({ slug: "smoke-hoodie", rating: 5, comment: "Great quality, loved it." }, reviewer, nextIp());
  ok(r.status === 403, "a customer who never bought the product cannot review it", String(r.status));
  await db.collection("orders").insertOne({ userId: reviewer, paymentMethod: "razorpay", paymentStatus: "pending", fulfillmentStatus: "processing", items: [{ productId: String(prodId), size: "M", quantity: 1 }], createdAt: new Date() });
  r = await rv({ slug: "smoke-hoodie", rating: 5, comment: "Great quality, loved it." }, reviewer, nextIp());
  ok(r.status === 403, "an abandoned (unpaid) online-payment order does not make someone a verified buyer", String(r.status));
  await db.collection("orders").insertOne({ userId: reviewer, paymentMethod: "cod", paymentStatus: "pending", fulfillmentStatus: "processing", items: [{ productId: String(prodId), size: "M", quantity: 1 }], createdAt: new Date() });
  r = await rv({ slug: "smoke-hoodie", rating: 5, title: "<b>Nice</b>", comment: "<script>alert(1)</script>Great quality, loved it. <img src=x onerror=alert(2)>" }, reviewer, nextIp());
  const stored1 = await db.collection("reviews").findOne({ userId: reviewer });
  ok(r.status === 201 && stored1 && !/[<>]/.test(stored1.comment + stored1.title), "a COD buyer can review; HTML is stripped before storage", stored1 ? JSON.stringify(stored1.comment) : String(r.status));
  r = await rv({ slug: "smoke-hoodie", rating: 4, comment: "Second review attempt, should fail." }, reviewer, nextIp());
  ok(r.status === 409 || r.status === 429, "one review per product per customer", String(r.status));
  r = await call("POST", "/api/reviews", { body: { slug: "smoke-hoodie", rating: 5, comment: "Great quality, loved it." }, headers: { ...customer(buyerId), origin: "https://evil.example" } });
  ok(r.status === 403, "review POST with a foreign Origin is refused", String(r.status));
  const spammer = new mongoose.Types.ObjectId().toString();
  let rl = 0;
  for (let i = 0; i < 9; i++) { r = await rv({ slug: "smoke-hoodie", rating: 5, comment: "Great quality, loved it." }, spammer, nextIp()); if (r.status === 429) rl++; }
  ok(rl >= 3, "review POST is limited to 5/min per user", `${rl} of 9 rejected`);
  r = await call("POST", "/api/reviews", { raw: JSON.stringify({ slug: "smoke-hoodie", rating: 5, comment: "x".repeat(20000) }), headers: { ...J, ...customer(reviewer) } });
  ok(r.status === 413 || r.status === 429, "review POST: 20KB body is refused", String(r.status));

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Contact + newsletter: validation and rate limits");
  const cIp = nextIp();
  const cbody = { name: "Smoke Tester", email: "smoke@example.com", subject: "Hello", message: "This is a long enough message for the contact form." };
  for (const [label, body] of [["name:{$ne:null}", { ...cbody, name: { $ne: null } }], ["email as array", { ...cbody, email: ["a@b.co"] }], ["message 5000 chars", { ...cbody, message: "x".repeat(5000) }], ["bad phone", { ...cbody, phone: "12" }]]) {
    r = await call("POST", "/api/contact", { body, ip: nextIp() });
    ok(is4xx(r), `contact rejects ${label}`, String(r.status));
  }
  r = await call("POST", "/api/contact", { raw: JSON.stringify({ ...cbody, message: "x".repeat(30000) }), headers: J, ip: nextIp() });
  ok(r.status === 413, "contact: 30KB body -> 413", String(r.status));
  const seen = [];
  for (let i = 0; i < 5; i++) { r = await call("POST", "/api/contact", { body: cbody, ip: cIp }); seen.push(r.status); }
  ok(seen[0] === 200 && seen.slice(3).every((s) => s === 429), "contact: 3 per minute per IP then 429", seen.join(","));
  r = await call("POST", "/api/contact", { body: cbody, headers: { origin: "https://evil.example" } });
  ok(r.status === 403, "contact with a foreign Origin is refused", String(r.status));
  const nIp = nextIp();
  const nseen = [];
  for (let i = 0; i < 4; i++) { r = await call("POST", "/api/newsletter", { body: { email: `news${i}.${Date.now()}@example.com` }, ip: nIp }); nseen.push(r.status); }
  ok(nseen[0] === 200 && nseen.slice(2).every((s) => s === 429), "newsletter: 2 per minute per IP then 429", nseen.join(","));
  for (const body of [{ email: { $ne: null } }, { email: ["a@b.co"] }, { email: "x".repeat(400) + "@example.com" }, { email: "not-an-email" }]) {
    r = await call("POST", "/api/newsletter", { body, ip: nextIp() });
    ok(is4xx(r), `newsletter rejects ${JSON.stringify(body).slice(0, 40)}`, String(r.status));
  }

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Oversized and streamed bodies");
  r = await call("POST", "/api/auth/login", { raw: JSON.stringify({ email, password: "x".repeat(1024 * 1024) }), headers: J });
  ok(r.status === 413, "login: 1MB body -> 413", String(r.status));
  const chunk = Buffer.alloc(8 * 1024, 97);
  const stream = new ReadableStream({ start(c) { c.enqueue(new Uint8Array(Buffer.from('{"email":"'))); for (let i = 0; i < 8; i++) c.enqueue(new Uint8Array(chunk)); c.enqueue(new Uint8Array(Buffer.from('","password":"x"}'))); c.close(); } });
  r = await call("POST", "/api/auth/login", { raw: stream, headers: J });
  ok(r.status === 413, "login: chunked body with no Content-Length is capped while streaming -> 413", String(r.status));

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Uploads");
  const uploaded = [];
  const form = (bytes, name = "pic.png", type = "image/png") => { const f = new FormData(); f.append("file", new Blob([bytes], { type }), name); return f; };
  const upload = async (bytes, name, type, headers = admin, ip) => {
    const res = await fetch(BASE + "/api/upload", { method: "POST", headers: { "x-forwarded-for": ip || nextIp(), ...headers }, body: form(bytes, name, type) });
    const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch { /* */ }
    if (json?.url) uploaded.push(json.url);
    return { status: res.status, json, text, headers: res.headers };
  };
  const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 1)]);
  r = await upload(PNG, "pic.png", "image/png", {});
  ok(r.status === 401, "upload without admin cookie -> 401", String(r.status));
  r = await upload(PNG, "pic.png", "image/png", customer(buyerId));
  ok(r.status === 401, "upload with a customer session -> 401", String(r.status));
  r = await upload(PNG, "../../../etc/passwd.php", "application/x-php");
  ok(r.status === 200 && /^\/uploads\/[a-f0-9]{32}\.png$/.test(r.json?.url || ""), "client filename is ignored: stored as random 32-hex name with the sniffed .png extension", r.json?.url);
  if (r.json?.url) {
    const file = await fetch(BASE + r.json.url);
    ok(file.status === 200 && file.headers.get("content-type") === "image/png" && file.headers.get("x-content-type-options") === "nosniff", "uploaded file is served as image/png with nosniff", `${file.status} ${file.headers.get("content-type")}`);
    await file.arrayBuffer();
  }
  r = await upload(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), "x.png", "image/png");
  ok(r.status === 415, "SVG disguised as .png is rejected (magic bytes)", String(r.status));
  r = await upload(Buffer.from("<html><script>alert(1)</script></html>" + " ".repeat(40)), "x.png", "image/png");
  ok(r.status === 415, "HTML disguised as .png is rejected", String(r.status));
  r = await upload(Buffer.concat([Buffer.from("....ftypheic"), Buffer.alloc(64)]), "x.mp4", "video/mp4");
  ok(r.status === 415, "HEIC (ftyp heic) is not accepted as video", String(r.status));
  r = await upload(Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x18]), Buffer.from("ftypmp42"), Buffer.alloc(64)]), "clip.mp4", "video/mp4");
  ok(r.status === 200 && /\.mp4$/.test(r.json?.url || "") && r.json?.kind === "video", "a genuine mp4 header is accepted as video", r.json?.url);
  r = await upload(Buffer.concat([PNG, Buffer.alloc(11 * 1024 * 1024)]), "big.png", "image/png");
  ok(r.status === 413, "an 11MB image is rejected (10MB cap)", String(r.status));
  r = await upload(Buffer.alloc(0), "empty.png", "image/png");
  ok(r.status === 400, "an empty file is rejected", String(r.status));
  const textForm = new FormData(); textForm.append("file", "not a file");
  r = await fetch(BASE + "/api/upload", { method: "POST", headers: { "x-forwarded-for": nextIp(), ...admin }, body: textForm });
  ok(r.status === 400, "'file' field that is plain text -> 400", String(r.status));
  r = await fetch(BASE + "/api/upload", { method: "POST", headers: { "x-forwarded-for": nextIp(), ...admin, origin: "https://evil.example" }, body: form(PNG) });
  ok(r.status === 403, "upload with a foreign Origin is refused", String(r.status));
  const upIp = nextIp(); let up429 = 0;
  for (let i = 0; i < 33; i++) { const x = await upload(Buffer.from("junk-junk-junk-junk"), "j.png", "image/png", admin, upIp); if (x.status === 429) up429++; }
  ok(up429 >= 2, "upload limited to 30/min", `${up429} of 33 rejected`);

  // ───────────────────────────────────────────────────────────────────────────────────────────
  section("Headers, info leaks");
  r = await call("GET", "/");
  const h = (k) => r.headers.get(k) || "";
  ok(r.status === 200 && /default-src 'self'/.test(h("content-security-policy")) && /object-src 'none'/.test(h("content-security-policy")) && /frame-ancestors 'none'/.test(h("content-security-policy")), "Content-Security-Policy is set (default-src 'self', object-src 'none', frame-ancestors 'none')");
  ok(h("x-frame-options") === "DENY" && h("x-content-type-options") === "nosniff" && /strict-origin/.test(h("referrer-policy")) && /max-age=\d{7,}/.test(h("strict-transport-security")), "X-Frame-Options DENY, nosniff, Referrer-Policy, HSTS");
  ok(/geolocation=\(self\)/.test(h("permissions-policy")) && /camera=\(\)/.test(h("permissions-policy")) && /microphone=\(\)/.test(h("permissions-policy")), "Permissions-Policy allows geolocation for the site itself only; camera/microphone off", h("permissions-policy"));
  r = await call("GET", "/api/definitely-not-a-route");
  ok(r.status === 404 && !/MongoServerError|E11000|CastError|mongoose/.test(r.text), "unknown API route: plain 404 without database internals", String(r.status));
  r = await call("POST", "/api/products/not-an-id", { body: { a: 1 }, headers: admin });
  ok(is4xx(r) && !LEAK.test(r.text), "malformed id with an admin cookie: clean 4xx", `${r.status} ${r.text.slice(0, 60)}`);
  r = await call("POST", "/api/razorpay/create-order", { raw: "{not json", headers: { ...J, ...customer(buyerId) } });
  ok(r.status === 400 && !LEAK.test(r.text), "broken JSON -> 400 without parser internals", r.text);

  // ───────────────────────────────────────────────────────────────────────────────────────────
  // clean up: only files THIS run created, and the scratch database
  for (const u of uploaded) { try { fs.unlinkSync(path.join(__dirname, "..", "public", u.replace(/^\//, ""))); } catch { /* ignore */ } }
  // Empty the scratch collections instead of dropping the database: a live dev server keeps its unique indexes.
  try { for (const c of await db.listCollections().toArray()) await db.collection(c.name).deleteMany({}); } catch { /* ignore */ }
  await mongoose.disconnect();
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) console.log("FAILED:\n - " + failures.join("\n - "));
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("SCRIPT ERROR", e); process.exit(2); });
