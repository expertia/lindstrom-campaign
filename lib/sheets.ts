import { google, sheets_v4 } from "googleapis";
import { cacheLife, cacheTag } from "next/cache";
import type {
  Kampan,
  Kreativa,
  Nasazeni,
  SheetData,
  Specialista,
  Goal,
  Status,
  BudgetType,
  Country,
  Currency,
} from "@/types";
import { COUNTRIES, isCountry } from "@/types";

const SHEETS = {
  specialiste: "Specialiste",
  kampane: "Kampane",
  nasazeni: "Nasazeni_v_systemech",
  kreativy: "Kreativy",
} as const;

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getSheetsClient(): sheets_v4.Sheets {
  const auth = new google.auth.JWT({
    email: getEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    key: getEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

type CellValue = string | number | boolean | null | undefined;
type Row = CellValue[];

function toStr(v: CellValue): string {
  if (v == null) return "";
  return String(v);
}

function parseNumber(raw: CellValue): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (typeof raw === "boolean") return raw ? 1 : 0;
  const s = String(raw).trim();
  if (s === "") return null;
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  let normalized = s.replace(/\s|\u00A0/g, "");
  if (hasComma && hasDot) {
    normalized =
      s.lastIndexOf(",") > s.lastIndexOf(".")
        ? normalized.replace(/\./g, "").replace(",", ".")
        : normalized.replace(/,/g, "");
  } else if (hasComma) {
    const parts = normalized.split(",");
    const last = parts[parts.length - 1];
    normalized =
      parts.length > 2 || last.length === 3
        ? normalized.replace(/,/g, "")
        : normalized.replace(",", ".");
  } else if (hasDot) {
    const parts = normalized.split(".");
    const last = parts[parts.length - 1];
    normalized =
      parts.length > 2 || last.length === 3
        ? normalized.replace(/\./g, "")
        : normalized;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function parseDate(raw: CellValue): Date | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    const ms = Math.round((raw - 25569) * 86_400_000);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(String(raw));
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseBoolean(raw: CellValue): boolean {
  if (typeof raw === "boolean") return raw;
  const v = toStr(raw).trim().toLowerCase();
  return v === "true" || v === "checked" || v === "1" || v === "ano" || v === "yes";
}

function parseList(raw: CellValue): string[] {
  const s = toStr(raw);
  if (!s) return [];
  return s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function parseCountry(raw: CellValue): Country | null {
  const v = toStr(raw).trim().toUpperCase();
  return isCountry(v) ? v : null;
}

function parseCountries(raw: CellValue): Country[] {
  const s = toStr(raw);
  if (!s) return [];
  return s
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is Country => (COUNTRIES as readonly string[]).includes(p));
}

function parseCurrency(raw: CellValue): Currency | null {
  const v = toStr(raw).trim().toUpperCase();
  return v === "CZK" || v === "EUR" ? (v as Currency) : null;
}

function headerIndex(header: Row, names: string[]): number {
  for (const name of names) {
    const idx = header.findIndex((h) => toStr(h).trim() === name);
    if (idx !== -1) return idx;
  }
  return -1;
}

function cellStr(row: Row, idx: number): string {
  if (idx === -1) return "";
  return toStr(row[idx]);
}

function cellRaw(row: Row, idx: number): CellValue {
  if (idx === -1) return undefined;
  return row[idx];
}

function mapSpecialiste(rows: Row[]): Specialista[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  const iJmeno = headerIndex(header, ["Jméno", "Jmeno"]);
  const iRole = headerIndex(header, ["Role"]);
  const iEmail = headerIndex(header, ["Email", "E-mail"]);
  const iAktivni = headerIndex(header, ["Aktivní", "Aktivni"]);
  const iZeme = headerIndex(header, ["Země", "Zeme"]);
  return rows
    .slice(1)
    .filter((r) => cellStr(r, iJmeno))
    .map((r) => ({
      jmeno: cellStr(r, iJmeno),
      role: cellStr(r, iRole),
      email: cellStr(r, iEmail),
      aktivni: parseBoolean(cellRaw(r, iAktivni)),
      zeme: parseCountries(cellRaw(r, iZeme)),
    }));
}

function mapKampane(rows: Row[]): Kampan[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  const iSlug = headerIndex(header, ["Slug", "ID slug", "ID slub"]);
  const iNazev = headerIndex(header, ["Kampaň", "Kampan"]);
  const iProdukt = headerIndex(header, ["Produkt"]);
  const iCil = headerIndex(header, ["Cíl", "Cil"]);
  const iStatus = headerIndex(header, ["Status"]);
  const iStart = headerIndex(header, ["Start"]);
  const iKonec = headerIndex(header, ["Konec"]);
  const iRozpocet = headerIndex(header, ["Celkový rozpočet", "Celkovy rozpocet"]);
  const iSpec = headerIndex(header, ["Specialista"]);
  const iPoznamka = headerIndex(header, ["Poznámka", "Poznamka"]);
  const iZeme = headerIndex(header, ["Země", "Zeme"]);
  const iMena = headerIndex(header, ["Měna", "Mena"]);

  return rows
    .slice(1)
    .filter((r) => cellStr(r, iNazev))
    .map((r) => ({
      slug: cellStr(r, iSlug),
      nazev: cellStr(r, iNazev),
      produkt: cellStr(r, iProdukt),
      cil: cellStr(r, iCil) as Goal,
      status: cellStr(r, iStatus) as Status,
      start: parseDate(cellRaw(r, iStart)),
      konec: parseDate(cellRaw(r, iKonec)),
      celkovyRozpocet: parseNumber(cellRaw(r, iRozpocet)),
      specialiste: parseList(cellStr(r, iSpec)),
      poznamka: cellStr(r, iPoznamka),
      zeme: parseCountry(cellRaw(r, iZeme)),
      mena: parseCurrency(cellRaw(r, iMena)),
    }));
}

function mapNasazeni(rows: Row[]): Nasazeni[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  const iId = headerIndex(header, ["ID nasazení", "ID nasazeni", "ID"]);
  const iKampan = headerIndex(header, ["Kampaň", "Kampan"]);
  const iSystem = headerIndex(header, ["Systém", "System"]);
  const iFormat = headerIndex(header, ["Formát", "Format"]);
  const iRozpocet = headerIndex(header, ["Rozpočet", "Rozpocet"]);
  const iTypRozpoctu = headerIndex(header, ["Typ rozpočtu", "Typ rozpoctu"]);
  const iStart = headerIndex(header, ["Start"]);
  const iKonec = headerIndex(header, ["Konec"]);
  const iSpec = headerIndex(header, ["Specialista"]);
  const iKreativy = headerIndex(header, ["Kreativy"]);
  const iLanding = headerIndex(header, ["Landing page", "Landing"]);
  const iTargeting = headerIndex(header, ["Targeting"]);
  const iUrl = headerIndex(header, ["URL do systému", "URL do systemu", "URL"]);
  const iStatus = headerIndex(header, ["Status"]);
  const iPoznamka = headerIndex(header, ["Poznámka", "Poznamka"]);
  const iZeme = headerIndex(header, ["Země", "Zeme"]);
  const iMena = headerIndex(header, ["Měna", "Mena"]);

  return rows
    .slice(1)
    .filter((r) => cellStr(r, iId))
    .map((r) => ({
      id: cellStr(r, iId),
      kampan: cellStr(r, iKampan),
      system: cellStr(r, iSystem),
      format: cellStr(r, iFormat),
      rozpocet: parseNumber(cellRaw(r, iRozpocet)),
      typRozpoctu: (cellStr(r, iTypRozpoctu) || "Měsíční") as BudgetType,
      start: parseDate(cellRaw(r, iStart)),
      konec: parseDate(cellRaw(r, iKonec)),
      specialiste: parseList(cellStr(r, iSpec)),
      kreativy: parseList(cellStr(r, iKreativy)),
      landingPage: cellStr(r, iLanding),
      targeting: cellStr(r, iTargeting),
      urlSystemu: cellStr(r, iUrl),
      status: cellStr(r, iStatus) as Status,
      poznamka: cellStr(r, iPoznamka),
      zeme: parseCountry(cellRaw(r, iZeme)),
      mena: parseCurrency(cellRaw(r, iMena)),
    }));
}

function mapKreativy(rows: Row[]): Kreativa[] {
  if (rows.length < 2) return [];
  const header = rows[0];
  const iNazev = headerIndex(header, ["Kreativa"]);
  const iTyp = headerIndex(header, ["Typ"]);
  const iTagy = headerIndex(header, ["Tagy"]);
  const iUrl = headerIndex(header, ["URL"]);
  const iYoutube = headerIndex(header, [
    "Youtube URL",
    "YouTube URL",
    "Youtube",
    "YouTube",
  ]);
  const iStatus = headerIndex(header, ["Status"]);
  const iNasazeni = headerIndex(header, ["Nasazení", "Nasazeni"]);
  const iPoznamka = headerIndex(header, ["Poznámka", "Poznamka"]);
  const iZeme = headerIndex(header, ["Země", "Zeme"]);

  return rows
    .slice(1)
    .filter((r) => cellStr(r, iNazev))
    .map((r) => ({
      nazev: cellStr(r, iNazev),
      typ: cellStr(r, iTyp),
      tagy: parseList(cellStr(r, iTagy)),
      url: cellStr(r, iUrl),
      youtubeUrl: cellStr(r, iYoutube),
      zeme: parseCountries(cellRaw(r, iZeme)),
      status: cellStr(r, iStatus),
      nasazeni: parseList(cellStr(r, iNasazeni)),
      poznamka: cellStr(r, iPoznamka),
    }));
}

export async function getAllData(): Promise<SheetData> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 });
  cacheTag("sheets");

  const sheets = getSheetsClient();
  const spreadsheetId = getEnv("GOOGLE_SHEETS_SPREADSHEET_ID");

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: [
      `${SHEETS.specialiste}!A:Z`,
      `${SHEETS.kampane}!A:Z`,
      `${SHEETS.nasazeni}!A:Z`,
      `${SHEETS.kreativy}!A:Z`,
    ],
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "SERIAL_NUMBER",
  });

  const valueRanges = res.data.valueRanges ?? [];
  const rows = (idx: number): Row[] =>
    (valueRanges[idx]?.values as Row[] | undefined) ?? [];

  return {
    specialiste: mapSpecialiste(rows(0)),
    kampane: mapKampane(rows(1)),
    nasazeni: mapNasazeni(rows(2)),
    kreativy: mapKreativy(rows(3)),
  };
}
