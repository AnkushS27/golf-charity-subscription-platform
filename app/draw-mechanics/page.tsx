import Link from "next/link";
import { ArrowRight, ChartPie, Dice5, ListChecks, Ticket } from "lucide-react";

const tiers = [
  { match: "5-Number Match", split: "40%", rollover: "Yes" },
  { match: "4-Number Match", split: "35%", rollover: "No" },
  { match: "3-Number Match", split: "25%", rollover: "No" },
];

export default function DrawMechanicsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold">
          <Ticket className="h-7 w-7" aria-hidden="true" />
          How Monthly Draws Work
        </h1>
        <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm text-white">
          <span className="inline-flex items-center gap-1.5">
            Join This Month
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        </Link>
      </div>

      <section className="mt-8 rounded-2xl border border-black/10 p-5">
        <h2 className="inline-flex items-center gap-2 text-xl font-medium">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
          1. Enter and maintain your latest five Stableford scores
        </h2>
        <p className="mt-2 text-sm text-black/70">
          Scores are validated in a 1 to 45 range, each score includes a date, and only your latest five are retained.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-black/10 p-5">
        <h2 className="inline-flex items-center gap-2 text-xl font-medium">
          <Dice5 className="h-5 w-5" aria-hidden="true" />
          2. Draw simulation before publishing
        </h2>
        <p className="mt-2 text-sm text-black/70">
          Admin can run simulation mode first, using either random draw generation or weighted score-frequency logic.
        </p>
      </section>

      <section className="mt-4 rounded-2xl border border-black/10 p-5">
        <h2 className="inline-flex items-center gap-2 text-xl font-medium">
          <ChartPie className="h-5 w-5" aria-hidden="true" />
          3. Tiered prize distribution
        </h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-105 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-black/10">
                <th className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                    Tier
                  </span>
                </th>
                <th className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ChartPie className="h-3.5 w-3.5" aria-hidden="true" />
                    Pool Share
                  </span>
                </th>
                <th className="py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    Rollover
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier) => (
                <tr key={tier.match} className="border-b border-black/5">
                  <td className="py-2">{tier.match}</td>
                  <td className="py-2">{tier.split}</td>
                  <td className="py-2">{tier.rollover}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
