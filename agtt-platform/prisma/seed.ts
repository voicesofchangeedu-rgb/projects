// Seeds the 40 real opportunities extracted from the AGTT sheet (2026-07-13).
// The "_cached*" parity fields in seed-data.json are stripped here — they exist only for the
// engine's parity tests, never for the DB.

import { PrismaClient } from "@prisma/client";
import seed from "../src/seed-data.json";

const prisma = new PrismaClient();

function d(v: string | null | undefined): Date | null {
  if (!v) return null;
  const dt = new Date(v.length === 10 ? v + "T00:00:00.000Z" : v);
  return isNaN(dt.getTime()) ? null : dt;
}

async function main() {
  const rows = seed as any[];
  let created = 0;
  for (const r of rows) {
    const { _cachedPriority, _cachedBand, _cachedDays, ...rest } = r;
    const data = {
      ...rest,
      openDate: d(rest.openDate),
      loiDeadline: d(rest.loiDeadline),
      fullDeadline: d(rest.fullDeadline),
      decisionDate: d(rest.decisionDate),
      nextActionDate: d(rest.nextActionDate),
      nextFollowupDate: d(rest.nextFollowupDate),
    };
    await prisma.opportunity.upsert({
      where: { displayId: data.displayId },
      update: data,
      create: data,
    });
    created++;
  }
  console.log(`Seeded ${created} opportunities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

