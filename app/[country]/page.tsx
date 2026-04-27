import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/sheets";
import {
  filterKampaneByCountry,
  filterNasazeniByCountry,
  getActiveCampaignsCount,
  getBudgetBySystem,
  getCurrentMonthBudget,
  getGoalBudget,
} from "@/lib/data";
import { formatMoney, monthLong } from "@/lib/format";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  COUNTRY_TO_CURRENCY,
  isCountry,
  type Country,
} from "@/types";
import { MetricCard } from "@/components/MetricCard";
import { Timeline } from "@/components/Timeline";
import { BudgetBySystem } from "@/components/BudgetBySystem";

interface Props {
  params: Promise<{ country: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.toLowerCase() }));
}

export default function Page({ params }: Props) {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-8">
      <Suspense fallback={<DashboardSkeleton />}>
        <Dashboard params={params} />
      </Suspense>
    </main>
  );
}

async function Dashboard({ params }: { params: Promise<{ country: string }> }) {
  await connection();
  const { country: rawCountry } = await params;
  const country = rawCountry.toUpperCase();
  if (!isCountry(country)) notFound();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const data = await getAllData();

  const kampane = filterKampaneByCountry(data.kampane, country as Country);
  const nasazeni = filterNasazeniByCountry(data.nasazeni, country as Country);
  const currency = COUNTRY_TO_CURRENCY[country as Country];

  if (kampane.length === 0 && nasazeni.length === 0) {
    return <EmptyState country={country as Country} />;
  }

  const active = getActiveCampaignsCount(kampane);
  const monthBudget = getCurrentMonthBudget(nasazeni, year, month);
  const leadBudget = getGoalBudget(kampane, nasazeni, "Lead", year, month);
  const brandBudget = getGoalBudget(kampane, nasazeni, "Brand", year, month);

  const monthTitle = `Rozpočet ${monthLong(month)} ${year}`;
  const bySystem = getBudgetBySystem(nasazeni, year, month);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Aktivní kampaně"
          value={String(active)}
          hint={`z ${kampane.length} v evidenci`}
        />
        <MetricCard label={monthTitle} value={formatMoney(monthBudget, currency)} />
        <MetricCard
          label="Performance"
          value={formatMoney(leadBudget, currency)}
          hint="Lead + Hybrid"
        />
        <MetricCard
          label="Brand awareness"
          value={formatMoney(brandBudget, currency)}
          hint="Brand + Hybrid"
        />
      </section>

      <Timeline
        kampane={kampane}
        nasazeni={nasazeni}
        referenceDate={now}
        country={country as Country}
        currency={currency}
      />

      <BudgetBySystem rows={bySystem} total={monthBudget} currency={currency} />
    </div>
  );
}

function EmptyState({ country }: { country: Country }) {
  return (
    <div
      className="rounded-xl border bg-white p-10 text-center"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="text-[18px] font-medium">
        {COUNTRY_LABELS[country]}: žádná data
      </h2>
      <p
        className="text-[14px] mt-2"
        style={{ color: "var(--foreground-muted)" }}
      >
        V Google Sheets pro tuto zemi zatím nejsou žádné kampaně ani nasazení.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 h-[92px] animate-pulse"
            style={{ background: "var(--background-muted)" }}
          />
        ))}
      </section>
      <div
        className="rounded-xl border bg-white h-[420px] animate-pulse"
        style={{ borderColor: "var(--border)" }}
      />
      <div
        className="rounded-xl border bg-white h-[260px] animate-pulse"
        style={{ borderColor: "var(--border)" }}
      />
    </div>
  );
}
