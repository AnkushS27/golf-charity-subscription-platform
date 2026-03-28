"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, HandHeart, LayoutDashboard, LogIn, LogOut, Settings, Shield, Sparkles, Trophy } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";
import { updateEmailPreferencesAction } from "@/app/actions/preferences";
import { PendingSubmitButton } from "@/app/components/pending-submit-button";

const PAGE_SIZE = 5;

type SiteNavClientProps = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  fullName?: string;
  notificationItems?: Array<{
    subject: string;
    createdAtLabel: string;
  }>;
  winningItems?: Array<{
    drawLabel: string;
    tier: string;
    amountLabel: string;
    verificationStatus: string;
    payoutStatus: string;
  }>;
  emailEnabled?: boolean;
};

function getNavLinkClass(isActive: boolean) {
  return isActive
    ? "rounded-full border border-black/25 bg-black px-3 py-1.5 text-white"
    : "rounded-full border border-black/15 px-3 py-1.5 hover:border-black/30";
}

function isLinkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteNavClient({
  isAuthenticated,
  isAdmin,
  fullName,
  notificationItems = [],
  winningItems = [],
  emailEnabled = true,
}: SiteNavClientProps) {
  const pathname = usePathname();
  const [notificationPage, setNotificationPage] = useState(0);
  const [winningPage, setWinningPage] = useState(0);

  const notificationPageCount = Math.max(1, Math.ceil(notificationItems.length / PAGE_SIZE));
  const winningPageCount = Math.max(1, Math.ceil(winningItems.length / PAGE_SIZE));

  const pagedNotificationItems = notificationItems.slice(
    notificationPage * PAGE_SIZE,
    notificationPage * PAGE_SIZE + PAGE_SIZE,
  );

  const pagedWinningItems = winningItems.slice(winningPage * PAGE_SIZE, winningPage * PAGE_SIZE + PAGE_SIZE);

  return (
    <header className="border-b border-black/10 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3 md:px-10">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-sm font-semibold tracking-[0.18em] text-muted">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              FAIRWAY FORWARD
            </span>
          </Link>
          <div className="hidden h-5 w-px bg-black/15 md:block" />
          <div className="flex items-center gap-2 text-sm">
            <Link href="/charities" className={getNavLinkClass(isLinkActive(pathname, "/charities"))}>
              <span className="inline-flex items-center gap-1.5">
                <HandHeart className="h-3.5 w-3.5" aria-hidden="true" />
                Charities
              </span>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard" className={getNavLinkClass(isLinkActive(pathname, "/dashboard"))}>
                <span className="inline-flex items-center gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  Dashboard
                </span>
              </Link>
            )}
            {isAdmin && (
              <Link href="/admin/dashboard" className={getNavLinkClass(isLinkActive(pathname, "/admin/dashboard"))}>
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                  Admin
                </span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {!isAuthenticated && (
            <>
              <Link href="/login" className={getNavLinkClass(isLinkActive(pathname, "/login"))}>
                <span className="inline-flex items-center gap-1.5">
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  Log in
                </span>
              </Link>
              <Link
                href="/signup"
                className={
                  isLinkActive(pathname, "/signup")
                    ? "rounded-full bg-accent-strong px-4 py-2 text-white"
                    : "rounded-full bg-accent px-4 py-2 text-white hover:bg-accent-strong"
                }
              >
                Sign up
              </Link>
            </>
          )}

          {isAuthenticated && (
            <>
              <span className="hidden text-black/70 md:inline">{fullName}</span>

              <div className="group relative">
                <button
                  type="button"
                  className="rounded-full border border-black/15 p-2 hover:border-black/30"
                  aria-label="Notifications"
                >
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="invisible absolute right-0 top-11 z-20 w-80 rounded-xl border border-black/10 bg-white p-3 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <p className="text-xs font-semibold tracking-[0.12em] text-black/60">NOTIFICATIONS</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {pagedNotificationItems.map((item, index) => (
                      <li key={`${item.subject}-${index}`} className="rounded-lg border border-black/10 px-3 py-2">
                        <p className="font-medium">{item.subject}</p>
                        <p className="text-xs text-black/60">{item.createdAtLabel}</p>
                      </li>
                    ))}
                    {notificationItems.length === 0 && <li className="text-black/60">No notifications yet.</li>}
                  </ul>
                  {notificationPageCount > 1 && (
                    <div className="mt-3 flex items-center justify-between text-xs text-black/70">
                      <button
                        type="button"
                        aria-label="Previous notifications page"
                        disabled={notificationPage === 0}
                        onClick={() => setNotificationPage((page) => Math.max(0, page - 1))}
                        className="rounded border border-black/20 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        &lt;
                      </button>
                      <span>
                        {notificationPage + 1} / {notificationPageCount}
                      </span>
                      <button
                        type="button"
                        aria-label="Next notifications page"
                        disabled={notificationPage >= notificationPageCount - 1}
                        onClick={() => setNotificationPage((page) => Math.min(notificationPageCount - 1, page + 1))}
                        className="rounded border border-black/20 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  className="rounded-full border border-black/15 p-2 hover:border-black/30"
                  aria-label="Winnings and verification"
                >
                  <Trophy className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="invisible absolute right-0 top-11 z-20 w-96 rounded-xl border border-black/10 bg-white p-3 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <p className="text-xs font-semibold tracking-[0.12em] text-black/60">WINNINGS & VERIFICATION</p>
                  <ul className="mt-2 space-y-2 text-sm">
                    {pagedWinningItems.map((item, index) => (
                      <li key={`${item.drawLabel}-${item.tier}-${index}`} className="rounded-lg border border-black/10 px-3 py-2">
                        <p className="font-medium">
                          Draw {item.drawLabel} - {item.tier}
                        </p>
                        <p className="text-xs text-black/70">
                          {item.amountLabel} | Verification: {item.verificationStatus} | Payout: {item.payoutStatus}
                        </p>
                      </li>
                    ))}
                    {winningItems.length === 0 && <li className="text-black/60">No winnings yet.</li>}
                  </ul>
                  {winningPageCount > 1 && (
                    <div className="mt-3 flex items-center justify-between text-xs text-black/70">
                      <button
                        type="button"
                        aria-label="Previous winnings page"
                        disabled={winningPage === 0}
                        onClick={() => setWinningPage((page) => Math.max(0, page - 1))}
                        className="rounded border border-black/20 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        &lt;
                      </button>
                      <span>
                        {winningPage + 1} / {winningPageCount}
                      </span>
                      <button
                        type="button"
                        aria-label="Next winnings page"
                        disabled={winningPage >= winningPageCount - 1}
                        onClick={() => setWinningPage((page) => Math.min(winningPageCount - 1, page + 1))}
                        className="rounded border border-black/20 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        &gt;
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="group relative">
                <button
                  type="button"
                  className="rounded-full border border-black/15 p-2 hover:border-black/30"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" aria-hidden="true" />
                </button>
                <div className="invisible absolute right-0 top-11 z-20 w-80 rounded-xl border border-black/10 bg-white p-3 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <p className="text-xs font-semibold tracking-[0.12em] text-black/60">SETTINGS</p>
                  <form action={updateEmailPreferencesAction} className="mt-2 space-y-3 text-sm">
                    <input type="hidden" name="nextPath" value={pathname} />
                    <label className="flex items-start gap-2 rounded-lg border border-black/10 px-3 py-2">
                      <input type="checkbox" name="emailEnabled" defaultChecked={emailEnabled} className="mt-0.5" />
                      <span>Receive email updates for draws, subscription changes, and payouts</span>
                    </label>
                    <PendingSubmitButton type="submit" pendingLabel="Saving..." className="w-full rounded-lg border border-black/20 px-3 py-2">
                      Save Preferences
                    </PendingSubmitButton>
                  </form>
                </div>
              </div>

              <form action={signOutAction}>
                <PendingSubmitButton
                  type="submit"
                  pendingLabel="Logging out..."
                  className="rounded-full border border-black/15 px-4 py-2 hover:border-black/30"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                    Log out
                  </span>
                </PendingSubmitButton>
              </form>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}