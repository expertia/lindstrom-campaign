# Changelog

Chronologický přehled změn projektu. Nejnovější nahoře.

## 2026-04-27 — Multi-country support (CZ, SK, GER, AT)

### Routing — breaking change

- `/` → 308 redirect na `/cz`
- `/[country]` → dashboard pro danou zemi (`cz`, `sk`, `ger`, `at`); ostatní → 404
- `/[country]/kampan/[slug]` → detail kampaně, kde musí sedět zároveň země i slug
- Stará URL `/kampan/[slug]` byla **odstraněna bez redirectu** (klient ji neměl rozeslanou)

### Datový model

- V sheetech přibyly sloupce: `Země` (všechny 4), `Měna` (Kampane + Nasazeni)
- `Kampane.Země` a `Nasazeni.Země`: single value (CZ/SK/GER/AT)
- `Specialiste.Země` a `Kreativy.Země`: multi-value (lze pracovat na víc trzích)
- `Kampane.Měna` a `Nasazeni.Měna`: CZK / EUR (CZ+SK→CZK, GER+AT→EUR)
- `parseCountry` / `parseCountries` validují podle whitelistu — neznámé hodnoty se ignorují (řádek se nezobrazí na žádném dashboardu)

### UI

- **CountrySwitcher** v hlavičce (4 kompaktní taby `CZ / SK / GER / AT`), aktivní zvýrazněný. Přepínač vždy vede na root dashboard nové země — i z detail stránky (důvod: kampaň ze CZ nemusí v SK existovat)
- **Brand v hlavičce** se mění podle země: „Lindström Česko", „Lindström Slovensko" atd.
- **Badge země+měny** v detailu kampaně vedle Cíl/Status (např. „CZ · CZK")
- **Empty state**: pokud má země prázdné sheety, zobrazí se centrovaný hlášek místo errorů
- Odkazy v Timeline na detail mají teď tvar `/<country>/kampan/<slug>` (přes `toSlug()` z názvu kampaně, pokud chybí explicitní slug)

### Měny

- Nový helper `formatMoney(value, currency)` v `lib/format.ts` (Intl `cs-CZ` + CZK pro CZ/SK, `de-DE` + EUR pro GER/AT)
- `formatCzk` zachován jako tenký alias (`@deprecated`) pro zpětnou kompatibilitu
- DeploymentsTable formátuje rozpočet **podle měny daného nasazení** (`d.mena`), ne z parent kontextu — to je důležité, kdyby se měna kampaně a nasazení rozcházela

### Generování

- `generateStaticParams` v `app/[country]/page.tsx` pre-renderuje 4 země
- Detail kampaně je dynamický (ƒ) — jednotlivé slugy se nepre-renderují, řeší se on-demand
- Cache strategie nezměněna (jeden `cacheTag('sheets')` invaliduje data pro všechny země naráz)

### Co se nezměnilo

- Service account credentials, spreadsheet ID, Vercel env vars
- Vizuální design (jen přibyl switcher + badge)
- Endpoint `POST /api/revalidate?secret=...`

### Notes & data warnings odhalené při migraci

- 1 kampaň měla `Země=EN` (zřejmě překlep `GER`) — aplikace ji ignoruje
- 1 kampaň měla `Měna=SK` místo `CZK` — aplikace ji považuje za neplatnou měnu, dopad: `kampan.mena` je null, fallback na měnu země
- Několik kampaní mělo prázdné Země/Měna — nezobrazí se na žádném country dashboardu, dokud se nedoplní

---

## 2026-04-18 — První iterace klientského reviewu

### Odchylky od původního briefu, které dataset vynutil

- **Název záložky**: v Google Sheetu je `Nasazeni_v_systemech`, ne `Nasazeni`. Aplikace čte tento název v [lib/sheets.ts](lib/sheets.ts).
- **Slug sloupec v `Kampane`** má v sheetu hlavičku `ID slub` (překlep). Parser toleruje varianty `Slug`, `ID slug`, `ID slub`.
- **Checkbox `Aktivní`** u specialistů ukládá hodnotu `checked`, ne `TRUE`. `parseBoolean` tolerantně rozpozná `true`, `checked`, `1`, `ano`, `yes`.
- **Zdroj vazby kreativy ↔ nasazení** je finálně potvrzen jako `Nasazeni_v_systemech.Kreativy` (brief). Sloupec `Kreativy.Nasazení` aplikace při čtení ignoruje; kreativy přidávané do kampaně je nutné zapsat **z nasazení**, ne z kreativy.

### Nové sloupce a změny zobrazení

- **Timeline** (dashboard): pod názvem kampaně se zobrazuje `Cíl · Systémy, ...` místo původního `Cíl · Specialista`. Systémy se derivují z unikátních hodnot sloupce `Systém` v nasazeních dané kampaně.
- **Tabulka nasazení** (detail kampaně): přidán nový sloupec `ID nasazení` jako druhý sloupec (mezi Systém a Formát). Zobrazuje interní označení nasazení.

### Technická robustnost

- **Sheets API** požaduje `valueRenderOption: "UNFORMATTED_VALUE"` a `dateTimeRenderOption: "SERIAL_NUMBER"`. Důvod: při formátování čísel v tabulce (např. tisíce oddělené čárkou — „18,000") parser dostával textové řetězce a rozbíjel parsování. Neformátované hodnoty vrátí čísla jako JS `number` a data jako Excel serial — nezávisle na tom, co agentura v tabulce nastaví.
- **`parseNumber`** navíc zvládá i situace, kdy hodnota přijde jako string s různými oddělovači (české čárky, anglické čárky-tisíce, tečky) — funguje jako safety net.
- **`parseDate`** přijímá jak ISO string, tak Excel serial number.

### Co zbývá před nasazením do produkce

1. Rotovat service account private key (předchozí se mohl objevit v transcriptech Claude)
2. Nastavit silný `REVALIDATE_SECRET`
3. Zveřejnit na Vercelu a předat klienta link
