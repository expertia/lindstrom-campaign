import { google } from "googleapis";
import fs from "node:fs";
import path from "node:path";

const raw = fs.readFileSync(path.resolve(".env.local"), "utf-8");
const env = Object.fromEntries(
  raw
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      let v = l.slice(i + 1).trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      return [l.slice(0, i).trim(), v];
    }),
);

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});
const sheets = google.sheets({ version: "v4", auth });

const res = await sheets.spreadsheets.values.batchGet({
  spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
  ranges: [
    "Specialiste!A:Z",
    "Kampane!A:Z",
    "Nasazeni_v_systemech!A:Z",
    "Kreativy!A:Z",
  ],
});

for (const vr of res.data.valueRanges ?? []) {
  console.log(`\n=== ${vr.range} ===`);
  const rows = vr.values ?? [];
  console.log(`rows: ${rows.length}`);
  for (const r of rows.slice(0, 6)) {
    console.log(JSON.stringify(r));
  }
}
