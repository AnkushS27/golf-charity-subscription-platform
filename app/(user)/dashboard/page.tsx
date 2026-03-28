import { redirect } from "next/navigation";
import { SubscriptionStatus } from "@prisma/client";
import { createIndependentDonationAction } from "@/app/actions/charity";
import { addScoreAction } from "@/app/actions/scores";
import { cancelSubscriptionAction, createSubscriptionAction } from "@/app/actions/subscriptions";
import { PendingSubmitButton } from "@/app/components/pending-submit-button";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db/prisma";

type UserDashboardPageProps = {
  searchParams?: Promise<{
    subscription?: string;
    score?: string;
  }>;
};

function getDashboardMessage(status: { subscription?: string; score?: string }) {
  if (status.score === "saved") {
    return {
      tone: "success",
      text: "Score saved and latest scores updated.",
    } as const;
  }

  if (status.score === "invalid_input") {
    return {
      tone: "error",
      text: "Please enter a valid Stableford score (1 to 45) and a valid play date.",
    } as const;
  }

  const subscriptionStatus = status.subscription;

  if (subscriptionStatus === "activated") {
    return {
      tone: "success",
      text: "Subscription activated successfully.",
    } as const;
  }

  if (subscriptionStatus === "payment_failed") {
    return {
      tone: "error",
      text: "Subscription could not be activated because payment simulation is set to fail.",
    } as const;
  }

  if (subscriptionStatus === "invalid_input") {
    return {
      tone: "error",
      text: "Please choose a valid plan and charity percentage between 10 and 100.",
    } as const;
  }

  if (subscriptionStatus === "missing_plan") {
    return {
      tone: "error",
      text: "No subscription plans are configured. Run the seed script or create plans in the database.",
    } as const;
  }

  if (subscriptionStatus === "missing_charity") {
    return {
      tone: "error",
      text: "No active charities are available. Add at least one active charity to continue.",
    } as const;
  }

  if (subscriptionStatus === "canceled") {
    return {
      tone: "success",
      text: "Subscription canceled.",
    } as const;
  }

  if (subscriptionStatus === "cancel_failed") {
    return {
      tone: "error",
      text: "Unable to cancel subscription. Please refresh and try again.",
    } as const;
  }

  return null;
}

export default async function UserDashboardPage({ searchParams }: UserDashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const dashboardMessage = getDashboardMessage({
    subscription: params?.subscription,
    score: params?.score,
  });

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/login");
  }

  const [scores, activeSubscription, charities, winnings] = await Promise.all([
    prisma.scoreEntry.findMany({ where: { userId: user.id }, orderBy: { playedAt: "desc" }, take: 5 }),
    prisma.subscription.findFirst({
      where: { userId: user.id, status: SubscriptionStatus.ACTIVE },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    }),
    prisma.charity.findMany({ where: { isActive: true }, orderBy: [{ featured: "desc" }, { name: "asc" }] }),
    prisma.drawWinner.aggregate({
      where: { userId: user.id },
      _sum: { amountInMinor: true },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Subscriber Dashboard</h1>

      {dashboardMessage && (
        <p
          className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
            dashboardMessage.tone === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {dashboardMessage.text}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">SUBSCRIPTION</p>
          <p className="mt-2 text-lg font-semibold">
            {activeSubscription ? `${activeSubscription.plan.name} (${activeSubscription.status})` : "Inactive"}
          </p>
          {activeSubscription && (
            <p className="mt-1 text-sm text-black/70">Renews {activeSubscription.currentPeriodEndAt.toLocaleDateString()}</p>
          )}
        </article>

        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">LATEST SCORES</p>
          <p className="mt-2 text-lg font-semibold">{scores.length}/5 captured</p>
        </article>

        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">TOTAL WINNINGS</p>
          <p className="mt-2 text-lg font-semibold">GBP {((winnings._sum.amountInMinor ?? 0) / 100).toFixed(2)}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Manage subscription</h2>

          {!activeSubscription ? (
            <form action={createSubscriptionAction} className="mt-4 space-y-3">
              <select name="planCode" className="w-full rounded-lg border border-black/15 px-4 py-2" defaultValue="monthly">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <input
                type="number"
                name="charityPercent"
                min={10}
                max={100}
                defaultValue={10}
                className="w-full rounded-lg border border-black/15 px-4 py-2"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="mockPaymentShouldFail" />
                Simulate failed payment
              </label>
              <PendingSubmitButton type="submit" pendingLabel="Activating..." className="rounded-lg bg-black px-4 py-2 text-white">
                Activate Subscription
              </PendingSubmitButton>
            </form>
          ) : (
            <form action={cancelSubscriptionAction} className="mt-4">
              <input type="hidden" name="subscriptionId" value={activeSubscription.id} />
              <PendingSubmitButton type="submit" pendingLabel="Cancelling..." className="rounded-lg border border-black/25 px-4 py-2">
                Cancel Subscription
              </PendingSubmitButton>
            </form>
          )}
        </article>

        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Add score</h2>
          <form action={addScoreAction} className="mt-4 space-y-3">
            <input
              type="number"
              min={1}
              max={45}
              name="score"
              required
              className="w-full rounded-lg border border-black/15 px-4 py-2"
            />
            <input type="date" name="playedAt" required className="w-full rounded-lg border border-black/15 px-4 py-2" />
            <PendingSubmitButton type="submit" pendingLabel="Saving..." className="rounded-lg bg-black px-4 py-2 text-white">
              Save Score
            </PendingSubmitButton>
          </form>
        </article>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Independent donation</h2>
          <form action={createIndependentDonationAction} className="mt-4 space-y-3">
            <select name="charityId" className="w-full rounded-lg border border-black/15 px-4 py-2" defaultValue="">
              <option value="" disabled>
                Choose charity
              </option>
              {charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="amount"
              min={1}
              step={0.01}
              defaultValue={5}
              className="w-full rounded-lg border border-black/15 px-4 py-2"
            />
            <PendingSubmitButton type="submit" pendingLabel="Donating..." className="rounded-lg bg-accent px-4 py-2 text-white">
              Donate
            </PendingSubmitButton>
          </form>
        </article>

        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Latest scores</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {scores.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between rounded-lg border border-black/10 bg-surface/85 px-3 py-2">
                <span>{entry.playedAt.toLocaleDateString()}</span>
                <strong>{entry.score}</strong>
              </li>
            ))}
            {scores.length === 0 && <li className="text-black/60">No scores yet.</li>}
          </ul>
        </article>
      </section>

    </main>
  );
}
