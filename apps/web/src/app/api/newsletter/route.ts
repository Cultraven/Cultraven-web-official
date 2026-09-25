/**
 * POST /api/newsletter
 *
 * Subscribes an email address.
 * In production, emits a notification event via @shop/events (notification-service).
 * Validates email with zod.
 */

import { NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid email" },
      { status: 422 }
    );
  }

  const { email } = parsed.data;

  // TODO: In production, call notification-service or a mailing provider.
  // For now, log and return 200.
  console.info(`[newsletter] New subscription: ${email}`);

  return NextResponse.json({ message: "Subscribed" }, { status: 200 });
}
