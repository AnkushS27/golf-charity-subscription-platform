import { UserRole } from "@prisma/client";
import { SiteNavClient } from "@/app/components/site-nav-client";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

export async function SiteNav() {
  const user = await getCurrentAppUser();
  const isAdmin = user?.role === UserRole.ADMIN;

  if (!user) {
    return <SiteNavClient isAuthenticated={false} isAdmin={false} />;
  }

  const [notifications, recentWins, emailPreferenceEvent] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        subject: true,
        createdAt: true,
      },
    }),
    prisma.drawWinner.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        draw: {
          select: {
            month: true,
            year: true,
          },
        },
        verification: {
          select: {
            status: true,
          },
        },
      },
    }),
    prisma.auditLog.findFirst({
      where: {
        action: "EMAIL_PREFERENCES_UPDATED",
        entity: "UserPreference",
        entityId: user.id,
      },
      orderBy: { createdAt: "desc" },
      select: { payloadJson: true },
    }),
  ]);

  const notificationItems = notifications.map((item) => ({
    subject: item.subject,
    createdAtLabel: item.createdAt.toLocaleString(),
  }));

  const winningItems = recentWins.map((item) => ({
    drawLabel: `${item.draw.month}/${item.draw.year}`,
    tier: item.tier,
    amountLabel: `GBP ${(item.amountInMinor / 100).toFixed(2)}`,
    verificationStatus: item.verification?.status ?? "PENDING_PROOF",
    payoutStatus: item.payoutStatus,
  }));

  const emailEnabled = (() => {
    const payload = emailPreferenceEvent?.payloadJson;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return true;
    }

    const value = (payload as Record<string, unknown>).emailEnabled;
    return typeof value === "boolean" ? value : true;
  })();

  return (
    <SiteNavClient
      isAuthenticated={true}
      isAdmin={isAdmin}
      fullName={user.fullName}
      notificationItems={notificationItems}
      winningItems={winningItems}
      emailEnabled={emailEnabled}
    />
  );
}