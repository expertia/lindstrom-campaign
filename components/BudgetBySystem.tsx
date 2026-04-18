import { formatCzk } from "@/lib/format";

const SYSTEM_COLORS: Record<string, string> = {
  "Google Ads": "#378ADD",
  "Google Search": "#378ADD",
  "Google PMax": "#EF9F27",
  YouTube: "#E24B4A",
  Meta: "#D4537E",
  Sklik: "#97C459",
};

interface BudgetBySystemProps {
  rows: Array<{ system: string; budget: number }>;
  total: number;
}

export function BudgetBySystem({ rows, total }: BudgetBySystemProps) {
  const max = rows.reduce((m, r) => (r.budget > m ? r.budget : m), 0);
  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: "var(--border)" }}
    >
      <h2 className="text-[18px] font-medium mb-4">Rozpočet po systémech</h2>
      {rows.length === 0 ? (
        <p
          className="text-[14px]"
          style={{ color: "var(--foreground-muted)" }}
        >
          V tomto měsíci není aktivní žádné nasazení.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const pct = total > 0 ? (r.budget / total) * 100 : 0;
            const widthPct = max > 0 ? (r.budget / max) * 100 : 0;
            const color = SYSTEM_COLORS[r.system] ?? "#999";
            return (
              <div key={r.system} className="flex items-center gap-4">
                <div
                  className="text-[14px] font-medium flex-shrink-0"
                  style={{ width: 140 }}
                >
                  {r.system}
                </div>
                <div className="flex-1 relative h-6">
                  <div
                    className="absolute inset-y-0 left-0 rounded"
                    style={{
                      width: `${widthPct}%`,
                      background: color,
                      opacity: 0.9,
                    }}
                  />
                </div>
                <div
                  className="text-[14px] text-right flex-shrink-0"
                  style={{ width: 180 }}
                >
                  <span className="font-medium">{formatCzk(r.budget)}</span>
                  <span
                    className="ml-2 text-[12px]"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {pct.toFixed(0)} %
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
