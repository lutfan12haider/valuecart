import type { CreatePaymentInput, PaymentProvider, PaymentResult } from "./types";

/**
 * MOCK / DEVELOPMENT ONLY — does not move real funds.
 * Simulates provider responses for checkout testing (success, failure, pending).
 */
export const mockPaymentProvider: PaymentProvider = {
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const outcome = input.metadata?.mockOutcome ?? "success";
    const ref = `mock_${input.orderId}_${Date.now()}`;

    if (outcome === "failed") {
      return { ok: false, code: "FAILED", message: "Payment could not be completed. Please try again or use another payment method." };
    }

    if (outcome === "pending") {
      return { ok: true, providerRef: ref, redirectUrl: input.returnUrl };
    }

    return { ok: true, providerRef: ref, redirectUrl: input.returnUrl };
  },

  async verifyPayment(providerRef: string) {
    if (!providerRef.startsWith("mock_")) {
      return { ok: false, state: "FAILED" as const, message: "Unknown payment reference." };
    }
    return { ok: true, state: "PAID" as const };
  },

  async getPaymentStatus(providerRef: string) {
    return this.verifyPayment(providerRef);
  },

  async handleWebhook() {
    return { ok: true, message: "Mock webhook ignored." };
  },

  async refundPayment(providerRef: string) {
    if (!providerRef.startsWith("mock_")) {
      return { ok: false, code: "FAILED", message: "Unknown payment reference." };
    }
    return { ok: true, providerRef: `${providerRef}_refund` };
  }
};
