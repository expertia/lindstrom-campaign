export type Country = "CZ" | "SK" | "GER" | "AT";

export type Currency = "CZK" | "EUR";

export const COUNTRIES: readonly Country[] = ["CZ", "SK", "GER", "AT"] as const;

export const COUNTRY_LABELS: Record<Country, string> = {
  CZ: "Česko",
  SK: "Slovensko",
  GER: "Německo",
  AT: "Rakousko",
};

export const COUNTRY_TO_CURRENCY: Record<Country, Currency> = {
  CZ: "CZK",
  SK: "EUR",
  GER: "EUR",
  AT: "EUR",
};

export function isCountry(value: string): value is Country {
  return (COUNTRIES as readonly string[]).includes(value);
}

export type Goal = "Brand" | "Lead" | "Hybrid";

export type Status =
  | "Plánovaná"
  | "Běží"
  | "Pozastavená"
  | "Ukončená";

export type Product = "Across" | "Workwear" | "Mats" | "IWS";

export type System =
  | "Google Ads"
  | "YouTube"
  | "Meta"
  | "Sklik"
  | "Google PMax";

export type DeploymentFormat =
  | "Search"
  | "Video"
  | "Nativní"
  | "Carousel"
  | "Retargeting"
  | "Display"
  | "PMax";

export type BudgetType = "Měsíční" | "Celkový";

export type CreativeType = "Video" | "Foto" | "Smíšená" | "Text";

export type CreativeStatus =
  | "V produkci"
  | "Schváleno"
  | "Běží"
  | "Ukončená"
  | "Archivováno";

export interface Specialista {
  jmeno: string;
  role: string;
  email: string;
  aktivni: boolean;
  zeme: Country[];
}

export interface Kampan {
  slug: string;
  nazev: string;
  produkt: Product | string;
  cil: Goal;
  status: Status;
  start: Date | null;
  konec: Date | null;
  celkovyRozpocet: number | null;
  specialiste: string[];
  poznamka: string;
  zeme: Country | null;
  mena: Currency | null;
}

export interface Nasazeni {
  id: string;
  kampan: string;
  system: System | string;
  format: DeploymentFormat | string;
  rozpocet: number | null;
  typRozpoctu: BudgetType;
  start: Date | null;
  konec: Date | null;
  specialiste: string[];
  kreativy: string[];
  landingPage: string;
  targeting: string;
  urlSystemu: string;
  status: Status;
  poznamka: string;
  zeme: Country | null;
  mena: Currency | null;
}

export interface Kreativa {
  nazev: string;
  typ: CreativeType | string;
  tagy: string[];
  url: string;
  status: CreativeStatus | string;
  nasazeni: string[];
  poznamka: string;
  zeme: Country[];
}

export interface SheetData {
  specialiste: Specialista[];
  kampane: Kampan[];
  nasazeni: Nasazeni[];
  kreativy: Kreativa[];
}
