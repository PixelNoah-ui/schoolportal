import { payments, type PaymentRow } from "@/lib/mock-data";

const DELAY = 600;
const delay = <T>(data: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), DELAY));

export async function fetchPayments(): Promise<PaymentRow[]> {
  console.log("[API] GET /payments");
  return delay(payments);
}
