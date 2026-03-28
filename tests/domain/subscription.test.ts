import { describe, expect, it } from "vitest";
import { getSubscriptionPeriodEnd, calculateCharityContribution } from "@/lib/domain/subscription";

describe("subscription domain", () => {
  it("computes monthly period end", () => {
    const start = new Date("2026-01-15T00:00:00.000Z");
    const end = getSubscriptionPeriodEnd(start, "MONTHLY");
    expect(end.getMonth()).toBe(1);
  });

  it("computes charity contribution from percent", () => {
    expect(calculateCharityContribution(1900, 10)).toBe(190);
  });
});
