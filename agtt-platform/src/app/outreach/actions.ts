"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

export async function createOutreach(fd: FormData) {
  const dateStr = (fd.get("date") ?? "").toString().trim();
  const date = dateStr ? new Date(dateStr + "T00:00:00.000Z") : new Date();
  const nextStepStr = (fd.get("nextStepDate") ?? "").toString().trim();
  const impactStr = (fd.get("relationshipImpact") ?? "").toString().trim();

  await prisma.outreachLogEntry.create({
    data: {
      date: isNaN(date.getTime()) ? new Date() : date,
      organization: (fd.get("organization") ?? "").toString().trim() || "—",
      contactName: str(fd.get("contactName")),
      contactEmail: str(fd.get("contactEmail")),
      method: (fd.get("method") ?? "Email").toString(),
      purpose: str(fd.get("purpose")),
      outcome: str(fd.get("outcome")),
      nextStep: str(fd.get("nextStep")),
      nextStepDate: nextStepStr ? new Date(nextStepStr + "T00:00:00.000Z") : null,
      owner: str(fd.get("owner")),
      relatedOpportunityId: str(fd.get("relatedOpportunityId")),
      relationshipImpact: impactStr ? parseInt(impactStr, 10) : null,
      notes: str(fd.get("notes")),
      link: str(fd.get("link")),
    },
  });
  revalidatePath("/outreach");
  const opp = str(fd.get("relatedOpportunityId"));
  if (opp) revalidatePath(`/opportunities/${opp}`);
}

export async function deleteOutreach(id: string) {
  await prisma.outreachLogEntry.delete({ where: { id } });
  revalidatePath("/outreach");
}

