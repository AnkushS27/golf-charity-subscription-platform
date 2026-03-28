import Link from "next/link";
import { redirect } from "next/navigation";
import { DrawStatus, SubscriptionStatus, UserRole } from "@prisma/client";
import { createCharityAction, toggleCharityActiveAction, updateCharityAction } from "@/app/actions/admin-charities";
import { publishMonthlyDrawAction, simulateMonthlyDrawAction } from "@/app/actions/draws";
import { markWinnerPaidAction, reviewWinnerVerificationAction } from "@/app/actions/winners";
import { PendingSubmitButton } from "@/app/components/pending-submit-button";
import { prisma } from "@/lib/db/prisma";
import { getCurrentAppUser } from "@/lib/auth/current-user";

type AdminDashboardPageProps = {
  searchParams?: Promise<{
    auditPage?: string;
    charityEdit?: string;
    draw?: string;
    participants?: string;
    winners?: string;
    mode?: string;
  }>;
};

function getDrawMessage(input: { draw?: string; participants?: string; winners?: string; mode?: string }) {
  if (input.draw === "simulated") {
    const participantCount = Number(input.participants ?? "0");
    const modeLabel = input.mode ? input.mode.replaceAll("_", " ") : "RANDOM";
    return {
      tone: "success",
      text: `Draw simulated (${modeLabel}) with ${Number.isFinite(participantCount) ? participantCount : 0} participant(s).`,
    } as const;
  }

  if (input.draw === "published") {
    const winnerCount = Number(input.winners ?? "0");
    if (Number.isFinite(winnerCount) && winnerCount === 0) {
      return {
        tone: "info",
        text: "Draw results published. No winners this cycle (no entries matched 3+ numbers).",
      } as const;
    }

    return {
      tone: "success",
      text: `Draw results published successfully. Winners: ${Number.isFinite(winnerCount) ? winnerCount : 0}.`,
    } as const;
  }

  if (input.draw === "missing_simulation") {
    return {
      tone: "error",
      text: "No simulated draw found for the current month. Run simulation first.",
    } as const;
  }

  return null;
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const parsedAuditPage = Number(params?.auditPage ?? "1");
  const auditPage = Number.isFinite(parsedAuditPage) && parsedAuditPage > 0 ? Math.floor(parsedAuditPage) : 1;
  const auditTake = 5;
  const auditSkip = (auditPage - 1) * auditTake;
  const selectedCharityId = params?.charityEdit;
  const drawMessage = getDrawMessage({
    draw: params?.draw,
    participants: params?.participants,
    winners: params?.winners,
    mode: params?.mode,
  });

  const user = await getCurrentAppUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== UserRole.ADMIN) {
    redirect("/dashboard");
  }

  const [
    totalUsers,
    activeSubscriptions,
    latestDraw,
    recentWinners,
    pendingVerifications,
    pendingPayouts,
    totalContributions,
    totalDonations,
    topContributions,
    auditCount,
    recentAudit,
    charities,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.monthlyDraw.findFirst({ orderBy: [{ year: "desc" }, { month: "desc" }] }),
    prisma.drawWinner.findMany({
      include: {
        user: true,
        draw: true,
        verification: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.winnerVerification.count({ where: { status: "PENDING" } }),
    prisma.drawWinner.count({ where: { payoutStatus: "PENDING" } }),
    prisma.charityContribution.aggregate({ _sum: { amountInMinor: true } }),
    prisma.independentDonation.aggregate({ _sum: { amountInMinor: true } }),
    prisma.charityContribution.groupBy({
      by: ["charityId"],
      _sum: { amountInMinor: true },
      orderBy: { _sum: { amountInMinor: "desc" } },
      take: 5,
    }),
    prisma.auditLog.count(),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: auditSkip,
      take: auditTake,
      include: { user: true },
    }),
    prisma.charity.findMany({
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      take: 30,
    }),
  ]);

  const topContributionRows = await Promise.all(
    topContributions.map(async (row) => {
      const charity = await prisma.charity.findUnique({
        where: { id: row.charityId },
        select: { name: true },
      });

      return {
        charityName: charity?.name ?? "Unknown charity",
        amountInMinor: row._sum.amountInMinor ?? 0,
      };
    }),
  );

  const totalImpactInMinor = (totalContributions._sum.amountInMinor ?? 0) + (totalDonations._sum.amountInMinor ?? 0);
  const auditTotalPages = Math.max(1, Math.ceil(auditCount / auditTake));
  const selectedCharity = charities.find((charity) => charity.id === selectedCharityId) ?? null;

  const buildAuditPageHref = (targetPage: number) => {
    const query = new URLSearchParams();
    query.set("auditPage", String(targetPage));
    if (selectedCharityId) {
      query.set("charityEdit", selectedCharityId);
    }
    return `/admin/dashboard?${query.toString()}`;
  };

  const buildEditCharityHref = (charityId: string) => {
    const query = new URLSearchParams();
    query.set("auditPage", String(auditPage));
    query.set("charityEdit", charityId);
    return `/admin/dashboard?${query.toString()}#charity-management`;
  };

  const buildClearEditHref = () => {
    const query = new URLSearchParams();
    query.set("auditPage", String(auditPage));
    return `/admin/dashboard?${query.toString()}#charity-management`;
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold">Admin Dashboard</h1>

      {drawMessage && (
        <p
          className={`mt-4 rounded-lg border px-4 py-2 text-sm ${
            drawMessage.tone === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : drawMessage.tone === "info"
                ? "border-amber-300 bg-amber-50 text-amber-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {drawMessage.text}
        </p>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">TOTAL USERS</p>
          <p className="mt-2 text-3xl font-semibold">{totalUsers}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">ACTIVE SUBSCRIPTIONS</p>
          <p className="mt-2 text-3xl font-semibold">{activeSubscriptions}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">LATEST DRAW</p>
          <p className="mt-2 text-lg font-semibold">
            {latestDraw ? `${latestDraw.month}/${latestDraw.year}` : "No draw yet"}
          </p>
          {latestDraw?.status === DrawStatus.PUBLISHED && <p className="mt-1 text-sm text-emerald-700">Published</p>}
          {latestDraw?.status === DrawStatus.SIMULATED && <p className="mt-1 text-sm text-amber-700">Simulated</p>}
          {latestDraw?.status === DrawStatus.DRAFT && <p className="mt-1 text-sm text-black/60">Draft</p>}
        </article>
      </section>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">PENDING VERIFICATIONS</p>
          <p className="mt-2 text-3xl font-semibold">{pendingVerifications}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">PENDING PAYOUTS</p>
          <p className="mt-2 text-3xl font-semibold">{pendingPayouts}</p>
        </article>
        <article className="rounded-xl border border-black/10 bg-white/70 p-4 shadow-sm">
          <p className="text-xs font-semibold tracking-[0.12em] text-black/60">TOTAL CHARITY IMPACT</p>
          <p className="mt-2 text-3xl font-semibold">GBP {(totalImpactInMinor / 100).toFixed(2)}</p>
        </article>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Simulate monthly draw</h2>
          <form action={simulateMonthlyDrawAction} className="mt-4 space-y-3">
            <select
              name="mode"
              className="w-full rounded-lg border border-black/15 px-4 py-2"
              defaultValue="RANDOM"
            >
              <option value="RANDOM">Random</option>
              <option value="WEIGHTED_MOST_FREQUENT">Weighted (most frequent scores)</option>
              <option value="WEIGHTED_LEAST_FREQUENT">Weighted (least frequent scores)</option>
            </select>
            <PendingSubmitButton type="submit" pendingLabel="Running..." className="rounded-lg bg-black px-4 py-2 text-white">
              Run Simulation
            </PendingSubmitButton>
          </form>
        </article>

        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Publish monthly draw</h2>
          <form action={publishMonthlyDrawAction} className="mt-4">
            <PendingSubmitButton type="submit" pendingLabel="Publishing..." className="rounded-lg bg-accent px-4 py-2 text-white">
              Publish Results
            </PendingSubmitButton>
          </form>
        </article>
      </section>

      <section className="mt-8 rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
        <h2 className="text-lg font-medium">Winner verification and payouts</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {recentWinners.map((winner) => (
            <li key={winner.id} className="rounded-lg border border-black/10 bg-surface/85 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {winner.user.fullName} - Draw {winner.draw.month}/{winner.draw.year} - {winner.tier}
                </span>
                <strong>GBP {(winner.amountInMinor / 100).toFixed(2)}</strong>
              </div>

              <p className="mt-1 text-black/70">
                Verification: {winner.verification?.status ?? "PENDING_PROOF"} | Payout: {winner.payoutStatus}
              </p>

              {winner.verification?.proofBlobUrl && (
                <p className="mt-1">
                  <a href={winner.verification.proofBlobUrl} className="underline" target="_blank" rel="noreferrer">
                    View proof
                  </a>
                </p>
              )}

              {winner.verification && winner.verification.status === "PENDING" && (
                <form action={reviewWinnerVerificationAction} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="verificationId" value={winner.verification.id} />
                  <input
                    type="text"
                    name="adminNotes"
                    placeholder="Optional review notes"
                    className="rounded-lg border border-black/15 px-3 py-2"
                  />
                  <PendingSubmitButton
                    type="submit"
                    name="status"
                    value="APPROVED"
                    pendingLabel="Submitting..."
                    className="rounded-lg bg-black px-3 py-2 text-white"
                  >
                    Approve
                  </PendingSubmitButton>
                  <PendingSubmitButton
                    type="submit"
                    name="status"
                    value="REJECTED"
                    pendingLabel="Submitting..."
                    className="rounded-lg border border-black/25 px-3 py-2"
                  >
                    Reject
                  </PendingSubmitButton>
                </form>
              )}

              {winner.verification?.status === "APPROVED" && winner.payoutStatus === "PENDING" && (
                <form action={markWinnerPaidAction} className="mt-3">
                  <input type="hidden" name="winnerId" value={winner.id} />
                  <PendingSubmitButton type="submit" pendingLabel="Updating..." className="rounded-lg bg-accent px-3 py-2 text-white">
                    Mark Paid
                  </PendingSubmitButton>
                </form>
              )}
            </li>
          ))}

          {recentWinners.length === 0 && <li className="text-black/60">No winners yet.</li>}
        </ul>
      </section>

      <section className="mt-8 grid gap-6 md:grid-cols-2">
        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Top charities by contribution</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {topContributionRows.map((row) => (
              <li key={row.charityName} className="flex items-center justify-between rounded-lg border border-black/10 bg-surface/85 px-3 py-2">
                <span>{row.charityName}</span>
                <strong>GBP {(row.amountInMinor / 100).toFixed(2)}</strong>
              </li>
            ))}
            {topContributionRows.length === 0 && <li className="text-black/60">No charity contributions yet.</li>}
          </ul>
        </article>

        <article className="rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
          <h2 className="text-lg font-medium">Recent audit events</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {recentAudit.map((event) => (
              <li key={event.id} className="rounded-lg border border-black/10 bg-surface/85 px-3 py-2">
                <p className="font-medium">{event.action}</p>
                <p className="text-black/70">{event.entity}{event.entityId ? ` (${event.entityId})` : ""}</p>
                <p className="text-black/60">{event.user?.fullName ?? "System"} - {event.createdAt.toLocaleString()}</p>
              </li>
            ))}
            {recentAudit.length === 0 && <li className="text-black/60">No audit events yet.</li>}
          </ul>

          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-black/60">Page {auditPage} of {auditTotalPages}</p>
            <div className="flex items-center gap-2">
              {auditPage > 1 ? (
                <Link href={buildAuditPageHref(auditPage - 1)} className="rounded-lg border border-black/20 px-3 py-1.5 hover:border-black/35">
                  &lt;
                </Link>
              ) : (
                <span className="rounded-lg border border-black/10 px-3 py-1.5 text-black/30">&lt;</span>
              )}

              {auditPage < auditTotalPages ? (
                <Link href={buildAuditPageHref(auditPage + 1)} className="rounded-lg border border-black/20 px-3 py-1.5 hover:border-black/35">
                  &gt;
                </Link>
              ) : (
                <span className="rounded-lg border border-black/10 px-3 py-1.5 text-black/30">&gt;</span>
              )}
            </div>
          </div>
        </article>
      </section>

      <section id="charity-management" className="mt-8 rounded-xl border border-black/10 bg-white/65 p-5 shadow-sm">
        <h2 className="text-lg font-medium">Charity Management</h2>
        <p className="mt-1 text-sm text-black/65">Create charities in one section and edit existing charities from explicit Edit buttons.</p>

        <article className="mt-4 rounded-xl border border-black/10 bg-surface/85 p-4">
          <h3 className="text-base font-semibold">Create New Charity</h3>

          <form action={createCharityAction} className="mt-3 grid gap-2 rounded-lg border border-black/10 p-3 md:grid-cols-2">
            <input name="name" placeholder="Charity name" className="rounded-lg border border-black/15 px-3 py-2" required />
            <input name="slug" placeholder="slug-format" className="rounded-lg border border-black/15 px-3 py-2" required />
            <input name="websiteUrl" placeholder="https://example.org" className="rounded-lg border border-black/15 px-3 py-2" />
            <input name="imageUrl" placeholder="https://image-url" className="rounded-lg border border-black/15 px-3 py-2" />
            <textarea name="description" placeholder="Description" className="md:col-span-2 rounded-lg border border-black/15 px-3 py-2" rows={3} required />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" />Featured</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked />Active</label>
            <PendingSubmitButton type="submit" pendingLabel="Creating..." className="md:col-span-2 rounded-lg bg-black px-4 py-2 text-white">
              Create Charity
            </PendingSubmitButton>
          </form>
        </article>

        <article className="mt-4 rounded-xl border border-black/10 bg-surface/85 p-4">
          <h3 className="text-base font-semibold">Existing Charities</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {charities.map((charity) => (
              <li key={charity.id} className="rounded-lg border border-black/10 bg-white/75 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{charity.name}</p>
                    <p className="text-black/65">/{charity.slug}</p>
                    <p className="mt-1 text-black/70">
                      {charity.featured ? "Featured" : "Standard"} | {charity.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={buildEditCharityHref(charity.id)} className="rounded-lg border border-black/20 px-3 py-1.5 hover:border-black/35">
                      Edit
                    </Link>

                    <form action={toggleCharityActiveAction}>
                      <input type="hidden" name="charityId" value={charity.id} />
                      <PendingSubmitButton type="submit" pendingLabel="Updating..." className="rounded-lg border border-black/20 px-3 py-1.5">
                        {charity.isActive ? "Deactivate" : "Activate"}
                      </PendingSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            ))}
            {charities.length === 0 && <li className="text-black/60">No charities configured yet.</li>}
          </ul>
        </article>

        {selectedCharity && (
          <article className="mt-4 rounded-xl border border-black/20 bg-amber-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">Edit Charity: {selectedCharity.name}</h3>
              <Link href={buildClearEditHref()} className="rounded-lg border border-black/20 px-3 py-1.5 text-sm hover:border-black/35">
                Close
              </Link>
            </div>

            <form action={updateCharityAction} className="mt-3 grid gap-2 rounded-lg border border-black/10 p-3 md:grid-cols-2">
              <input type="hidden" name="charityId" value={selectedCharity.id} />
              <input name="name" defaultValue={selectedCharity.name} className="rounded-lg border border-black/15 px-3 py-2" required />
              <input name="slug" defaultValue={selectedCharity.slug} className="rounded-lg border border-black/15 px-3 py-2" required />
              <input name="websiteUrl" defaultValue={selectedCharity.websiteUrl ?? ""} className="rounded-lg border border-black/15 px-3 py-2" />
              <input name="imageUrl" defaultValue={selectedCharity.imageUrl ?? ""} className="rounded-lg border border-black/15 px-3 py-2" />
              <textarea name="description" defaultValue={selectedCharity.description} className="md:col-span-2 rounded-lg border border-black/15 px-3 py-2" rows={3} required />
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={selectedCharity.featured} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isActive" defaultChecked={selectedCharity.isActive} />Active</label>
              <PendingSubmitButton type="submit" pendingLabel="Saving..." className="md:col-span-2 rounded-lg border border-black/20 px-4 py-2">
                Save Changes
              </PendingSubmitButton>
            </form>
          </article>
        )}
      </section>
    </main>
  );
}
