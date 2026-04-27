import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  COUNTRIES,
  COUNTRY_LABELS,
  isCountry,
  type Country,
} from "@/types";
import { CountrySwitcher } from "@/components/CountrySwitcher";

interface Props {
  children: React.ReactNode;
  params: Promise<{ country: string }>;
}

export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ country: c.toLowerCase() }));
}

export default function CountryLayout({ children, params }: Props) {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <CountryHeader params={params} />
      </Suspense>
      {children}
    </>
  );
}

async function CountryHeader({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country: rawCountry } = await params;
  const country = rawCountry.toUpperCase();
  if (!isCountry(country)) notFound();

  return (
    <header className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between gap-6">
        <Link
          href={`/${(country as Country).toLowerCase()}`}
          className="flex items-baseline gap-3"
        >
          <span className="text-[18px] font-medium">
            Lindström {COUNTRY_LABELS[country as Country]}
          </span>
          <span
            className="text-[13px]"
            style={{ color: "var(--foreground-muted)" }}
          >
            přehled kampaní
          </span>
        </Link>
        <CountrySwitcher current={country as Country} />
      </div>
    </header>
  );
}

function HeaderSkeleton() {
  return (
    <header className="border-b" style={{ borderColor: "var(--border)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-5 h-[64px]" />
    </header>
  );
}
