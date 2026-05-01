# Changelog

Chronologický přehled změn projektu. Nejnovější nahoře.

## 2026-05-01 — Nový sloupec `Youtube URL` v Kreativách

Sheet `Kreativy` má nový volitelný sloupec **`Youtube URL`** (parser tolerantně přijme i `YouTube URL`, `Youtube`, `YouTube`). Pokud je vyplněn, v detail kampaně se v kartě kreativy zobrazí druhý odkaz **„YouTube"** vedle stávajícího **„Otevřít v Disku"**.

- `Kreativa.youtubeUrl: string` v `types/index.ts`
- mapper v `lib/sheets.ts` čte sloupec přes `headerIndex`
- `CreativeGrid.tsx` zobrazí oba odkazy ve flex-row, prázdná hodnota → odkaz se neukáže

## 2026-04-29 — Bug fix: kreativy se nezobrazovaly při duplicitních názvech

`getCreativesForCampaign` v `lib/data.ts` dělala dedupe `Map<nazev, Kreativa>` přes všechny řádky napříč zeměmi. Při více řádcích se stejným názvem (např. CZ + GER + AT verze stejné kreativy) vyhrával poslední — typicky AT/GER řádek bez URL — a CZ kreativa pak vypadla na country filtru.

Oprava: nejdřív filtr podle země, **pak** dedupe (a `first wins` místo `last wins`). Příklad „Kryjeme vám záda" měla 5 řádků (CZ x2 s URL, GER x2 prázdné, AT x1 prázdné) — před opravou výsledek prázdný, po opravě CZ řádek s Drive URL.

## 2026-04-29 — Náhledy kreativ (Drive thumbnail API)

V detailu kampaně se v gridu kreativ zobrazuje statický náhled místo placeholderu s typem.

- Drive sdílecí URL (`/file/d/<ID>/view`) nejsou přímo embeddovatelné, ale Drive nabízí thumbnail endpoint `https://drive.google.com/thumbnail?id=<ID>&sz=w800` (vrací JPEG, redirektuje na `lh3.googleusercontent.com`)
- Helpery v `lib/drive.ts`: `extractDriveFileId`, `driveThumbnailUrl`, `isDriveUrl`
- Pro `creative.typ === "Video"` se nad thumbnail vykreslí semi-transparentní play icon overlay
- Soubory v Drive musí být sdíleny **„Kdokoli s odkazem"**, jinak Drive vrátí 403

## 2026-04-29 — Timeline: pruhy z nasazení místo z `Kampaň.Start/Konec`

Předtím každá kampaň měla na timeline jeden souvislý pruh `Start–Konec` z tabulky `Kampane`. Teď se časové bloky derivují z tabulky `Nasazeni_v_systemech`, takže kampaň se 3 fázemi v roce (jaro / léto / podzim) má 3 oddělené pruhy v jednom řádku.

- `mergeDeploymentSegments` v `lib/data.ts` — sloučí překrývající se / dotýkající se intervaly nasazení do jednoho segmentu (unie). Nesouvislé fáze zůstávají oddělené (mezi nimi prázdno)
- V pruhu se zobrazuje `ID nasazení` + krátké datum (`formatDateRangeShort` v `lib/format.ts`, vynechává rok pokud start a konec jsou ve stejném roce)
- Sloučené segmenty → všechna ID čárkou oddělená + sjednocený datum
- Pruh užší než ~60 px → text se schová (full info v `title` atributu = browser tooltip)
- Filtrování řádků: kampaň se na timeline objeví jen pokud má aspoň jedno nasazení překrývající okno; bez nasazení = bez řádku
- Výška pruhu zvětšena z 28 na 36 px kvůli 2 řádkům textu

## 2026-04-29 — Timeline: kotev okna na leden aktuálního roku

Místo `aktuální měsíc ± 6` se okno teď začíná **lednem aktuálního roku** a obsahuje 13 měsíců dopředu (Leden 2026 → Leden 2027 v roce 2026; v 2027 se přesune o rok). Důvod: kampaně se plánují na celý kalendářní rok, zobrazování předchozího říjen-prosinec, kdy ještě nic nebylo, mělo nulovou hodnotu.

## 2026-04-29 — Timeline: 13měsíční okno + sticky levý sloupec

Rozšířen pohled z 7 na 13 měsíců. Levý sloupec s názvy kampaní + label **„Investováno"** v patičce jsou teď `position: sticky; left: 0` — při horizontálním scrollu zůstávají v zorném poli.

- Hover state přesunut z `<Link>` na inner divs přes Tailwind `group-hover`, aby fungoval konzistentně přes opaque sticky bg i transparentní bar area
- Today line (svislá šedá čára) má z-index nižší než sticky levý sloupec, takže ho při scrollu nepřekryje
- Měsíce zůstávají 110 px široké, scroll dojede dál vpravo

## 2026-04-28 — Fix: SK má měnu EUR, ne CZK

Slovensko používá euro, brief měl chybný mapping `SK → CZK`.
Opraveno v `COUNTRY_TO_CURRENCY` v `types/index.ts`.

**Dopad pro data v sheetu:** všechny řádky s `Země=SK` by měly mít
`Měna=EUR`. Pokud zůstanou `Měna=CZK`, parser je vyhodí jako null
(neshoda s validním mapováním), aplikace pak fallbackuje na měnu
země (= EUR), takže formátování bude správně, ale data jsou
nekonzistentní. Doporučeno opravit v sheetu.

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
