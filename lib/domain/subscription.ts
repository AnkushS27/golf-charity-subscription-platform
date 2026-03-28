import type { BillingCycle } from "@prisma/client";

export function getSubscriptionPeriodEnd(startDate: Date, billingCycle: BillingCycle): Date {
  const endDate = new Date(startDate);

  if (billingCycle === "YEARLY") {
    endDate.setFullYear(endDate.getFullYear() + 1);
    return endDate;
  }

  endDate.setMonth(endDate.getMonth() + 1);
  return endDate;
}

export function calculateCharityContribution(amountInMinor: number, percent: number): number {
  return Math.floor(amountInMinor * (percent / 100));
}
