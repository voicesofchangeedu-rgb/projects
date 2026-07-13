"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const DATE_FIELDS = [
  "openDate", "loiDeadline", "fullDeadline", "decisionDate", "nextActionDate", "nextFollowupDate",
] as const;

function reviveDates<T extends Record<string, any>>(obj: T): T {
  const out: any = { ...obj };
  for (const f of DATE_FIELDS) if (out[f]) out[f] = new Date(out[f]);
  // strip server-managed fields
  delete out.createdAt;
  delete out.updatedAt;
  return out;
}

export async function importData(_prev: unknown, fd: FormData): Promise<{ ok: boolean; message: string }> {
  const raw = (fd.get("json") ?? "").toString();
  if (!raw.trim()) return { ok: false, message: "Paste a JSON backup first." };
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "That is not valid JSON." };
  }
  const opps = Array.isArray(parsed.opportunities) ? parsed.opportunities : [];
  const outreach = Array.isArray(parsed.outreach) ? parsed.outreach : [];
  if (opps.length === 0 && outreach.length === 0) {
    return { ok: false, message: "No opportunities or outreach found in that JSON." };
  }

  let oppCount = 0;
  for (const o of opps) {
    const data = reviveDates(o);
    const id = data.id;
    delete data.id;
    if (!data.displayId) continue;
    await prisma.opportunity.upsert({
      where: { displayId: data.displayId },
      update: data,
      create: id ? { ...data, id } : data,
    });
    oppCount++;
  }

  let outCount = 0;
  for (const e of outreach) {
    const data: any = { ...e };
    if (data.date) data.date = new Date(data.date);
    if (data.nextStepDate) data.nextStepDate = new Date(data.nextStepDate);
    delete data.createdAt;
    const id = data.id;
    delete data.id;
    try {
      if (id) {
        await prisma.outreachLogEntry.upsert({ where: { id }, update: data, create: { ...data, id } });
      } else {
        await prisma.outreachLogEntry.create({ data });
      }
      outCount++;
    } catch {
      // skip entries whose related opportunity no longer exists, etc.
    }
  }

  revalidatePath("/");
  revalidatePath("/opportunities");
  revalidatePath("/outreach");
  revalidatePath("/timeline");
  return { ok: true, message: `Imported ${oppCount} opportunities and ${outCount} outreach entries.` };
}

