import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const rawConnectionString = process.env.DATABASE_POOLER_URL ?? process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL;

if (!rawConnectionString) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const normalizedConnectionString = (() => {
  const parsed = new URL(rawConnectionString);

  // Supabase connections from serverless environments should explicitly require SSL.
  if (!parsed.searchParams.has("sslmode")) {
    parsed.searchParams.set("sslmode", "require");
  }

  // Keep current pg behavior for sslmode=require to avoid unexpected TLS chain failures.
  if (parsed.searchParams.get("sslmode") === "require" && !parsed.searchParams.has("uselibpqcompat")) {
    parsed.searchParams.set("uselibpqcompat", "true");
  }

  // If a transaction pooler URL is provided, it should include pgbouncer mode.
  if ((process.env.DATABASE_POOLER_URL || process.env.POSTGRES_PRISMA_URL) && !parsed.searchParams.has("pgbouncer")) {
    parsed.searchParams.set("pgbouncer", "true");
  }

  return parsed.toString();
})();

if (process.env.VERCEL === "1") {
  const hostname = new URL(normalizedConnectionString).hostname;
  if (hostname.startsWith("db.")) {
    throw new Error(
      "Vercel database config uses a direct Supabase host (db.*). Set DATABASE_POOLER_URL (or POSTGRES_PRISMA_URL) to the Supabase pooler URL and redeploy.",
    );
  }
}

const adapter = new PrismaPg({ connectionString: normalizedConnectionString });

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
