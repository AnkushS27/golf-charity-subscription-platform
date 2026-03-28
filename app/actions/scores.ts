"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { scoreEntrySchema } from "@/lib/validation/score";

export async function addScoreAction(formData: FormData) {
  const parsed = scoreEntrySchema.safeParse({
    score: Number(formData.get("score")),
    playedAt: new Date(String(formData.get("playedAt"))),
  });

  if (!parsed.success) {
    redirect("/dashboard?score=invalid_input");
  }

  const appUser = await requireCurrentAppUser();

  await prisma.scoreEntry.create({
    data: {
      userId: appUser.id,
      score: parsed.data.score,
      playedAt: parsed.data.playedAt,
    },
  });

  const oldestEntries = await prisma.scoreEntry.findMany({
    where: { userId: appUser.id },
    orderBy: { playedAt: "desc" },
    skip: 5,
    select: { id: true },
  });

  if (oldestEntries.length > 0) {
    await prisma.scoreEntry.deleteMany({
      where: {
        id: {
          in: oldestEntries.map((entry) => entry.id),
        },
      },
    });
  }

  revalidatePath("/dashboard");
  redirect("/dashboard?score=saved");
}
