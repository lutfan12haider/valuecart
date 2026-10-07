import type { CreatePaymentInput, PaymentProvider, PaymentResult } from "./types";

/**
 * Binance Pay Provider
 * ─────────────────────────────────────────────────────────────────
 * HOW TO INTEGRATE:
 *   1. Go to https://developers.binance.com/docs/binance-pay/introduction
 *   2. Get your Binance Pay merchant credentials (API Key + Secret)
 *   3. Fill in the TODOs below
 *   4. Set env vars:
 *        BINANCE_PAY_API_KEY=your_key
 *        BINANCE_PAY_API_SECRET=your_secret
 *        BINANCE_PAY_MERCHANT_ID=your_merchant_id
 *   5. Set PAYMENT_PROVIDER=binance-pay in your .env
 * ─────────────────────────────────────────────────────────────────
 */

const API_KEY    = process.env.BINANCE_PAY_API_KEY     ?? "";
const API_SECRET = process.env.BINANCE_PAY_API_SECRET  ?? "";
const MERCHANT_ID = process.env.BINANCE_PAY_MERCHANT_ID ?? "";

const BASE_URL = "https://bpay.binanceapi.com";

export const binancePayProvider: PaymentProvider = {
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    // TODO: Call Binance Pay "Create Order" endpoint
    // POST ${BASE_URL}/binancepay/openapi/v2/order
    // Required fields: env, merchantTradeNo, orderAmount, currency,
    //                  goods (name, description), returnUrl, cancelUrl
    // Docs: https://developers.binance.com/docs/binance-pay/api-order-create-v2
    //
    // Example skeleton:
    // const payload = {
    //   env: { terminalType: "WEB" },
    //   merchantTradeNo: input.orderNumber,
    //   orderAmount: input.amount,
    //   currency: input.currency,
    //   goods: { goodsType: "01", goodsCategory: "0000", referenceGoodsId: input.orderId, goodsName: "ValueCart Order" },
    //   returnUrl: input.returnUrl,
    //   cancelUrl: input.returnUrl,
    // };
    // const { signature, timestamp, nonce } = signRequest(payload, API_SECRET);
    // const res = await fetch(`${BASE_URL}/binancepay/openapi/v2/order`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "BinancePay-Timestamp": timestamp,
    //     "BinancePay-Nonce": nonce,
    //     "BinancePay-Certificate-SN": API_KEY,
    //     "BinancePay-Signature": signature,
    //   },
    //   body: JSON.stringify(payload),
    // });
    // const data = await res.json();
    // if (data.status !== "SUCCESS") return { ok: false, code: "FAILED", message: data.errorMessage };
    // return { ok: true, providerRef: data.data.prepayId, redirectUrl: data.data.checkoutUrl };

    console.warn("[binance-pay] createPayment not implemented yet.");
    return { ok: false, code: "NOT_CONFIGURED", message: "Binance Pay not integrated yet." };
  },

  async verifyPayment(providerRef: string) {
    // TODO: Call Binance Pay "Query Order" endpoint using prepayId
    // POST ${BASE_URL}/binancepay/openapi/v2/order/query
    // Body: { prepayId: providerRef }
    // Map status: "PAID" -> "PAID", "INITIAL"/"PENDING" -> "PENDING", "EXPIRED"/"CANCELED" -> "CANCELLED"
    // Docs: https://developers.binance.com/docs/binance-pay/api-order-query-v2

    console.warn("[binance-pay] verifyPayment not implemented yet.");
    return { ok: false, state: "NOT_STARTED" as const, message: "Binance Pay not integrated yet." };
  },

  async getPaymentStatus(providerRef: string) {
    return this.verifyPayment(providerRef);
  },

  async handleWebhook(rawBody: string, headers: Record<string, string>) {
    // TODO: Verify Binance Pay webhook signature
    // Headers to check: BinancePay-Timestamp, BinancePay-Nonce, BinancePay-Signature, BinancePay-Certificate-SN
    // Docs: https://developers.binance.com/docs/binance-pay/webhook
    //
    // After verification, parse rawBody and call applyPaymentOutcome() from "@/lib/payment/fulfill"
    // with the orderId, providerRef, and mapped PaymentState.

    console.warn("[binance-pay] handleWebhook not implemented yet.");
    return { ok: false, message: "Binance Pay webhook not integrated yet." };
  },

  async refundPayment(providerRef: string, amount: number) {
    // TODO: Call Binance Pay refund endpoint
    // POST ${BASE_URL}/binancepay/openapi/order/refund
    // Body: { prepayId: providerRef, refundAmount: amount, refundReason: "Customer request" }
    // Docs: https://developers.binance.com/docs/binance-pay/api-order-refund

    console.warn("[binance-pay] refundPayment not implemented yet.");
    return { ok: false, code: "NOT_CONFIGURED", message: "Binance Pay refund not integrated yet." };
  },
};
