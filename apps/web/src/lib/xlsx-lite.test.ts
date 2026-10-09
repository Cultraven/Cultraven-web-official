import { describe, it, expect } from "vitest";
import { inflateRawSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { buildXlsx, columnLetter, crc32, xmlText } from "./xlsx-lite";
import { toExportRow, totals, buildOrdersXlsx, buildOrdersPdf } from "./orders-export";

/** Minimal ZIP reader (central directory → inflate → CRC check), so the tests prove the file is a valid archive. */
function unzip(buf: Buffer): Record<string, string> {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(eocd).toBeGreaterThan(0);
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out: Record<string, string> = {};
  for (let i = 0; i < count; i++) {
    expect(buf.readUInt32LE(p)).toBe(0x02014b50);
    const method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16), csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32), lho = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nlen).toString("utf8");
    expect(buf.readUInt32LE(lho)).toBe(0x04034b50);
    const start = lho + 30 + buf.readUInt16LE(lho + 26) + buf.readUInt16LE(lho + 28);
    const data = method === 8 ? inflateRawSync(buf.subarray(start, start + csize)) : buf.subarray(start, start + csize);
    expect(data.length).toBe(usize);
    expect(crc32(data)).toBe(crc);
    out[name] = data.toString("utf8");
    p += 46 + nlen + elen + clen;
  }
  return out;
}

describe("xlsx writer", () => {
  it("crc32 matches the standard test vector", () => {
    expect(crc32(Buffer.from("123456789"))).toBe(0xcbf43926);
  });
  it("column letters run A…Z, AA…", () => {
    expect([0, 1, 25, 26, 27, 51, 52, 701, 702].map(columnLetter)).toEqual(["A", "B", "Z", "AA", "AB", "AZ", "BA", "ZZ", "AAA"]);
  });
  it("xmlText escapes markup and drops characters XML cannot hold, but keeps ₹ and emoji", () => {
    expect(xmlText(`a & b <c> "d"`)).toBe("a &amp; b &lt;c&gt; &quot;d&quot;");
    expect(xmlText("x\u0000y\u0008z\u001Fw")).toBe("xyzw");
    expect(xmlText("lone\uD83Dhigh")).toBe("lonehigh");
    expect(xmlText("₹ 😀")).toBe("₹ 😀");
  });
  it("builds a valid archive with the six parts Excel needs", () => {
    const files = unzip(buildXlsx("Orders", [{ header: "Name" }, { header: "Total", kind: "money" }, { header: "Qty", kind: "int" }], [["Asha", 1499.5, 2]]));
    expect(Object.keys(files).sort()).toEqual(["[Content_Types].xml", "_rels/.rels", "xl/_rels/workbook.xml.rels", "xl/styles.xml", "xl/workbook.xml", "xl/worksheets/sheet1.xml"]);
    expect(files["xl/workbook.xml"]).toContain('<sheet name="Orders"');
    const sheet = files["xl/worksheets/sheet1.xml"];
    expect(sheet).toContain("<t xml:space=\"preserve\">Name</t>");
    expect(sheet).toContain('<c r="B2" s="2"><v>1499.5</v></c>'); // money stays a real number
    expect(sheet).toContain('<c r="C2" s="3"><v>2</v></c>');
    expect(sheet).toContain('<autoFilter ref="A1:C2"/>');
  });
  it("never writes customer text as a formula", () => {
    const sheet = unzip(buildXlsx("S", [{ header: "Name" }], [["=HYPERLINK(\"http://evil\",\"x\")"], ["+1+1"], ["@SUM(A1)"]]))["xl/worksheets/sheet1.xml"];
    expect(sheet).not.toContain("<f>");
    expect(sheet.match(/t="inlineStr"/g)?.length).toBe(4); // header + 3 values, all plain text
  });
  it("cleans the sheet name (Excel forbids \\ / ? * [ ] : and more than 31 characters)", () => {
    expect(unzip(buildXlsx("A/B:C?*[x]" + "y".repeat(40), [{ header: "h" }], []))["xl/workbook.xml"]).toMatch(/<sheet name="A B C {3}x {1}y{20,}"|<sheet name="[^"/:?*\[\]]{1,31}"/);
  });
});

describe("orders export", () => {
  const order = (over: any = {}) => ({
    _id: "6ac8c9ea13fc9d0f18d654b2", createdAt: "2026-09-10T10:30:55.000Z", fulfillmentStatus: "processing", paymentMethod: "cod", paymentStatus: "pending",
    items: [{ title: "Raven Tee", size: "M", color: "Black", quantity: 2, pricePaise: 149900 }, { title: "Cargo", size: "L", quantity: 1, pricePaise: 249900 }],
    subtotalPaise: 549600, discountPaise: 0, shippingPaise: 0, codFeePaise: 4900, totalPaise: 554500,
    deliveryAddress: { name: "Anmol Chouhan", email: "a@x.com", phone: "7470372108", line1: "220 Shantinath puri", line2: "Hawa bangla", city: "Indore", state: "Madhya Pradesh", pincode: "452002" },
    ...over,
  });
  it("flattens an order into one row, in rupees, with the same status names customers see", () => {
    const r = toExportRow(order());
    expect(r).toMatchObject({ orderNo: "CR-D654B2", customer: "Anmol Chouhan", phone: "7470372108", address: "220 Shantinath puri, Hawa bangla", city: "Indore", units: 3, subtotal: 5496, codFee: 49, total: 5545, payment: "Cash on Delivery", status: "Order placed", statusKey: "processing" });
    expect(r.items).toBe("2× Raven Tee (M, Black); 1× Cargo (L)");
    expect(r.placedAt).toMatch(/10 Sept?\.? 2026/i);
  });
  it("copes with missing parts of an old order instead of failing", () => {
    const r = toExportRow({ _id: "6ac8c9ea13fc9d0f18d654b3" });
    expect(r).toMatchObject({ customer: "", units: 0, total: 0, status: "Order placed", items: "" });
  });
  it("totals leave out cancelled / returned / returned-to-origin orders from the 'live' figure", () => {
    const rows = [order(), order({ fulfillmentStatus: "cancelled", totalPaise: 100000 }), order({ fulfillmentStatus: "delivered", totalPaise: 200000 })].map(toExportRow);
    expect(totals(rows)).toEqual({ count: 3, all: 5545 + 1000 + 2000, live: 5545 + 2000 });
  });
  it("makes a real .xlsx and a real PDF (and paginates a long list)", async () => {
    const rows = Array.from({ length: 60 }, (_, i) => toExportRow(order({ _id: `6ac8c9ea13fc9d0f18d65${(400 + i).toString(16)}` })));
    expect(Object.keys(unzip(buildOrdersXlsx(rows)))).toHaveLength(6);
    const pdf = await buildOrdersPdf(rows, "All orders");
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    expect((await PDFDocument.load(pdf)).getPageCount()).toBe(3); // 60 rows at 22 per page
    expect((await PDFDocument.load(await buildOrdersPdf([], "Nothing"))).getPageCount()).toBe(1); // an empty list still gives a valid one-page file
  });
});
