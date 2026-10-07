import type { PaymentProvider } from "./types";

const message = "Payment integration is not configured.";

export const unconfiguredProvider: PaymentProvider = {
  async createPayment() {
    return { ok: false, code: "NOT_CONFIGURED", message };
  },
  async verifyPayment() {
    return { ok: false, state: "NOT_STARTED", message };
  },
  async getPaymentStatus() {
    return { ok: false, state: "NOT_STARTED", message };
  },
  async handleWebhook() {
    return { ok: false, message };
  },
  async refundPayment() {
    return { ok: false, code: "NOT_CONFIGURED", message };
  }
};
