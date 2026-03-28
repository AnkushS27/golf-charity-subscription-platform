import Link from "next/link";
import { ExternalLink, HandHeart, Sparkles, UserPlus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export default async function CharitiesPage() {
  const charities = await prisma.charity.findMany({
    where: { isActive: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
  });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="inline-flex items-center gap-2 text-3xl font-semibold">
          <HandHeart className="h-7 w-7" aria-hidden="true" />
          Charity Directory
        </h1>
        <Link href="/signup" className="rounded-full bg-accent px-4 py-2 text-sm text-white">
          <span className="inline-flex items-center gap-1.5">
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Subscribe and Support
          </span>
        </Link>
      </div>

      <p className="mt-3 max-w-3xl text-black/70">
        Choose a charity during signup and direct at least 10% of your subscription to real impact.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {charities.map((charity) => (
          <article key={charity.id} className="rounded-2xl border border-black/10 bg-surface p-5">
            {charity.featured && (
              <p className="inline-flex rounded-full border border-black/20 px-2 py-1 text-[11px] font-semibold tracking-[0.12em]">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  FEATURED
                </span>
              </p>
            )}
            <h2 className="mt-3 text-xl font-semibold">{charity.name}</h2>
            <p className="mt-2 text-sm text-black/70">{charity.description}</p>
            {charity.websiteUrl && (
              <a className="mt-3 inline-block text-sm underline" href={charity.websiteUrl} target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-1.5">
                  Visit Website
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
