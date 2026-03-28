"use server";

import { redirect } from "next/navigation";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { notifyUser, recordAuditEvent } from "@/lib/ops/events";
import { emailPreferencesSchema } from "@/lib/validation/preferences";

export async function updateEmailPreferencesAction(formData: FormData) {
  const nextPathRaw = String(formData.get("nextPath") ?? "");
  const nextPath = nextPathRaw.startsWith("/") ? nextPathRaw : "/dashboard";

  const parsed = emailPreferencesSchema.safeParse({
    emailEnabled: String(formData.get("emailEnabled")) === "on",
  });

  if (!parsed.success) {
    redirect(nextPath);
  }

  const user = await requireCurrentAppUser();

  await recordAuditEvent({
    actorUserId: user.id,
    action: "EMAIL_PREFERENCES_UPDATED",
    entity: "UserPreference",
    entityId: user.id,
    payload: {
      emailEnabled: parsed.data.emailEnabled,
    },
  });

  await notifyUser({
    userId: user.id,
    subject: "Email preferences updated",
    payload: {
      emailEnabled: parsed.data.emailEnabled,
    },
  });

  redirect(nextPath);
}
