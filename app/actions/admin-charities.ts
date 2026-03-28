"use server";

import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";
import { recordAuditEvent } from "@/lib/ops/events";
import { createCharitySchema, toggleCharitySchema, updateCharitySchema } from "@/lib/validation/charity";

async function requireAdminUser() {
  const user = await requireCurrentAppUser();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function createCharityAction(formData: FormData) {
  const parsed = createCharitySchema.safeParse({
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    featured: String(formData.get("featured")) === "on",
    isActive: String(formData.get("isActive")) === "on",
  });

  if (!parsed.success) {
    return;
  }

  const admin = await requireAdminUser();

  const charity = await prisma.charity.create({
    data: parsed.data,
  });

  await recordAuditEvent({
    actorUserId: admin.id,
    action: "CHARITY_CREATED",
    entity: "Charity",
    entityId: charity.id,
    payload: {
      slug: charity.slug,
      featured: charity.featured,
      isActive: charity.isActive,
    },
  });

  redirect("/admin/dashboard");
}

export async function updateCharityAction(formData: FormData) {
  const parsed = updateCharitySchema.safeParse({
    charityId: String(formData.get("charityId") ?? ""),
    slug: String(formData.get("slug") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    websiteUrl: String(formData.get("websiteUrl") ?? ""),
    featured: String(formData.get("featured")) === "on",
    isActive: String(formData.get("isActive")) === "on",
  });

  if (!parsed.success) {
    return;
  }

  const admin = await requireAdminUser();

  const charity = await prisma.charity.update({
    where: { id: parsed.data.charityId },
    data: {
      slug: parsed.data.slug,
      name: parsed.data.name,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl,
      websiteUrl: parsed.data.websiteUrl,
      featured: parsed.data.featured,
      isActive: parsed.data.isActive,
    },
  });

  await recordAuditEvent({
    actorUserId: admin.id,
    action: "CHARITY_UPDATED",
    entity: "Charity",
    entityId: charity.id,
    payload: {
      slug: charity.slug,
      featured: charity.featured,
      isActive: charity.isActive,
    },
  });

  redirect("/admin/dashboard");
}

export async function toggleCharityActiveAction(formData: FormData) {
  const parsed = toggleCharitySchema.safeParse({
    charityId: String(formData.get("charityId") ?? ""),
  });

  if (!parsed.success) {
    return;
  }

  const admin = await requireAdminUser();

  const charity = await prisma.charity.findUnique({ where: { id: parsed.data.charityId } });
  if (!charity) {
    return;
  }

  const updated = await prisma.charity.update({
    where: { id: charity.id },
    data: { isActive: !charity.isActive },
  });

  await recordAuditEvent({
    actorUserId: admin.id,
    action: "CHARITY_TOGGLED_ACTIVE",
    entity: "Charity",
    entityId: updated.id,
    payload: { isActive: updated.isActive },
  });

  redirect("/admin/dashboard");
}
