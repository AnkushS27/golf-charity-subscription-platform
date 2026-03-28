"use server";

import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { getSubscriptionPeriodEnd, calculateCharityContribution } from "@/lib/domain/subscription";
import { notifyUser, recordAuditEvent } from "@/lib/ops/events";
import { createSubscriptionSchema } from "@/lib/validation/subscription";

export async function createSubscriptionAction(formData: FormData) {
  const parsed = createSubscriptionSchema.safeParse({
    planCode: formData.get("planCode"),
    mockPaymentShouldFail: String(formData.get("mockPaymentShouldFail")) === "on",
    charityPercent: Number(formData.get("charityPercent")),
  });

  if (!parsed.success) {
    redirect("/dashboard?subscription=invalid_input");
  }

  const user = await requireCurrentAppUser();

  const [plan, charity] = await Promise.all([
    prisma.subscriptionPlan.findUnique({ where: { code: parsed.data.planCode } }),
    prisma.charity.findFirst({ where: { isActive: true }, orderBy: { featured: "desc" } }),
  ]);

  if (!plan) {
    redirect("/dashboard?subscription=missing_plan");
  }

  if (!charity) {
    redirect("/dashboard?subscription=missing_charity");
  }

  const now = new Date();
  const status = parsed.data.mockPaymentShouldFail ? SubscriptionStatus.LAPSED : SubscriptionStatus.ACTIVE;

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planId: plan.id,
      status,
      currentPeriodStartAt: now,
      currentPeriodEndAt: getSubscriptionPeriodEnd(now, plan.billingCycle),
      mockPaymentShouldFail: parsed.data.mockPaymentShouldFail,
    },
  });

  const charityAmount = calculateCharityContribution(plan.amountInMinor, parsed.data.charityPercent);
  await prisma.charityContribution.create({
    data: {
      userId: user.id,
      charityId: charity.id,
      sourceSubscriptionId: subscription.id,
      contributionPercent: parsed.data.charityPercent,
      amountInMinor: charityAmount,
      currency: plan.currency,
    },
  });

  await Promise.all([
    notifyUser({
      userId: user.id,
      email: user.email,
      subject: "Subscription activated",
      payload: {
        subscriptionId: subscription.id,
        plan: plan.code,
        status,
        charityPercent: parsed.data.charityPercent,
      },
    }),
    recordAuditEvent({
      actorUserId: user.id,
      action: "SUBSCRIPTION_CREATED",
      entity: "Subscription",
      entityId: subscription.id,
      payload: {
        plan: plan.code,
        status,
        charityPercent: parsed.data.charityPercent,
      },
    }),
  ]);

  const result = status === SubscriptionStatus.ACTIVE ? "activated" : "payment_failed";
  redirect(`/dashboard?subscription=${result}`);
}

export async function cancelSubscriptionAction(formData: FormData) {
  const subscriptionId = String(formData.get("subscriptionId") ?? "");
  if (!subscriptionId) {
    redirect("/dashboard?subscription=cancel_failed");
  }

  const user = await requireCurrentAppUser();

  const result = await prisma.subscription.updateMany({
    where: {
      id: subscriptionId,
      userId: user.id,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
    },
    data: {
      status: SubscriptionStatus.CANCELED,
      canceledAt: new Date(),
    },
  });

  if (result.count > 0) {
    await Promise.all([
      notifyUser({
        userId: user.id,
        email: user.email,
        subject: "Subscription canceled",
        payload: {
          subscriptionId,
          canceledAt: new Date().toISOString(),
        },
      }),
      recordAuditEvent({
        actorUserId: user.id,
        action: "SUBSCRIPTION_CANCELED",
        entity: "Subscription",
        entityId: subscriptionId,
      }),
    ]);
  }

  if (result.count > 0) {
    redirect("/dashboard?subscription=canceled");
  }

  redirect("/dashboard?subscription=cancel_failed");
}
