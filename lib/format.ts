const MONTHS_SHORT = [
  "Led",
  "Úno",
  "Bře",
  "Dub",
  "Kvě",
  "Čvn",
  "Čvc",
  "Srp",
  "Zář",
  "Říj",
  "Lis",
  "Pro",
];

const MONTHS_LONG = [
  "leden",
  "únor",
  "březen",
  "duben",
  "květen",
  "červen",
  "červenec",
  "srpen",
  "září",
  "říjen",
  "listopad",
  "prosinec",
];

import type { Currency } from "@/types";

const numberFormatter = new Intl.NumberFormat("cs-CZ", {
  maximumFractionDigits: 0,
});

const moneyFormatters: Record<Currency, Intl.NumberFormat> = {
  CZK: new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }),
  EUR: new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }),
};

export function formatMoney(value: number, currency: Currency | null): string {
  const fmt = moneyFormatters[currency ?? "CZK"];
  return fmt.format(Math.round(value));
}

/** @deprecated use formatMoney(value, "CZK") */
export function formatCzk(value: number): string {
  return formatMoney(value, "CZK");
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatDate(d: Date | null): string {
  if (!d) return "—";
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

export function monthShort(month: number): string {
  return MONTHS_SHORT[month] ?? "";
}

export function monthLong(month: number): string {
  return MONTHS_LONG[month] ?? "";
}
