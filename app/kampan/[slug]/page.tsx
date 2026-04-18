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
import { formatCzk } from "@/lib/format";
import { Header } from "@/components/Header";
import { CampaignDetailHeader } from "@/components/CampaignDetailHeader";
import { MetricCard } from "@/components/MetricCard";
import { DeploymentsTable } from "@/components/DeploymentsTable";
import { CreativeGrid } from "@/components/CreativeGrid";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CampaignPage({ params }: Props) {
  return (
    <>
      <Header clientName="Lindström" />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Suspense fallback={<DetailSkeleton />}>
          <CampaignDetail params={params} />
        </Suspense>
      </main>
    </>
  );
}

async function CampaignDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getAllData();
  const kampan = findCampaignBySlug(data, slug);
  if (!kampan) notFound();

  const deployments = getDeploymentsForCampaign(data, kampan.nazev);
  const creatives = getCreativesForCampaign(data, kampan.nazev);
  const totalBudget = getCampaignBudget(data.nasazeni, kampan.nazev);
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
        href="/"
        className="text-[13px] inline-block"
        style={{ color: "var(--foreground-muted)" }}
      >
        ← Zpět na přehled
      </Link>

      <CampaignDetailHeader kampan={kampan} />

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Celkový rozpočet"
          value={formatCzk(totalBudget)}
          hint="součet všech nasazení"
        />
        <MetricCard label="Počet nasazení" value={String(deployments.length)} />
        <MetricCard label="Délka kampaně" value={`${duration} dní`} />
      </section>

      <DeploymentsTable deployments={deployments} />
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
