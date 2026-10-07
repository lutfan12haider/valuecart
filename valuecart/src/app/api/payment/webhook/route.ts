import { NextResponse } from "next/server";
import { getPaymentService, isPaymentEnabled } from "@/lib/payment";

export async function POST(req: Request) {
  if (!isPaymentEnabled()) {
    return NextResponse.json({ error: "Payment integration is not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => {
    headers[k] = v;
  });

  const provider = getPaymentService();
  const result = await provider.handleWebhook(rawBody, headers);
  if (!result.ok) {
    return NextResponse.json({ error: result.message ?? "Webhook rejected." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
