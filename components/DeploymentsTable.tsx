import type { Currency, Nasazeni } from "@/types";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusBadge } from "./StatusBadge";

const SYSTEM_COLORS: Record<string, string> = {
  "Google Ads": "#378ADD",
  "Google Search": "#378ADD",
  "Google PMax": "#EF9F27",
  YouTube: "#E24B4A",
  Meta: "#D4537E",
  Sklik: "#97C459",
};

export function DeploymentsTable({
  deployments,
  fallbackCurrency,
}: {
  deployments: Nasazeni[];
  fallbackCurrency: Currency;
}) {
  if (deployments.length === 0) {
    return (
      <div
        className="rounded-xl border bg-white p-6 text-[14px]"
        style={{ borderColor: "var(--border)", color: "var(--foreground-muted)" }}
      >
        Zatím žádná nasazení.
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="p-5 pb-3">
        <h2 className="text-[18px] font-medium">Nasazení v systémech</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr
              className="text-left text-[12px]"
              style={{ color: "var(--foreground-muted)" }}
            >
              <th className="px-5 py-3 font-medium">Systém</th>
              <th className="px-3 py-3 font-medium">ID nasazení</th>
              <th className="px-3 py-3 font-medium">Formát</th>
              <th className="px-3 py-3 font-medium text-right">Rozpočet</th>
              <th className="px-3 py-3 font-medium">Typ</th>
              <th className="px-3 py-3 font-medium">Období</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Kreativy</th>
            </tr>
          </thead>
          <tbody>
            {deployments.map((d) => {
              const color = SYSTEM_COLORS[d.system] ?? "#999";
              return (
                <tr
                  key={d.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className="inline-block rounded-full"
                        style={{ width: 8, height: 8, background: color }}
                      />
                      <span>{d.system}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">{d.id}</td>
                  <td className="px-3 py-3">{d.format}</td>
                  <td className="px-3 py-3 text-right font-medium">
                    {d.rozpocet != null
                      ? formatMoney(d.rozpocet, d.mena ?? fallbackCurrency)
                      : "—"}
                  </td>
                  <td
                    className="px-3 py-3"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {d.typRozpoctu}
                  </td>
                  <td
                    className="px-3 py-3"
                    style={{ color: "var(--foreground-muted)" }}
                  >
                    {formatDate(d.start)} – {formatDate(d.konec)}
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={d.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    {d.kreativy.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
