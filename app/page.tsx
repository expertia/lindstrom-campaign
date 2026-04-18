import { Suspense } from "react";
import { connection } from "next/server";
import { getAllData } from "@/lib/sheets";
import {
  getActiveCampaignsCount,
  getBudgetBySystem,
  getCurrentMonthBudget,
  getGoalBudget,
} from "@/lib/data";
import { formatCzk, monthLong } from "@/lib/format";
import { MetricCard } from "@/components/MetricCard";
import { Timeline } from "@/components/Timeline";
import { BudgetBySystem } from "@/components/BudgetBySystem";
import { Header } from "@/components/Header";

export default function Page() {
  return (
    <>
      <Header clientName="Lindström" />
      <main className="max-w-[1200px] mx-auto px-6 py-8">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
    </>
  );
}

async function Dashboard() {
  await connection();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const data = await getAllData();

  const active = getActiveCampaignsCount(data.kampane);
  const monthBudget = getCurrentMonthBudget(data.nasazeni, year, month);
  const leadBudget = getGoalBudget(
    data.kampane,
    data.nasazeni,
    "Lead",
    year,
    month,
  );
  const brandBudget = getGoalBudget(
    data.kampane,
    data.nasazeni,
    "Brand",
    year,
    month,
  );

  const monthTitle = `Rozpočet ${monthLong(month)} ${year}`;
  const bySystem = getBudgetBySystem(data.nasazeni, year, month);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Aktivní kampaně"
          value={String(active)}
          hint={`z ${data.kampane.length} v evidenci`}
        />
        <MetricCard label={monthTitle} value={formatCzk(monthBudget)} />
        <MetricCard
          label="Performance"
          value={formatCzk(leadBudget)}
          hint="Lead + Hybrid"
        />
        <MetricCard
          label="Brand awareness"
          value={formatCzk(brandBudget)}
          hint="Brand + Hybrid"
        />
      </section>

      <Timeline
        kampane={data.kampane}
        nasazeni={data.nasazeni}
        referenceDate={now}
      />

      <BudgetBySystem rows={bySystem} total={monthBudget} />
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
