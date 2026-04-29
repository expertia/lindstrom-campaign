import Link from "next/link";
import type { Country, Currency, Kampan, Nasazeni } from "@/types";
import { formatMoney, monthShort } from "@/lib/format";
import { getCurrentMonthBudget } from "@/lib/data";
import { toSlug } from "@/lib/slug";
import { GOAL_COLORS } from "./GoalBadge";

interface TimelineProps {
  kampane: Kampan[];
  nasazeni: Nasazeni[];
  referenceDate: Date;
  country: Country;
  currency: Currency;
}

const LEFT_COL_WIDTH = 220;
const MONTH_WIDTH = 110;
const ROW_HEIGHT = 56;
const HEADER_HEIGHT = 32;

export function Timeline({
  kampane,
  nasazeni,
  referenceDate,
  country,
  currency,
}: TimelineProps) {
  const countryPrefix = `/${country.toLowerCase()}`;
  const systemsByCampaign = new Map<string, string[]>();
  for (const d of nasazeni) {
    if (!d.system) continue;
    const list = systemsByCampaign.get(d.kampan) ?? [];
    if (!list.includes(d.system)) list.push(d.system);
    systemsByCampaign.set(d.kampan, list);
  }
  const monthsBefore = 6;
  const monthsAfter = 6;
  const months: { year: number; month: number }[] = [];
  for (let offset = -monthsBefore; offset <= monthsAfter; offset++) {
    const d = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + offset,
      1,
    );
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  const windowStart = new Date(months[0].year, months[0].month, 1);
  const lastMonth = months[months.length - 1];
  const windowEnd = new Date(
    lastMonth.year,
    lastMonth.month + 1,
    0,
    23,
    59,
    59,
    999,
  );
  const windowStartMs = windowStart.getTime();
  const windowEndMs = windowEnd.getTime();
  const windowDurationMs = windowEndMs - windowStartMs;
  const totalWidth = months.length * MONTH_WIDTH;

  const visible = kampane.filter(
    (k) =>
      k.start &&
      k.konec &&
      k.start.getTime() <= windowEndMs &&
      k.konec.getTime() >= windowStartMs,
  );

  const todayMs = referenceDate.getTime();
  const todayOffset =
    todayMs >= windowStartMs && todayMs <= windowEndMs
      ? ((todayMs - windowStartMs) / windowDurationMs) * totalWidth
      : -1;

  return (
    <div
      className="rounded-xl border bg-white"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="p-4 pb-2">
        <h2 className="text-[18px] font-medium">Timeline kampaní</h2>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_COL_WIDTH + totalWidth }}>
          <div
            className="flex border-b"
            style={{ borderColor: "var(--border)", height: HEADER_HEIGHT }}
          >
            <div
              className="flex-shrink-0 text-[12px] px-4 flex items-center"
              style={{
                width: LEFT_COL_WIDTH,
                color: "var(--foreground-muted)",
                position: "sticky",
                left: 0,
                background: "white",
                borderRight: "1px solid var(--border)",
                zIndex: 2,
              }}
            >
              Kampaň
            </div>
            <div className="flex" style={{ width: totalWidth }}>
              {months.map((m, i) => {
                const isCurrent =
                  m.year === referenceDate.getFullYear() &&
                  m.month === referenceDate.getMonth();
                return (
                  <div
                    key={`${m.year}-${m.month}`}
                    className="text-[12px] flex items-center justify-center"
                    style={{
                      width: MONTH_WIDTH,
                      color: isCurrent
                        ? "var(--foreground)"
                        : "var(--foreground-muted)",
                      fontWeight: isCurrent ? 500 : 400,
                      borderLeft:
                        i === 0 ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {monthShort(m.month)} {String(m.year).slice(2)}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            {todayOffset >= 0 ? (
              <div
                aria-hidden
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{
                  left: LEFT_COL_WIDTH + todayOffset,
                  width: 1,
                  background: "#D0D0D0",
                }}
              />
            ) : null}

            {visible.length === 0 ? (
              <div
                className="p-6 text-[14px]"
                style={{ color: "var(--foreground-muted)" }}
              >
                V tomto období neběží žádné kampaně.
              </div>
            ) : null}

            {visible.map((k) => {
              const start = k.start!;
              const konec = k.konec!;
              const clampedStart = Math.max(start.getTime(), windowStartMs);
              const clampedEnd = Math.min(konec.getTime(), windowEndMs);
              const left =
                ((clampedStart - windowStartMs) / windowDurationMs) *
                totalWidth;
              const width =
                ((clampedEnd - clampedStart) / windowDurationMs) * totalWidth;
              const color = GOAL_COLORS[k.cil] ?? "#888";
              const systems = systemsByCampaign.get(k.nazev) ?? [];
              const systemsLabel = systems.join(", ");
              return (
                <Link
                  key={k.slug || k.nazev}
                  href={`${countryPrefix}/kampan/${k.slug || toSlug(k.nazev)}`}
                  className="group flex border-b focus:outline-none"
                  style={{
                    borderColor: "var(--border)",
                    height: ROW_HEIGHT,
                  }}
                >
                  <div
                    className="flex-shrink-0 px-4 flex flex-col justify-center bg-white group-hover:bg-[var(--background-muted)] group-focus:bg-[var(--background-muted)]"
                    style={{
                      width: LEFT_COL_WIDTH,
                      position: "sticky",
                      left: 0,
                      borderRight: "1px solid var(--border)",
                      zIndex: 2,
                    }}
                  >
                    <div className="text-[14px] font-medium truncate">
                      {k.nazev}
                    </div>
                    <div
                      className="text-[12px] truncate"
                      style={{ color: "var(--foreground-muted)" }}
                    >
                      {k.cil}
                      {systemsLabel ? ` · ${systemsLabel}` : ""}
                    </div>
                  </div>
                  <div
                    className="relative group-hover:bg-[var(--background-muted)] group-focus:bg-[var(--background-muted)]"
                    style={{ width: totalWidth, height: ROW_HEIGHT }}
                  >
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-md"
                      style={{
                        left,
                        width: Math.max(width, 8),
                        height: 28,
                        background: color,
                      }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>

          <div
            className="flex border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex-shrink-0 px-4 py-3 text-[12px]"
              style={{
                width: LEFT_COL_WIDTH,
                color: "var(--foreground-muted)",
                position: "sticky",
                left: 0,
                background: "white",
                borderRight: "1px solid var(--border)",
                zIndex: 2,
              }}
            >
              Investováno
            </div>
            <div className="flex" style={{ width: totalWidth }}>
              {months.map((m, i) => {
                const budget = getCurrentMonthBudget(nasazeni, m.year, m.month);
                const isCurrent =
                  m.year === referenceDate.getFullYear() &&
                  m.month === referenceDate.getMonth();
                return (
                  <div
                    key={`sum-${m.year}-${m.month}`}
                    className="text-[12px] px-2 py-3 flex items-center justify-center text-center"
                    style={{
                      width: MONTH_WIDTH,
                      borderLeft: i === 0 ? "none" : "1px solid var(--border)",
                      fontWeight: isCurrent ? 500 : 400,
                      color: budget > 0
                        ? "var(--foreground)"
                        : "var(--foreground-muted)",
                    }}
                  >
                    {budget > 0 ? formatMoney(budget, currency) : "—"}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 text-[12px]">
            {(["Brand", "Lead", "Hybrid"] as const).map((g) => (
              <div key={g} className="flex items-center gap-2">
                <span
                  className="inline-block rounded"
                  style={{
                    width: 10,
                    height: 10,
                    background: GOAL_COLORS[g],
                  }}
                />
                <span style={{ color: "var(--foreground-muted)" }}>{g}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
