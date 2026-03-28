"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { notifyUser, recordAuditEvent } from "@/lib/ops/events";

export async function createIndependentDonationAction(formData: FormData) {
  const charityId = String(formData.get("charityId") ?? "");
  const amountInMinor = Math.floor(Number(formData.get("amount")) * 100);

  if (!charityId || !Number.isFinite(amountInMinor) || amountInMinor <= 0) {
    return;
  }

  const user = await requireCurrentAppUser();

  const charity = await prisma.charity.findUnique({
    where: { id: charityId },
    select: { name: true },
  });

  if (!charity) {
    return;
  }

  const donation = await prisma.independentDonation.create({
    data: {
      userId: user.id,
      charityId,
      amountInMinor,
      currency: "GBP",
    },
  });

  await Promise.all([
    notifyUser({
      userId: user.id,
      email: user.email,
      subject: "Donation received",
      payload: {
        donationId: donation.id,
        charity: charity.name,
        amountInMinor,
      },
    }),
    recordAuditEvent({
      actorUserId: user.id,
      action: "INDEPENDENT_DONATION_CREATED",
      entity: "IndependentDonation",
      entityId: donation.id,
      payload: { charityId, amountInMinor },
    }),
  ]);

  redirect("/dashboard");
}
