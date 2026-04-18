# Lindström — dashboard kampaní

Read-only klientský dashboard pro přehled běžících online marketingových kampaní. Data jsou v Google Sheets, aplikace je čte přes Sheets API (service account), běží na Next.js 16 a je hostovaná na Vercelu.

## Architektura

- **Frontend**: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind v4
- **Data**: Google Sheets API v4, 4 sheety (`Specialiste`, `Kampane`, `Nasazeni`, `Kreativy`)
- **Cache**: `getAllData()` je označené `'use cache'` + `cacheLife({ revalidate: 300 })` + `cacheTag('sheets')` — server drží data v cache 5 minut
- **Revalidace na vyžádání**: `POST /api/revalidate?secret=...` okamžitě invaliduje tag `sheets`

> Historie změn: viz [CHANGELOG.md](CHANGELOG.md).

## Lokální spuštění

1. Nainstaluj závislosti:
   ```bash
   npm install
   ```
2. Zkopíruj `.env.local.example` do `.env.local` a vyplň:
   - `GOOGLE_SHEETS_SPREADSHEET_ID` — ID spreadsheetu (z URL mezi `/d/` a `/edit`)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — email service accountu
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — privátní klíč ze staženého JSONu. Zachovej escapované `\n` v hodnotě, v kódu se převádí zpět na skutečné nové řádky.
   - `REVALIDATE_SECRET` — libovolný dlouhý náhodný řetězec pro endpoint `/api/revalidate`
3. Sdílej spreadsheet s emailem service accountu (Viewer)
4. Spusť dev server:
   ```bash
   npm run dev
   ```

## Deploy na Vercel

1. Push do GitHubu
2. Na vercel.com → Import Project → vyber repo
3. Přidej environment variables z `.env.local` (Settings → Environment Variables)
4. Deploy

## Manuální refresh dat

Když klient upraví data v Google Sheets a chce okamžitou obnovu:
```bash
curl -X POST "https://<vercel-url>/api/revalidate?secret=<REVALIDATE_SECRET>"
```
Jinak se data obnoví automaticky max. do 5 minut.

## Datová struktura

Viz `/brief_claude_code.md` v rodičovské složce. Zkráceně:

- **Specialiste** — Jméno, Role, Email, Aktivní
- **Kampane** — **Slug** (primary, URL-safe, stabilní), Kampaň, Produkt, Cíl, Status, Start, Konec, Celkový rozpočet, Specialista, Poznámka
- **Nasazeni** — ID nasazení, Kampaň (FK), Systém, Formát, Rozpočet, Typ rozpočtu, Start, Konec, Specialista, Kreativy, Landing page, Targeting, URL do systému, Status, Poznámka
- **Kreativy** — Kreativa, Typ, Tagy, URL, Status, Nasazení, Poznámka

> **Source of truth** pro vazbu nasazení ↔ kreativy je `Nasazeni.Kreativy`. Sloupec `Kreativy.Nasazení` aplikace při čtení ignoruje (při nekonzistenci jen warning v konzoli).

## Struktura projektu

```
app/
  page.tsx                      # hlavní dashboard
  kampan/[slug]/page.tsx        # detail kampaně (routing přes sloupec Slug)
  api/revalidate/route.ts       # on-demand invalidace cache
  layout.tsx, globals.css
components/
  MetricCard, Timeline, BudgetBySystem, Header
  CampaignDetailHeader, DeploymentsTable, CreativeGrid
  StatusBadge, GoalBadge
lib/
  sheets.ts                     # Google Sheets client, parsing
  data.ts                       # výpočty rozpočtů a filtrů (proporcionální měsíční odhady)
  slug.ts                       # URL slug helper (pro generování návrhů)
  format.ts                     # čísla, měna, data, měsíce CZ
types/
  index.ts
```

## Výpočet měsíčního rozpočtu

Pro každé nasazení se spočítá **proporcionálně** podle překryvu s daným měsícem:

- `Měsíční` typ: `Rozpočet × (dny nasazení v měsíci / dny v měsíci)`
- `Celkový` typ: `(Rozpočet / celkový počet dní nasazení) × dny nasazení v měsíci`

Metric karta „Rozpočet [měsíc]" = součet přes všechna aktivní nasazení.
„Performance" = totéž, ale jen nasazení z kampaní s cílem Lead nebo Hybrid.
„Brand awareness" = totéž pro Brand nebo Hybrid (Hybrid se započítá do obou kategorií).
