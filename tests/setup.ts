// Laedt einfache KEY=VALUE-Paare aus einer .env-Datei in process.env,
// damit DATABASE_URL fuer die Integrationstests gesetzt ist (ohne dotenv).
import { readFileSync, existsSync } from "fs";
import path from "path";

function ladeEnv(datei: string) {
  if (!existsSync(datei)) return;
  const inhalt = readFileSync(datei, "utf8");
  for (const zeile of inhalt.split("\n")) {
    const t = zeile.trim();
    if (!t || t.startsWith("#")) continue;
    const idx = t.indexOf("=");
    if (idx < 0) continue;
    const key = t.slice(0, idx).trim();
    let val = t.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

ladeEnv(path.resolve(process.cwd(), ".env"));

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./dev.db";
}
