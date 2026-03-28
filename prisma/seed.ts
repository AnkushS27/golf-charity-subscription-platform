import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, BillingCycle, SubscriptionStatus, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run seed");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const demoPasswordHash = await bcrypt.hash("Password123", 12);

  const [monthlyPlan, yearlyPlan] = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { code: "monthly" },
      update: {},
      create: {
        code: "monthly",
        name: "Monthly",
        billingCycle: BillingCycle.MONTHLY,
        amountInMinor: 1900,
        currency: "GBP",
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { code: "yearly" },
      update: {},
      create: {
        code: "yearly",
        name: "Yearly",
        billingCycle: BillingCycle.YEARLY,
        amountInMinor: 19000,
        currency: "GBP",
      },
    }),
  ]);

  const charities = [
    {
      slug: "youth-golf-trust",
      name: "Youth Golf Trust",
      description: "Expanding access to golf for underserved youth communities.",
      featured: true,
    },
    {
      slug: "green-fairways-fund",
      name: "Green Fairways Fund",
      description: "Funding ecological restoration across community golf facilities.",
      featured: false,
    },
  ];

  for (const charity of charities) {
    await prisma.charity.upsert({
      where: { slug: charity.slug },
      update: charity,
      create: charity,
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@golfcharity.dev" },
    update: {
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "admin@golfcharity.dev",
      fullName: "Platform Admin",
      role: UserRole.ADMIN,
      passwordHash: demoPasswordHash,
    },
  });

  const subscriber = await prisma.user.upsert({
    where: { email: "player@golfcharity.dev" },
    update: {
      passwordHash: demoPasswordHash,
    },
    create: {
      email: "player@golfcharity.dev",
      fullName: "Demo Subscriber",
      role: UserRole.SUBSCRIBER,
      passwordHash: demoPasswordHash,
    },
  });

  await prisma.subscription.upsert({
    where: {
      id: "seed-subscription-1",
    },
    update: {},
    create: {
      id: "seed-subscription-1",
      userId: subscriber.id,
      planId: monthlyPlan.id,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  await Promise.all(
    [42, 38, 35, 40, 37].map((score, index) =>
      prisma.scoreEntry.create({
        data: {
          userId: subscriber.id,
          score,
          playedAt: new Date(Date.now() - index * 1000 * 60 * 60 * 24),
        },
      }),
    ),
  );

  console.log("Seed complete", {
    monthlyPlanId: monthlyPlan.id,
    yearlyPlanId: yearlyPlan.id,
    adminId: admin.id,
    subscriberId: subscriber.id,
    demoPassword: "Password123",
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
