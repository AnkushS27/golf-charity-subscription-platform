"use server";

import { PayoutStatus, UserRole, VerificationStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { notifyUser, recordAuditEvent } from "@/lib/ops/events";
import { uploadWinnerProof } from "@/lib/storage/blob";
import { reviewWinnerSchema } from "@/lib/validation/winner";

async function requireAdmin() {
  const user = await requireCurrentAppUser();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function submitWinnerProofAction(formData: FormData) {
  const winnerId = String(formData.get("winnerId") ?? "");
  const file = formData.get("proof") as File | null;

  if (!winnerId || !file || file.size === 0) {
    return;
  }

  const user = await requireCurrentAppUser();

  const winner = await prisma.drawWinner.findFirst({
    where: { id: winnerId, userId: user.id },
    include: { draw: true },
  });

  if (!winner) {
    return;
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const blob = await uploadWinnerProof(`winners/${winnerId}/${safeName}`, file);

  await prisma.winnerVerification.upsert({
    where: { winnerId },
    update: {
      proofBlobUrl: blob.url,
      status: VerificationStatus.PENDING,
      adminNotes: null,
      reviewedAt: null,
      reviewedByUserId: null,
    },
    create: {
      winnerId,
      proofBlobUrl: blob.url,
      status: VerificationStatus.PENDING,
    },
  });

  await Promise.all([
    notifyUser({
      userId: user.id,
      email: user.email,
      subject: "Winner proof submitted",
      payload: {
        winnerId,
        draw: `${winner.draw.month}/${winner.draw.year}`,
      },
    }),
    recordAuditEvent({
      actorUserId: user.id,
      action: "WINNER_PROOF_SUBMITTED",
      entity: "WinnerVerification",
      entityId: winnerId,
    }),
  ]);

  redirect("/dashboard");
}

export async function reviewWinnerVerificationAction(formData: FormData) {
  const parsed = reviewWinnerSchema.safeParse({
    verificationId: String(formData.get("verificationId") ?? ""),
    status: String(formData.get("status") ?? ""),
    adminNotes: String(formData.get("adminNotes") ?? "").trim(),
  });

  if (!parsed.success) {
    return;
  }

  const { verificationId, status: statusRaw, adminNotes } = parsed.data;
  const normalizedNotes = adminNotes?.trim() ?? "";

  const admin = await requireAdmin();

  const verification = await prisma.winnerVerification.update({
    where: { id: verificationId },
    data: {
      status: statusRaw,
      adminNotes: normalizedNotes.length > 0 ? normalizedNotes : null,
      reviewedAt: new Date(),
      reviewedByUserId: admin.id,
    },
    include: {
      winner: {
        include: {
          user: true,
        },
      },
    },
  });

  await Promise.all([
    notifyUser({
      userId: verification.winner.userId,
      email: verification.winner.user.email,
      subject: `Winner verification ${statusRaw.toLowerCase()}`,
      payload: {
        verificationId,
        winnerId: verification.winnerId,
        status: statusRaw,
      },
    }),
    recordAuditEvent({
      actorUserId: admin.id,
      action: "WINNER_VERIFICATION_REVIEWED",
      entity: "WinnerVerification",
      entityId: verification.id,
      payload: {
        status: statusRaw,
        winnerId: verification.winnerId,
      },
    }),
  ]);

  redirect("/admin/dashboard");
}

export async function markWinnerPaidAction(formData: FormData) {
  const winnerId = String(formData.get("winnerId") ?? "");
  if (!winnerId) {
    return;
  }

  const admin = await requireAdmin();

  const winner = await prisma.drawWinner.findUnique({
    where: { id: winnerId },
    include: { verification: true, user: true },
  });

  if (!winner || winner.verification?.status !== VerificationStatus.APPROVED) {
    return;
  }

  await prisma.drawWinner.update({
    where: { id: winnerId },
    data: { payoutStatus: PayoutStatus.PAID },
  });

  await Promise.all([
    notifyUser({
      userId: winner.userId,
      email: winner.user.email,
      subject: "Payout marked as paid",
      payload: {
        winnerId,
        payoutStatus: PayoutStatus.PAID,
      },
    }),
    recordAuditEvent({
      actorUserId: admin.id,
      action: "WINNER_PAYOUT_MARKED_PAID",
      entity: "DrawWinner",
      entityId: winnerId,
    }),
  ]);

  redirect("/admin/dashboard");
}
