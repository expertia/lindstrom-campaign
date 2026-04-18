# Changelog

Chronologický přehled změn projektu. Nejnovější nahoře.

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
