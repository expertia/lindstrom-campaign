import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAllData } from "@/lib/sheets";
import {
  findCampaignBySlug,
  getCampaignBudget,
  getCreativesForCampaign,
  getDeploymentDurationDays,
  getDeploymentsForCampaign,
} from "@/lib/data";
import { formatMoney } from "@/lib/format";
import { COUNTRY_TO_CURRENCY, isCountry, type Country } from "@/types";
import { CampaignDetailHeader } from "@/components/CampaignDetailHeader";
import { MetricCard } from "@/components/MetricCard";
import { DeploymentsTable } from "@/components/DeploymentsTable";
import { CreativeGrid } from "@/components/CreativeGrid";

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

export default function CampaignPage({ params }: Props) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8">
      <Suspense fallback={<DetailSkeleton />}>
        <CampaignDetail params={params} />
      </Suspense>
    </main>
  );
}

async function CampaignDetail({
  params,
}: {
  params: Promise<{ country: string; slug: string }>;
}) {
  const { country: rawCountry, slug } = await params;
  const country = rawCountry.toUpperCase();
  if (!isCountry(country)) notFound();

  const data = await getAllData();
  const kampan = findCampaignBySlug(data, country as Country, slug);
  if (!kampan) notFound();

  const deployments = getDeploymentsForCampaign(
    data,
    country as Country,
    kampan.nazev,
  );
  const creatives = getCreativesForCampaign(
    data,
    country as Country,
    kampan.nazev,
  );
  const totalBudget = getCampaignBudget(deployments, kampan.nazev);
  const currency = kampan.mena ?? COUNTRY_TO_CURRENCY[country as Country];
  const duration =
    kampan.start && kampan.konec
      ? deployments.length > 0
        ? Math.max(
            ...deployments.map((d) => getDeploymentDurationDays(d)),
            daysBetween(kampan.start, kampan.konec),
          )
        : daysBetween(kampan.start, kampan.konec)
      : 0;

  return (
    <div className="space-y-6">
      <Link
        href={`/${(country as Country).toLowerCase()}`}
        className="text-[13px] inline-block"
        style={{ color: "var(--foreground-muted)" }}
      >
        ← Zpět na přehled
      </Link>

      <CampaignDetailHeader kampan={kampan} />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Celkový rozpočet"
          value={formatMoney(totalBudget, currency)}
          hint="součet všech nasazení"
        />
        <MetricCard label="Počet nasazení" value={String(deployments.length)} />
        <MetricCard label="Délka kampaně" value={`${duration} dní`} />
      </section>

      <DeploymentsTable deployments={deployments} fallbackCurrency={currency} />
      <CreativeGrid creatives={creatives} />
    </div>
  );
}

function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000) + 1);
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div
        className="rounded-xl border bg-white h-[140px] animate-pulse"
        style={{ borderColor: "var(--border)" }}
      />
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 h-[92px] animate-pulse"
            style={{ background: "var(--background-muted)" }}
          />
        ))}
      </section>
      <div
        className="rounded-xl border bg-white h-[240px] animate-pulse"
        style={{ borderColor: "var(--border)" }}
      />
    </div>
  );
}
