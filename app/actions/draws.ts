"use server";

import { DrawMode, DrawStatus, SubscriptionStatus, UserRole, WinnerTier } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireCurrentAppUser } from "@/lib/auth/current-user";
import { generateRandomDrawNumbers, generateWeightedDrawNumbers } from "@/lib/domain/draw";
import { calculatePrizeDistribution, splitTierAmongWinners } from "@/lib/domain/prize-pool";
import { countMatches, getWinnerTier } from "@/lib/domain/winners";
import { notifyUser, recordAuditEvent } from "@/lib/ops/events";

function getCurrentDrawMonthYear() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function getMode(raw: FormDataEntryValue | null): DrawMode {
  if (raw === DrawMode.WEIGHTED_MOST_FREQUENT || raw === DrawMode.WEIGHTED_LEAST_FREQUENT) {
    return raw;
  }
  return DrawMode.RANDOM;
}

async function requireAdmin() {
  const user = await requireCurrentAppUser();
  if (user.role !== UserRole.ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function simulateMonthlyDrawAction(formData: FormData) {
  const admin = await requireAdmin();

  const mode = getMode(formData.get("mode"));
  const { year, month } = getCurrentDrawMonthYear();

  const scores = await prisma.scoreEntry.findMany({
    select: { score: true },
  });

  const scoreFrequency: Record<number, number> = {};
  for (const score of scores) {
    scoreFrequency[score.score] = (scoreFrequency[score.score] ?? 0) + 1;
  }

  const numbers =
    mode === DrawMode.RANDOM
      ? generateRandomDrawNumbers(5, 45)
      : generateWeightedDrawNumbers(scoreFrequency, mode, 5);

  const activeSubscriptions = await prisma.subscription.findMany({
    where: { status: SubscriptionStatus.ACTIVE },
    select: { userId: true },
  });

  const uniqueUserIds = [...new Set(activeSubscriptions.map((subscription) => subscription.userId))];

  const [latestScores, latestContributions] = await Promise.all([
    prisma.scoreEntry.findMany({
      where: { userId: { in: uniqueUserIds } },
      orderBy: [{ userId: "asc" }, { playedAt: "desc" }],
      select: { userId: true, score: true },
    }),
    prisma.charityContribution.findMany({
      where: { userId: { in: uniqueUserIds } },
      orderBy: { createdAt: "desc" },
      select: { userId: true, contributionPercent: true },
    }),
  ]);

  const userScores = new Map<string, number[]>();
  for (const entry of latestScores) {
    const current = userScores.get(entry.userId) ?? [];
    if (current.length < 5) {
      current.push(entry.score);
      userScores.set(entry.userId, current);
    }
  }

  const userContribution = new Map<string, number>();
  for (const contribution of latestContributions) {
    if (!userContribution.has(contribution.userId)) {
      userContribution.set(contribution.userId, Number(contribution.contributionPercent));
    }
  }

  const draw = await prisma.monthlyDraw.upsert({
    where: { year_month: { year, month } },
    update: {
      mode,
      status: DrawStatus.SIMULATED,
      simulationNumbersJson: numbers,
    },
    create: {
      year,
      month,
      mode,
      status: DrawStatus.SIMULATED,
      numbersJson: numbers,
      simulationNumbersJson: numbers,
    },
  });

  await prisma.drawParticipantSnapshot.deleteMany({ where: { drawId: draw.id } });

  if (uniqueUserIds.length > 0) {
    await prisma.drawParticipantSnapshot.createMany({
      data: uniqueUserIds.map((userId) => ({
        drawId: draw.id,
        userId,
        scoreSetJson: userScores.get(userId) ?? [],
        charityPercent: userContribution.get(userId) ?? 10,
      })),
    });
  }

  await recordAuditEvent({
    actorUserId: admin.id,
    action: "DRAW_SIMULATED",
    entity: "MonthlyDraw",
    entityId: draw.id,
    payload: {
      mode,
      participantCount: uniqueUserIds.length,
      year,
      month,
    },
  });

  redirect(`/admin/dashboard?draw=simulated&participants=${uniqueUserIds.length}&mode=${mode}`);
}

export async function publishMonthlyDrawAction() {
  const admin = await requireAdmin();

  const { year, month } = getCurrentDrawMonthYear();
  const draw = await prisma.monthlyDraw.findUnique({
    where: { year_month: { year, month } },
    include: { participants: true },
  });

  if (!draw) {
    redirect("/admin/dashboard?draw=missing_simulation");
  }

  const drawNumbers = Array.isArray(draw.simulationNumbersJson)
    ? (draw.simulationNumbersJson as number[])
    : (draw.numbersJson as number[]);

  const activeSubscriberCount = await prisma.subscription.count({
    where: { status: SubscriptionStatus.ACTIVE },
  });

  const unitPrizeContribution = 500;
  const totalPrizePoolInMinor = activeSubscriberCount * unitPrizeContribution + draw.rolloverInMinor;
  const distribution = calculatePrizeDistribution(totalPrizePoolInMinor);

  const tierBuckets: Record<WinnerTier, string[]> = {
    MATCH_3: [],
    MATCH_4: [],
    MATCH_5: [],
  };

  for (const participant of draw.participants) {
    const userNumbers = Array.isArray(participant.scoreSetJson) ? (participant.scoreSetJson as number[]) : [];
    const tier = getWinnerTier(countMatches(userNumbers, drawNumbers));
    if (tier) {
      tierBuckets[tier].push(participant.userId);
    }
  }

  const match5Winners = tierBuckets.MATCH_5.length;
  const rolloverInMinor = match5Winners === 0 ? distribution.match5InMinor : 0;

  await prisma.$transaction(async (tx) => {
    await tx.drawWinner.deleteMany({ where: { drawId: draw.id } });

    const tierEntries: Array<{ tier: WinnerTier; amount: number; users: string[] }> = [
      { tier: WinnerTier.MATCH_3, amount: distribution.match3InMinor, users: tierBuckets.MATCH_3 },
      { tier: WinnerTier.MATCH_4, amount: distribution.match4InMinor, users: tierBuckets.MATCH_4 },
      { tier: WinnerTier.MATCH_5, amount: distribution.match5InMinor, users: tierBuckets.MATCH_5 },
    ];

    for (const tierEntry of tierEntries) {
      const winnerAmount = splitTierAmongWinners(tierEntry.amount, tierEntry.users.length);
      for (const userId of tierEntry.users) {
        await tx.drawWinner.create({
          data: {
            drawId: draw.id,
            userId,
            tier: tierEntry.tier,
            amountInMinor: winnerAmount,
          },
        });
      }
    }

    await tx.monthlyDraw.update({
      where: { id: draw.id },
      data: {
        status: DrawStatus.PUBLISHED,
        numbersJson: drawNumbers,
        totalPrizePoolInMinor,
        rolloverInMinor,
        publishedAt: new Date(),
      },
    });
  });

  const winners = await prisma.drawWinner.findMany({
    where: { drawId: draw.id },
    include: { user: true },
  });

  await Promise.all([
    ...winners.map((winner) =>
      notifyUser({
        userId: winner.userId,
        email: winner.user.email,
        subject: `Draw results published: ${month}/${year}`,
        payload: {
          drawId: draw.id,
          tier: winner.tier,
          amountInMinor: winner.amountInMinor,
        },
      }),
    ),
    recordAuditEvent({
      actorUserId: admin.id,
      action: "DRAW_PUBLISHED",
      entity: "MonthlyDraw",
      entityId: draw.id,
      payload: {
        year,
        month,
        winnerCount: winners.length,
        totalPrizePoolInMinor,
        rolloverInMinor,
      },
    }),
  ]);

  redirect(`/admin/dashboard?draw=published&winners=${winners.length}`);
}
