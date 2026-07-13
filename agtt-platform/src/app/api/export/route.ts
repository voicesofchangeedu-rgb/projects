import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Full JSON backup of the whole dataset (raw inputs only — no computed scores are stored).
export async function GET() {
  const opportunities = await prisma.opportunity.findMany({ orderBy: { displayId: "asc" } });
  const outreach = await prisma.outreachLogEntry.findMany({ orderBy: { date: "asc" } });
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    opportunities,
    outreach,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="agtt-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

