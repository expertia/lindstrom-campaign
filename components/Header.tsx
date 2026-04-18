import Link from "next/link";

export function Header({ clientName }: { clientName: string }) {
  return (
    <header
      className="border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="text-[18px] font-medium">{clientName}</span>
          <span
            className="text-[13px]"
            style={{ color: "var(--foreground-muted)" }}
          >
            přehled kampaní
          </span>
        </Link>
      </div>
    </header>
  );
}
