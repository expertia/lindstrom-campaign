import Link from "next/link";
import { COUNTRIES, type Country } from "@/types";

interface Props {
  current: Country;
}

export function CountrySwitcher({ current }: Props) {
  return (
    <nav
      aria-label="Přepínač zemí"
      className="flex gap-1"
      style={{ borderColor: "var(--border)" }}
    >
      {COUNTRIES.map((country) => {
        const isActive = country === current;
        return (
          <Link
            key={country}
            href={`/${country.toLowerCase()}`}
            aria-current={isActive ? "page" : undefined}
            className="px-3 py-1.5 text-[13px] rounded-md transition-colors"
            style={
              isActive
                ? {
                    background: "var(--background-muted)",
                    color: "var(--foreground)",
                    fontWeight: 500,
                  }
                : { color: "var(--foreground-muted)" }
            }
          >
            {country}
          </Link>
        );
      })}
    </nav>
  );
}
