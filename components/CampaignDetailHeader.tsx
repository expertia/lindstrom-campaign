import type { Kampan } from "@/types";
import { formatDate } from "@/lib/format";
import { GoalBadge } from "./GoalBadge";
import { StatusBadge } from "./StatusBadge";

function CountryBadge({ kampan }: { kampan: Kampan }) {
  if (!kampan.zeme && !kampan.mena) return null;
  const label = [kampan.zeme, kampan.mena].filter(Boolean).join(" · ");
  return (
    <span
      className="inline-block text-[12px] font-medium rounded-lg"
      style={{
        padding: "4px 10px",
        background: "#F0F0F0",
        color: "#333333",
      }}
    >
      {label}
    </span>
  );
}

export function CampaignDetailHeader({ kampan }: { kampan: Kampan }) {
  const specLabel = kampan.specialiste.join(", ");
  return (
    <div
      className="rounded-xl border bg-white p-6"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[22px] font-medium">{kampan.nazev}</h1>
          <div
            className="text-[14px] mt-1"
            style={{ color: "var(--foreground-muted)" }}
          >
            {formatDate(kampan.start)} – {formatDate(kampan.konec)}
            {specLabel ? ` · ${specLabel}` : ""}
          </div>
          {kampan.poznamka ? (
            <p className="text-[14px] mt-3 max-w-2xl">{kampan.poznamka}</p>
          ) : null}
        </div>
        <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
          <CountryBadge kampan={kampan} />
          <GoalBadge goal={kampan.cil} />
          <StatusBadge status={kampan.status} />
        </div>
      </div>
    </div>
  );
}
