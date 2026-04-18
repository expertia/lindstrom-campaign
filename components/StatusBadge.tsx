import type { Status } from "@/types";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  "Běží": { bg: "#E8F5EE", color: "#106E3A" },
  "Plánovaná": { bg: "#EEF0FB", color: "#3D44B0" },
  "Pozastavená": { bg: "#FDF3E7", color: "#A86415" },
  "Ukončená": { bg: "#F1F1F1", color: "#555555" },
};

export function StatusBadge({ status }: { status: Status | string }) {
  const style = STATUS_STYLES[status] ?? {
    bg: "#F1F1F1",
    color: "#555555",
  };
  return (
    <span
      className="inline-block text-[12px] font-medium rounded-lg"
      style={{
        padding: "4px 10px",
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}
