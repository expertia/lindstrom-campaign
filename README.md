# Lindström — dashboard kampaní

Read-only klientský dashboard pro přehled běžících online marketingových kampaní. Data jsou v Google Sheets, aplikace je čte přes Sheets API (service account), běží na Next.js 16 a je hostovaná na Vercelu.

## Architektura

- **Frontend**: Next.js 16 (App Router, Cache Components) + TypeScript + Tailwind v4
- **Data**: Google Sheets API v4, 4 sheety (`Specialiste`, `Kampane`, `Nasazeni`, `Kreativy`)
- **Multi-country**: 4 trhy (CZ → CZK, SK/GER/AT → EUR). Data všech trhů jsou v jednom spreadsheetu, rozlišují se sloupcem `Země`
- **Cache**: `getAllData()` je označené `'use cache'` + `cacheLife({ revalidate: 300 })` + `cacheTag('sheets')` — server drží data v cache 5 minut
- **Revalidace na vyžádání**: `POST /api/revalidate?secret=...` okamžitě invaliduje tag `sheets` (pro všechny země naráz)

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

## URL struktura

| URL | Stránka |
|---|---|
| `/` | Redirect na `/cz` |
| `/cz`, `/sk`, `/ger`, `/at` | Dashboard pro danou zemi |
| `/cz/kampan/<slug>` | Detail kampaně v CZ (slug + země musí oba sedět) |
| `/api/revalidate?secret=…` | On-demand invalidace cache |

Neplatná země nebo neexistující slug → 404. Brand v hlavičce („Lindström Česko" / „… Slovensko" / …) a měna ve výpisech (CZK pro CZ, EUR pro SK/GER/AT) se mění podle URL.

## Datová struktura

Viz `/brief_claude_code.md` + `/dodatek_zeme.md` v rodičovské složce. Zkráceně:

- **Specialiste** — Jméno, Role, Email, Aktivní, **Země** (multi-value, např. `CZ, SK`)
- **Kampane** — Kampaň, **Země** (single: CZ/SK/GER/AT), Slug (`ID slub`), **Měna** (CZK/EUR), Produkt, Cíl, Status, Start, Konec, Celkový rozpočet, Specialista, Poznámka
- **Nasazeni_v_systemech** — ID nasazení, **Země**, **Měna**, Kampaň (FK), Systém, Formát, Rozpočet, Typ rozpočtu, Start, Konec, Specialista, Kreativy, Landing page, Targeting, URL do systému, Status, Poznámka
- **Kreativy** — Kreativa, **Země** (multi-value), Typ, Tagy, URL (Drive link), **Youtube URL** (volitelné), Status, Nasazení, Poznámka

> **Source of truth** pro vazbu nasazení ↔ kreativy je `Nasazeni.Kreativy`. Sloupec `Kreativy.Nasazení` aplikace při čtení ignoruje (při nekonzistenci jen warning v konzoli).

> **Náhledy kreativ**: pokud `Kreativy.URL` ukazuje na Google Drive (`/file/d/<ID>/view`), aplikace vykreslí statický thumbnail přes Drive thumbnail API. Soubor v Drive musí být sdílen **„Kdokoli s odkazem"**, jinak Drive vrátí 403. Pro `Typ = Video` se nad thumbnail zobrazí play overlay. Pokud je vyplněn `Youtube URL`, vedle „Otevřít v Disku" se zobrazí druhý odkaz „YouTube".

> **Validační pravidlo (lidské)**: v kampani musí Země a Měna spolu sedět (CZ/SK→CZK, GER/AT→EUR). Aplikace na to nehlídá; pokud rozcházejí, formátování čísel může vypadat divně.

## Struktura projektu

```
app/
  page.tsx                            # redirect na /cz
  layout.tsx, globals.css             # globální shell (bez switcheru)
  [country]/
    layout.tsx                        # hlavička s brandem + CountrySwitcher
    page.tsx                          # dashboard pro danou zemi (generateStaticParams)
    kampan/[slug]/page.tsx            # detail kampaně v dané zemi
  api/revalidate/route.ts             # on-demand invalidace cache
components/
  CountrySwitcher                     # 4 taby CZ/SK/GER/AT
  MetricCard, Timeline, BudgetBySystem
  CampaignDetailHeader, DeploymentsTable, CreativeGrid
  StatusBadge, GoalBadge
lib/
  sheets.ts                           # Google Sheets client + parser (Země/Měna whitelist)
  data.ts                             # výpočty + filterKampaneByCountry, mergeDeploymentSegments, …
  drive.ts                            # parser Drive URL → file ID + thumbnail URL
  slug.ts                             # URL slug helper
  format.ts                           # formatMoney(value, currency), formatDateRangeShort, …
types/
  index.ts                            # Country/Currency typy + COUNTRY_TO_CURRENCY mapa
```

## Timeline (gantt přehled)

- **Okno**: 13 měsíců, kotvené na **leden aktuálního roku** (Leden 2026 → Leden 2027 v roce 2026; v roce 2027 se posune o rok dál)
- **Pruhy** se derivují z `Nasazeni_v_systemech.Start/Konec`, ne z `Kampaň.Start/Konec`. Kampaň se 3 fázemi v roce má 3 oddělené pruhy v jednom řádku
- **Sloučení**: nasazení s překrývajícími se / dotýkajícími se intervaly se v rámci jedné kampaně sloučí do jednoho souvislého pruhu (`mergeDeploymentSegments`); nesouvislé fáze zůstávají oddělené
- **Text v pruhu**: `ID nasazení` (top) + `dd. mm. – dd. mm.` (bottom). Pokud sloučí víc nasazení, ID jsou čárkou oddělená. Pruh užší než ~60 px text neukáže (full info v `title` atributu)
- **Levý sloupec** je `position: sticky` — drží se v zorném poli při horizontálním scrollu
- **Footer „Investováno"** sčítá proporcionální měsíční rozpočet pro každý ze 13 měsíců (sticky label vlevo)

## Výpočet měsíčního rozpočtu

Pro každé nasazení se spočítá **proporcionálně** podle překryvu s daným měsícem:

- `Měsíční` typ: `Rozpočet × (dny nasazení v měsíci / dny v měsíci)`
- `Celkový` typ: `(Rozpočet / celkový počet dní nasazení) × dny nasazení v měsíci`

Metric karta „Rozpočet [měsíc]" = součet přes všechna aktivní nasazení.
„Performance" = totéž, ale jen nasazení z kampaní s cílem Lead nebo Hybrid.
„Brand awareness" = totéž pro Brand nebo Hybrid (Hybrid se započítá do obou kategorií).
