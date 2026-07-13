import { prisma } from "@/lib/prisma";
import { scoreAll } from "@/lib/scoring";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function cell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const opps = await prisma.opportunity.findMany({ orderBy: { displayId: "asc" } });
  const scored = scoreAll(opps, new Date());
  const headers = [
    "displayId", "name", "funder", "type", "stage", "status", "owner", "fullDeadline",
    "expectedAmount", "currency", "probability", "expectedValueUsd", "daysToDeadline",
    "urgency", "ease", "money", "priorityScore", "priorityBand",
  ];
  const lines = [headers.join(",")];
  for (const o of scored) {
    lines.push(
      [
        o.displayId, o.name, o.funderOrganization, o.type, o.stage, o.status, o.owner ?? "",
        o.fullDeadlineText ?? "", o.expectedAmount, o.currency, o.probability,
        o.scores.expectedValueUsd.toFixed(2), o.scores.daysToDeadline ?? "",
        o.scores.urgencyScore, o.scores.easeScore, o.scores.moneyScore,
        o.scores.priorityScore, o.scores.priorityBand,
      ].map(cell).join(","),
    );
  }
  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="agtt-opportunities-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

