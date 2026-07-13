"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}
function req(v: FormDataEntryValue | null): string {
  return (v ?? "").toString().trim();
}
function num(v: FormDataEntryValue | null): number {
  const n = parseFloat((v ?? "").toString());
  return isNaN(n) ? 0 : n;
}
function date(v: FormDataEntryValue | null): Date | null {
  const s = (v ?? "").toString().trim();
  if (!s) return null;
  const d = new Date(s + "T00:00:00.000Z");
  return isNaN(d.getTime()) ? null : d;
}

function dtext(fd: FormData, name: string): string | null {
  const picked = str(fd.get(name));
  if (picked) return picked;
  return str(fd.get(`${name}__origtext`));
}

function parse(fd: FormData) {
  return {
    type: req(fd.get("type")) as any,
    name: req(fd.get("name")),
    funderOrganization: req(fd.get("funderOrganization")),
    programInitiative: str(fd.get("programInitiative")),
    website: str(fd.get("website")),
    geographyEligibility: str(fd.get("geographyEligibility")),
    thematicAreas: str(fd.get("thematicAreas")),
    openDate: date(fd.get("openDate")),
    openDateText: dtext(fd, "openDate"),
    loiRequired: fd.get("loiRequired") === "on",
    loiDeadline: date(fd.get("loiDeadline")),
    loiDeadlineText: dtext(fd, "loiDeadline"),
    fullDeadline: date(fd.get("fullDeadline")),
    fullDeadlineText: dtext(fd, "fullDeadline"),
    decisionDate: date(fd.get("decisionDate")),
    decisionDateText: dtext(fd, "decisionDate"),
    stage: req(fd.get("stage")) as any,
    status: req(fd.get("status")) as any,
    owner: str(fd.get("owner")),
    primaryContactName: str(fd.get("primaryContactName")),
    primaryContactEmail: str(fd.get("primaryContactEmail")),
    primaryContactPhone: str(fd.get("primaryContactPhone")),
    relationshipStrength: num(fd.get("relationshipStrength")),
    fitScore: num(fd.get("fitScore")),
    strategicValue: num(fd.get("strategicValue")),
    reportingBurden: num(fd.get("reportingBurden")),
    competitionLevel: num(fd.get("competitionLevel")),
    timeCommitmentHours: num(fd.get("timeCommitmentHours")),
    expectedAmount: num(fd.get("expectedAmount")),
    currency: req(fd.get("currency")) as any,
    probability: num(fd.get("probability")),
    nextAction: str(fd.get("nextAction")),
    nextActionDate: date(fd.get("nextActionDate")),
    nextActionDateText: dtext(fd, "nextActionDate"),
    lastContactDateText: dtext(fd, "lastContactDate"),
    nextFollowupDate: date(fd.get("nextFollowupDate")),
    nextFollowupDateText: dtext(fd, "nextFollowupDate"),
    reader: str(fd.get("reader")),
    recommender: str(fd.get("recommender")),
    signer: str(fd.get("signer")),
    kpis: str(fd.get("kpis")),
    institutionalPriorities: str(fd.get("institutionalPriorities")),
    languageToMirror: str(fd.get("languageToMirror")),
    keyRisks: str(fd.get("keyRisks")),
    heroFraming: str(fd.get("heroFraming")),
    notes: str(fd.get("notes")),
    docLink: str(fd.get("docLink")),
  };
}

async function nextDisplayId(): Promise<string> {
  const last = await prisma.opportunity.findMany({
    where: { displayId: { startsWith: "AGTT-" } },
    select: { displayId: true },
  });
  let max = 0;
  for (const r of last) {
    const n = parseInt(r.displayId.replace("AGTT-", ""), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return "AGTT-" + String(max + 1).padStart(4, "0");
}

export async function createOpportunity(fd: FormData) {
  const data = parse(fd);
  const displayId = await nextDisplayId();
  const created = await prisma.opportunity.create({ data: { ...data, displayId } });
  revalidatePath("/opportunities");
  revalidatePath("/");
  redirect(`/opportunities/${created.id}`);
}

export async function updateOpportunity(id: string, fd: FormData) {
  const data = parse(fd);
  await prisma.opportunity.update({ where: { id }, data });
  revalidatePath("/opportunities");
  revalidatePath(`/opportunities/${id}`);
  revalidatePath("/");
  revalidatePath("/timeline");
  redirect(`/opportunities/${id}`);
}

export async function deleteOpportunity(id: string) {
  await prisma.opportunity.delete({ where: { id } });
  revalidatePath("/opportunities");
  revalidatePath("/");
  redirect("/opportunities");
}

