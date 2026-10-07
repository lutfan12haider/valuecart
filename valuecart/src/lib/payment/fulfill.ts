import { db } from "@/lib/db";
import type { PaymentState } from "./types";

export async function applyPaymentOutcome(input: {
  orderId: string;
  providerRef: string;
  state: PaymentState;
  failureMessage?: string;
}) {
  const order = await db.order.findUnique({
    where: { id: input.orderId },
    include: { items: true, payments: { orderBy: { createdAt: "desc" }, take: 1 } }
  });
  if (!order) return { ok: false as const, message: "Order not found." };

  const payment = order.payments[0];
  if (!payment) return { ok: false as const, message: "Payment record not found." };

  if (order.paymentStatus === "PAID") {
    return { ok: true as const, alreadyPaid: true };
  }

  if (input.state === "PAID") {
    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", providerRef: input.providerRef }
      });
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: "PAID", status: "CONFIRMED" }
      });

      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity }, reserved: { decrement: 0 } }
          });
        }
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
              sold: { increment: item.quantity }
            }
          });
          const p = await tx.product.findUnique({ where: { id: item.productId } });
          if (p && p.stock - item.quantity <= 0) {
            await tx.product.update({ where: { id: item.productId }, data: { status: "OUT_OF_STOCK" } });
          }
        }
      }
    });
    return { ok: true as const };
  }

  if (input.state === "PENDING" || input.state === "PROCESSING") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: input.state, providerRef: input.providerRef }
    });
    await db.order.update({
      where: { id: order.id },
      data: { paymentStatus: input.state === "PROCESSING" ? "PROCESSING" : "PENDING" }
    });
    return { ok: true as const };
  }

  if (input.state === "FAILED" || input.state === "CANCELLED") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: input.state, providerRef: input.providerRef }
    });
    await db.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: input.state,
        status: input.state === "CANCELLED" ? "CANCELLED" : order.status
      }
    });
    return {
      ok: false as const,
      message:
        input.failureMessage ??
        "Payment could not be completed. Please try again or use another payment method."
    };
  }

  return { ok: false as const, message: "Unsupported payment state." };
}
