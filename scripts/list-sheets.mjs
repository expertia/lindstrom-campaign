import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(".env.local");
const raw = fs.readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  raw
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      let v = l.slice(idx + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, idx).trim(), v];
    }),
);

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const res = await sheets.spreadsheets.get({
  spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
  fields: "sheets.properties(title,sheetId)",
});
console.log("Sheets in spreadsheet:");
for (const s of res.data.sheets ?? []) {
  console.log(`  - "${s.properties?.title}" (id=${s.properties?.sheetId})`);
}
