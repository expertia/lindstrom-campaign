import type { Kampan } from "@/types";
import { formatDate } from "@/lib/format";
import { GoalBadge } from "./GoalBadge";
import { StatusBadge } from "./StatusBadge";

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
        <div className="flex gap-2 flex-shrink-0">
          <GoalBadge goal={kampan.cil} />
          <StatusBadge status={kampan.status} />
        </div>
      </div>
    </div>
  );
}
