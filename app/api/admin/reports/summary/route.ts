import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { toErrorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const [
      totalUsers,
      activeSubscriptions,
      pendingVerifications,
      pendingPayouts,
      totalContributions,
      totalDonations,
      totalPrizePaid,
      latestDraw,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.winnerVerification.count({ where: { status: "PENDING" } }),
      prisma.drawWinner.count({ where: { payoutStatus: "PENDING" } }),
      prisma.charityContribution.aggregate({ _sum: { amountInMinor: true } }),
      prisma.independentDonation.aggregate({ _sum: { amountInMinor: true } }),
      prisma.drawWinner.aggregate({ _sum: { amountInMinor: true }, where: { payoutStatus: "PAID" } }),
      prisma.monthlyDraw.findFirst({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeSubscriptions,
      pendingVerifications,
      pendingPayouts,
      totalContributionsInMinor: totalContributions._sum.amountInMinor ?? 0,
      totalDonationsInMinor: totalDonations._sum.amountInMinor ?? 0,
      totalPrizePaidInMinor: totalPrizePaid._sum.amountInMinor ?? 0,
      latestDraw: latestDraw
        ? {
            id: latestDraw.id,
            month: latestDraw.month,
            year: latestDraw.year,
            status: latestDraw.status,
            totalPrizePoolInMinor: latestDraw.totalPrizePoolInMinor,
            rolloverInMinor: latestDraw.rolloverInMinor,
          }
        : null,
    });
  } catch (error) {
    const mapped = toErrorResponse(error);
    return NextResponse.json({ message: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
