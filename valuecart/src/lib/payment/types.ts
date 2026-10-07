export type PaymentResult =
  | { ok: true; providerRef: string; redirectUrl?: string }
  | { ok: false; code: "NOT_CONFIGURED" | "FAILED"; message: string };

export type PaymentState =
  | "NOT_STARTED"
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
  customerEmail: string;
  returnUrl: string;
  /** Provider-specific metadata (e.g. mockOutcome for development). */
  metadata?: Record<string, string>;
}

export interface PaymentProvider {
  createPayment(input: CreatePaymentInput): Promise<PaymentResult>;
  verifyPayment(providerRef: string): Promise<{ ok: boolean; state: PaymentState; message?: string }>;
  getPaymentStatus(providerRef: string): Promise<{ ok: boolean; state: PaymentState; message?: string }>;
  handleWebhook(rawBody: string, headers: Record<string, string>): Promise<{ ok: boolean; message?: string }>;
  refundPayment(providerRef: string, amount: number): Promise<PaymentResult>;
}
