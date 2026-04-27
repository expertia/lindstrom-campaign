import type {
  Country,
  Kampan,
  Kreativa,
  Nasazeni,
  SheetData,
} from "@/types";
import { toSlug } from "@/lib/slug";

function startOfDay(d: Date): Date {
  const n = new Date(d.getTime());
  n.setHours(0, 0, 0, 0);
  return n;
}

function daysBetweenInclusive(start: Date, end: Date): number {
  const a = startOfDay(start).getTime();
  const b = startOfDay(end).getTime();
  if (b < a) return 0;
  return Math.floor((b - a) / 86_400_000) + 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function monthEnd(year: number, month: number): Date {
  return new Date(year, month, daysInMonth(year, month), 23, 59, 59, 999);
}

// --- Country filtering ---

export function filterKampaneByCountry(
  kampane: Kampan[],
  country: Country,
): Kampan[] {
  return kampane.filter((k) => k.zeme === country);
}

export function filterNasazeniByCountry(
  nasazeni: Nasazeni[],
  country: Country,
): Nasazeni[] {
  return nasazeni.filter((n) => n.zeme === country);
}

export function filterKreativyByCountry(
  kreativy: Kreativa[],
  country: Country,
): Kreativa[] {
  return kreativy.filter((k) => k.zeme.includes(country));
}

// --- Deployment math ---

export function getDeploymentDurationDays(d: Nasazeni): number {
  if (!d.start || !d.konec) return 0;
  return daysBetweenInclusive(d.start, d.konec);
}

export function getDailyAverage(d: Nasazeni): number {
  if (!d.rozpocet || d.rozpocet <= 0) return 0;
  if (d.typRozpoctu === "Měsíční") {
    return d.rozpocet / 30;
  }
  const days = getDeploymentDurationDays(d);
  if (days <= 0) return 0;
  return d.rozpocet / days;
}

export function getOverlapDaysInMonth(
  d: Nasazeni,
  year: number,
  month: number,
): number {
  if (!d.start || !d.konec) return 0;
  const mStart = monthStart(year, month);
  const mEnd = monthEnd(year, month);
  const a = d.start > mStart ? d.start : mStart;
  const b = d.konec < mEnd ? d.konec : mEnd;
  if (b < a) return 0;
  return daysBetweenInclusive(a, b);
}

export function isActiveInMonth(
  d: Nasazeni,
  year: number,
  month: number,
): boolean {
  return getOverlapDaysInMonth(d, year, month) > 0;
}

export function getDeploymentBudgetForMonth(
  d: Nasazeni,
  year: number,
  month: number,
): number {
  if (d.typRozpoctu === "Měsíční") {
    const overlap = getOverlapDaysInMonth(d, year, month);
    const dim = daysInMonth(year, month);
    if (!d.rozpocet || dim === 0) return 0;
    return d.rozpocet * (overlap / dim);
  }
  const daily = getDailyAverage(d);
  const overlap = getOverlapDaysInMonth(d, year, month);
  return daily * overlap;
}

// --- Aggregations (all take pre-filtered country-scoped deployments) ---

export function getCurrentMonthBudget(
  deployments: Nasazeni[],
  year: number,
  month: number,
): number {
  return deployments.reduce(
    (sum, d) => sum + getDeploymentBudgetForMonth(d, year, month),
    0,
  );
}

export function getBudgetBySystem(
  deployments: Nasazeni[],
  year: number,
  month: number,
): Array<{ system: string; budget: number }> {
  const map = new Map<string, number>();
  for (const d of deployments) {
    if (!isActiveInMonth(d, year, month)) continue;
    const system = d.system || "Neurčeno";
    const budget = getDeploymentBudgetForMonth(d, year, month);
    map.set(system, (map.get(system) ?? 0) + budget);
  }
  return Array.from(map, ([system, budget]) => ({ system, budget })).sort(
    (a, b) => b.budget - a.budget,
  );
}

export function getGoalBudget(
  kampane: Kampan[],
  deployments: Nasazeni[],
  goal: "Brand" | "Lead",
  year: number,
  month: number,
): number {
  const matchingNames = new Set(
    kampane
      .filter((k) => k.cil === goal || k.cil === "Hybrid")
      .map((k) => k.nazev),
  );
  return deployments
    .filter((d) => matchingNames.has(d.kampan))
    .reduce((sum, d) => sum + getDeploymentBudgetForMonth(d, year, month), 0);
}

export function getActiveCampaignsCount(kampane: Kampan[]): number {
  return kampane.filter((k) => k.status === "Běží").length;
}

// --- Per-campaign helpers (used on detail page) ---

export function getDeploymentsForCampaign(
  data: SheetData,
  country: Country,
  campaignName: string,
): Nasazeni[] {
  return data.nasazeni.filter(
    (n) => n.zeme === country && n.kampan === campaignName,
  );
}

export function getCreativesForCampaign(
  data: SheetData,
  country: Country,
  campaignName: string,
): Kreativa[] {
  const deployments = getDeploymentsForCampaign(data, country, campaignName);
  const ids = new Set(deployments.flatMap((d) => d.kreativy));
  const byName = new Map(data.kreativy.map((k) => [k.nazev, k]));
  const result: Kreativa[] = [];
  for (const id of ids) {
    const k = byName.get(id);
    if (k) {
      // dvojí pojistka: kreativa musí pokrývat danou zemi
      if (k.zeme.length === 0 || k.zeme.includes(country)) result.push(k);
    } else if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[data] Kreativa "${id}" referenced from Nasazeni not found in Kreativy sheet`,
      );
    }
  }
  return result;
}

export function findCampaignBySlug(
  data: SheetData,
  country: Country,
  slug: string,
): Kampan | null {
  return (
    data.kampane.find((k) => {
      if (k.zeme !== country) return false;
      const kSlug = k.slug || toSlug(k.nazev);
      return kSlug === slug;
    }) ?? null
  );
}

export function getCampaignsInWindow(
  kampane: Kampan[],
  windowStart: Date,
  windowEnd: Date,
): Kampan[] {
  return kampane
    .filter((k) => {
      if (!k.start || !k.konec) return false;
      return k.start <= windowEnd && k.konec >= windowStart;
    })
    .slice()
    .sort((a, b) => {
      const as = a.start?.getTime() ?? 0;
      const bs = b.start?.getTime() ?? 0;
      return as - bs;
    });
}

export function getCampaignBudget(
  deployments: Nasazeni[],
  campaignName: string,
): number {
  return deployments
    .filter((d) => d.kampan === campaignName)
    .reduce((sum, d) => sum + (d.rozpocet ?? 0), 0);
}
