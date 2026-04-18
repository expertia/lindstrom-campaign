interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
}

export function MetricCard({ label, value, hint }: MetricCardProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{ background: "var(--background-muted)" }}
    >
      <div
        className="text-[13px]"
        style={{ color: "var(--foreground-muted)" }}
      >
        {label}
      </div>
      <div className="text-2xl font-medium mt-1">{value}</div>
      {hint ? (
        <div
          className="text-[12px] mt-1"
          style={{ color: "var(--foreground-muted)" }}
        >
          {hint}
        </div>
      ) : null}
    </div>
  );
}
