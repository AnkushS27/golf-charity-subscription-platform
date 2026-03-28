"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { signIn, signOut } from "@/auth";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

function normalizeNextPath(raw: FormDataEntryValue | null, fallback = "/dashboard") {
  const value = typeof raw === "string" ? raw : "";
  if (!value || !value.startsWith("/")) {
    return fallback;
  }
  return value;
}

export async function signUpAction(formData: FormData) {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const field = firstIssue?.path?.[0];
    const fieldParam = typeof field === "string" ? `&field=${encodeURIComponent(field)}` : "";
    redirect(`/signup?error=invalid_input${fieldParam}`);
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });

  if (existing) {
    redirect("/signup?error=signup_failed&reason=email_exists");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.create({
    data: {
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?signup=check-email");
    }

    throw error;
  }

  redirect("/dashboard");
}

export async function signInAction(formData: FormData) {
  const nextPath = normalizeNextPath(formData.get("next"));

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&error=invalid_input`);
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: nextPath,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?next=${encodeURIComponent(nextPath)}&error=invalid_credentials`);
    }

    throw error;
  }

  redirect(nextPath);
}

export async function signOutAction() {
  await signOut({
    redirectTo: "/",
  });
}
