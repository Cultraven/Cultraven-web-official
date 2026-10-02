/**
 * Per-size stock: reserve when an order is placed, give it back when the order is cancelled / returned / undelivered.
 * Only sizes that have a stock count set in the admin are tracked; everything else is untouched.
 * Reservation is atomic per size (a conditional $inc), so two shoppers can never buy the last unit twice.
 */
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Order } from "@/lib/models/Order";

export interface StockLine { productId: string; size: string; qty: number }

/** Merge lines for the same product + size (a cart can hold the same size twice in different colours). */
export function mergeLines(lines: StockLine[]): StockLine[] {
  const m = new Map<string, StockLine>();
  for (const l of lines) {
    const k = `${l.productId}|${l.size}`;
    const cur = m.get(k);
    if (cur) cur.qty += l.qty; else m.set(k, { ...l });
  }
  return [...m.values()];
}

export type ReserveResult = { ok: true; reserved: StockLine[] } | { ok: false; productId: string; size: string; remaining: number };

/**
 * Atomically take stock for every tracked line. If any line can't be fulfilled, everything already taken is put back
 * and the failing line is reported. `tracked(line)` says whether that size has a stock count.
 */
export async function reserveSizeStock(lines: StockLine[], tracked: (l: StockLine) => boolean): Promise<ReserveResult> {
  await connectToDatabase();
  const taken: StockLine[] = [];
  for (const l of mergeLines(lines).filter(tracked)) {
    const r = await Product.updateOne(
      { _id: l.productId, sizeOptions: { $elemMatch: { size: l.size, stockCount: { $gte: l.qty } } } },
      { $inc: { "sizeOptions.$.stockCount": -l.qty } }
    );
    if (r.modifiedCount !== 1) {
      for (const t of taken) await giveBack(t);
      const doc = (await Product.findById(l.productId).select("sizeOptions").lean()) as any;
      const remaining = Number(doc?.sizeOptions?.find((o: any) => o.size === l.size)?.stockCount ?? 0);
      return { ok: false, productId: l.productId, size: l.size, remaining: Math.max(0, remaining) };
    }
    taken.push(l);
  }
  return { ok: true, reserved: taken };
}

async function giveBack(l: StockLine) {
  await Product.updateOne(
    { _id: l.productId, sizeOptions: { $elemMatch: { size: l.size, stockCount: { $exists: true } } } },
    { $inc: { "sizeOptions.$.stockCount": l.qty } }
  );
}

export async function releaseSizeStock(lines: StockLine[]) {
  await connectToDatabase();
  for (const l of mergeLines(lines)) await giveBack(l);
}

/**
 * Put an order's reserved stock back — once. Safe to call repeatedly (cancel + admin approve, retries):
 * only orders that actually reserved stock are touched, and an atomic claim stops a second release.
 */
export async function releaseOrderStock(orderId: string): Promise<boolean> {
  try {
    await connectToDatabase();
    const o = (await Order.findOneAndUpdate({ _id: orderId, stockReserved: true, stockReleasedAt: null }, { $set: { stockReleasedAt: new Date() } }, { new: true }).lean()) as any;
    if (!o) return false;
    await releaseSizeStock((o.items ?? []).map((i: any) => ({ productId: String(i.productId), size: String(i.size), qty: Number(i.quantity) || 0 })));
    return true;
  } catch (e) {
    console.error("[inventory] release failed:", e instanceof Error ? e.message : e);
    return false;
  }
}
