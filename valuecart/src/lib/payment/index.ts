import type { PaymentProvider } from "./types";
import { unconfiguredProvider } from "./unconfigured";
import { mockPaymentProvider } from "./mock";

export function getPaymentService(): PaymentProvider {
  switch (process.env.PAYMENT_PROVIDER?.toLowerCase()) {
    case "mock":
      return mockPaymentProvider;
    default:
      if (process.env.NODE_ENV === "development") return mockPaymentProvider;
      return unconfiguredProvider;
  }
}

export function isPaymentEnabled(): boolean {
  return getPaymentService() !== unconfiguredProvider;
}

export function isMockPayment(): boolean {
  return getPaymentService() === mockPaymentProvider;
}

export * from "./types";
