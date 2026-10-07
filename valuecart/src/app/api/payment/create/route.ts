import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPaymentService, isPaymentEnabled } from "@/lib/payment";
import { applyPaymentOutcome } from "@/lib/payment/fulfill";
import { toMoneyNumber } from "@/lib/money";

const schema = z.object({
  orderId: z.string(),
  mockOutcome: z.enum(["success", "failed", "pending"]).optional()
});

export async function POST(req: Request) {
  if (!isPaymentEnabled()) {
    return NextResponse.json({ error: "Online payment will be available soon." }, { status: 503 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment request." }, { status: 400 });

  const user = await getUser();
  const order = await db.order.findUnique({
    where: { id: parsed.data.orderId },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } }
  });

  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (user && order.userId && order.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ ok: true, status: "PAID", orderNumber: order.orderNumber });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const returnUrl = `${baseUrl}/account/orders/${order.id}?paid=1`;
  const provider = getPaymentService();
  const outcome = parsed.data.mockOutcome ?? "success";

  await db.payment.updateMany({
    where: { orderId: order.id },
    data: { status: "PROCESSING" }
  });
  await db.order.update({ where: { id: order.id }, data: { paymentStatus: "PROCESSING" } });

  const result = await provider.createPayment({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: toMoneyNumber(order.total),
    currency: order.currency,
    customerEmail: order.email,
    returnUrl,
    metadata: { mockOutcome: outcome }
  });

  if (!result.ok) {
    await applyPaymentOutcome({
      orderId: order.id,
      providerRef: `failed_${order.id}`,
      state: "FAILED",
      failureMessage: result.message
    });
    return NextResponse.json({ ok: false, error: result.message, status: "FAILED" }, { status: 402 });
  }

  if (outcome === "pending") {
    await applyPaymentOutcome({
      orderId: order.id,
      providerRef: result.providerRef,
      state: "PENDING"
    });
    return NextResponse.json({
      ok: true,
      status: "PENDING",
      orderNumber: order.orderNumber,
      message: "Payment is pending confirmation."
    });
  }

  if (outcome === "failed") {
    await applyPaymentOutcome({
      orderId: order.id,
      providerRef: result.providerRef,
      state: "FAILED"
    });
    return NextResponse.json(
      {
        ok: false,
        status: "FAILED",
        error: "Payment could not be completed. Please try again or use another payment method."
      },
      { status: 402 }
    );
  }

  const fulfilled = await applyPaymentOutcome({
    orderId: order.id,
    providerRef: result.providerRef,
    state: "PAID"
  });

  if (!fulfilled.ok) {
    return NextResponse.json({ ok: false, error: fulfilled.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    status: "PAID",
    orderNumber: order.orderNumber,
    redirectUrl: result.redirectUrl ?? returnUrl
  });
}
