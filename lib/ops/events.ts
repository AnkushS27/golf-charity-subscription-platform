import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/mail/resend";

type NotifyInput = {
  userId: string;
  subject: string;
  payload: Prisma.InputJsonValue;
  email?: string;
};

type AuditInput = {
  actorUserId?: string;
  action: string;
  entity: string;
  entityId?: string;
  payload?: Prisma.InputJsonValue;
};

async function isEmailEnabled(userId: string) {
  const latestPreference = await prisma.auditLog.findFirst({
    where: {
      action: "EMAIL_PREFERENCES_UPDATED",
      entity: "UserPreference",
      entityId: userId,
    },
    orderBy: { createdAt: "desc" },
    select: { payloadJson: true },
  });

  const payload = latestPreference?.payloadJson;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return true;
  }

  const value = (payload as Record<string, unknown>).emailEnabled;
  if (typeof value !== "boolean") {
    return true;
  }

  return value;
}

export async function notifyUser(input: NotifyInput) {
  await prisma.notification.create({
    data: {
      userId: input.userId,
      channel: input.email ? "EMAIL+IN_APP" : "IN_APP",
      subject: input.subject,
      payloadJson: input.payload,
      sentAt: new Date(),
    },
  });

  if (!input.email) {
    return;
  }

  const emailEnabled = await isEmailEnabled(input.userId);
  if (!emailEnabled) {
    return;
  }

  try {
    await sendEmail({
      to: input.email,
      subject: input.subject,
      html: `<p>${input.subject}</p>`,
    });
  } catch (error) {
    logger.warn({ error, userId: input.userId, subject: input.subject }, "Failed to send email notification");
  }
}

export async function recordAuditEvent(input: AuditInput) {
  await prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      payloadJson: input.payload,
    },
  });
}
