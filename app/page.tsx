import Link from "next/link";
import { ArrowRight, HandHeart, LayoutDashboard, Sparkles, Ticket, Trophy } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10">
      <section className="grain mt-4 rounded-3xl border border-black/10 p-8 md:mt-8 md:grid md:grid-cols-[1.4fr_1fr] md:gap-10 md:p-10">
        <div>
          <p className="inline-flex rounded-full border border-black/15 px-3 py-1 text-xs font-semibold tracking-[0.12em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              SCORES. DRAWS. CHARITY.
            </span>
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
            Play better golf.
            <br />
            Fund real causes.
            <br />
            Win every month.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted md:text-lg">
            Track your latest five Stableford scores, join monthly prize draws, and direct a minimum of 10% of your
            subscription to the charity you care about most.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-black/85">
              <span className="inline-flex items-center gap-1.5">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
                Start Subscription
              </span>
            </Link>
            <Link href="/dashboard" className="rounded-full border border-black/20 px-6 py-3 text-sm font-medium transition hover:border-black/40">
              <span className="inline-flex items-center gap-1.5">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                Open Dashboard
              </span>
            </Link>
            <Link href="/charities" className="rounded-full border border-black/20 px-6 py-3 text-sm font-medium transition hover:border-black/40">
              <span className="inline-flex items-center gap-1.5">
                <HandHeart className="h-4 w-4" aria-hidden="true" />
                Explore Charities
              </span>
            </Link>
            <Link href="/draw-mechanics" className="rounded-full border border-black/20 px-6 py-3 text-sm font-medium transition hover:border-black/40">
              <span className="inline-flex items-center gap-1.5">
                <Ticket className="h-4 w-4" aria-hidden="true" />
                Draw Mechanics
              </span>
            </Link>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:mt-0">
          <article className="rounded-2xl border border-black/10 bg-surface p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted">MONTHLY DRAW</p>
            <p className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold">
              <Ticket className="h-6 w-6" aria-hidden="true" />
              5 Numbers
            </p>
            <p className="mt-1 text-sm text-muted">Random or weighted mode, admin-controlled simulation before publishing.</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-surface p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted">PRIZE ENGINE</p>
            <p className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold">
              <Trophy className="h-6 w-6" aria-hidden="true" />
              40 / 35 / 25
            </p>
            <p className="mt-1 text-sm text-muted">Tiered pool split with 5-match rollover and equal splits among tied winners.</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-surface p-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted">CHARITY IMPACT</p>
            <p className="mt-3 inline-flex items-center gap-2 text-2xl font-semibold">
              <HandHeart className="h-6 w-6" aria-hidden="true" />
              10% Minimum
            </p>
            <p className="mt-1 text-sm text-muted">Choose your charity at signup, then increase your contribution whenever you want.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
