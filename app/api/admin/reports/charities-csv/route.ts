import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { toErrorResponse } from "@/lib/errors";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user || user.role !== UserRole.ADMIN) {
      return NextResponse.json({ message: "Forbidden", code: "FORBIDDEN" }, { status: 403 });
    }

    const charities = await prisma.charity.findMany({
      orderBy: { name: "asc" },
      include: {
        contributions: { select: { amountInMinor: true } },
        donations: { select: { amountInMinor: true } },
      },
    });

    const rows = charities.map((charity) => {
      const contributionsInMinor = charity.contributions.reduce((sum, item) => sum + item.amountInMinor, 0);
      const donationsInMinor = charity.donations.reduce((sum, item) => sum + item.amountInMinor, 0);
      const totalInMinor = contributionsInMinor + donationsInMinor;

      return [
        charity.name,
        charity.slug,
        String(charity.featured),
        String(charity.isActive),
        String(contributionsInMinor),
        String(donationsInMinor),
        String(totalInMinor),
      ];
    });

    const csv = [
      [
        "charity_name",
        "slug",
        "featured",
        "is_active",
        "contributions_in_minor",
        "donations_in_minor",
        "total_impact_in_minor",
      ].join(","),
      ...rows.map((row) => row.map(csvEscape).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename=charity-report-${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });
  } catch (error) {
    const mapped = toErrorResponse(error);
    return NextResponse.json({ message: mapped.message, code: mapped.code }, { status: mapped.status });
  }
}
