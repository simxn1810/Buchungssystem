# Hallenbuchung – TC Frankenau 1978 e.V.

Mobile-first Web-App, mit der Gäste online einen Hallenplatz (Tennis/Squash) beim
Tennisclub Frankenau 1978 e.V. reservieren können. **Keine Online-Zahlung** – die
Bezahlung erfolgt vor Ort. Eine Buchung wird erst gültig, nachdem ein
Bestätigungscode (per E-Mail oder optional SMS) eingegeben wurde.

## Tech-Stack

- **Next.js** (App Router) + **TypeScript**
- **Prisma ORM** mit **SQLite** (MVP). Umstieg auf **PostgreSQL** ohne
  Schemaänderung möglich (nur `provider` + `DATABASE_URL` ändern).
- **Tailwind CSS** (Vereinsfarben Blau `#00417A`, Gelb `#FBFF00`, weißer Hintergrund)
- E-Mail über **Resend** (REST-API) oder generisches **SMTP** (nodemailer)
- SMS optional über pluggbaren Adapter (**Twilio**). Ohne SMS-Zugangsdaten läuft
  die App vollständig nur mit dem E-Mail-Kanal.
- Deploybar auf **Vercel**

## Funktionsumfang

- Zeitraster in 15-Minuten-Schritten, Öffnungszeiten 07:00–23:00 Uhr
- Buchung mehrerer aufeinanderfolgender Slots (Min. 30 Min, Max. konfigurierbar)
- Doppelbuchung wird auf DB-Ebene verhindert (Unique-Constraint je belegtem Slot,
  Anlage in einer Transaktion)
- Buchbarer Horizont: max. 2 Monate im Voraus
- Bestätigungscode statt Login; vorläufige Reservierung mit Ablauffrist
- Storno nur mit zufälligem Storno-Token
- Ausstattung (Leihschläger, Bälle), Tarif/Saison- und Mitglied/Gast-Auswahl
- Konfigurierbare Tarifmatrix (Sportart × Saison × Mitglied/Gast × Wochentag × Zeitfenster)
- Feste Gesamtsumme mit Hinweis „Vor Ort zu zahlen"
- Admin-Bereich (Passwortschutz): Sperrzeiten, Buchungsübersicht/-storno, Tarife pflegen
- Impressum/Datenschutz (Platzhalter), DSGVO-Löschung nach X Tagen

## Lokale Einrichtung

Voraussetzung: Node.js 18+.

```bash
# 1. Abhängigkeiten installieren
npm install

# 2. Umgebungsvariablen anlegen
cp .env.example .env
#    -> ADMIN_PASSWORD setzen; E-Mail/SMS optional

# 3. Datenbank-Schema anwenden (legt SQLite-DB an)
npm run prisma:migrate      # beim ersten Mal Name vergeben, z. B. "init"

# 4. Seed: 3 Plätze + Tarif-Startwerte
npm run seed

# 5. Entwicklungsserver
npm run dev
```

App: <http://localhost:3000>, Admin: <http://localhost:3000/admin>

> Ohne konfigurierten E-Mail-/SMS-Provider werden Codes und Bestätigungen in die
> **Server-Konsole** geschrieben – ideal zum lokalen Testen.

## Umgebungsvariablen

Alle Variablen sind in `.env.example` dokumentiert. Die wichtigsten:

| Variable | Zweck | Default |
| --- | --- | --- |
| `DATABASE_URL` | DB-Verbindung (SQLite/PostgreSQL) | `file:./dev.db` |
| `ADMIN_PASSWORD` | Passwort für den Admin-Bereich | – |
| `OEFFNUNG_VON` / `OEFFNUNG_BIS` | Öffnungszeiten | `07:00` / `23:00` |
| `MIN_DAUER_MINUTEN` / `MAX_DAUER_MINUTEN` | Buchungsdauer | `30` / `180` |
| `BUCHUNG_HORIZONT_TAGE` | Buchbarer Vorlauf | `62` |
| `CODE_GUELTIG_MINUTEN` | Reservierungsdauer bis Code-Eingabe | `10` |
| `DATEN_LOESCH_TAGE` | DSGVO-Löschfrist | `60` |
| `LEIHSCHLAEGER_CENT_PRO_STUNDE` | Leihschläger-Preis (Cent) | `100` |
| `BALL_PREIS_CENT` | Ballpreis (Cent) | `0` |
| `ERMAESSIGUNG_CENT_PRO_STUNDE` | Schüler/Studenten-Abzug (Cent) | `200` |
| `RESEND_API_KEY` / `EMAIL_FROM` | E-Mail via Resend | – |
| `SMTP_*` | E-Mail via SMTP (Fallback) | – |
| `TWILIO_*` | SMS (optional) | – |
| `CRON_SECRET` | Schutz für `/api/cron/cleanup` | – |

## Tarife

Der Seed legt die Tariftabelle für **alle** Dimensionen (Saison, Mitglied/Gast,
Wochentag, Zeitfenster) an. Als Startwerte dienen die auf der Vereinsseite
veröffentlichten **Winter-Einzelstundenpreise**:

- Tennis Winter: 07–14 Uhr 19 €, 14–18 Uhr 21 €, 18–21 Uhr 24 €, 21–23 Uhr 19 €
- Squash Winter: Nebenzeit ~13 €, Hauptzeit (18–21 Uhr) ~15 €

> **Wichtig:** Die Vereinsseite veröffentlicht für die Halle keine getrennten
> Mitglied-/Gast-Preise und keine Sommer-Hallenpreise. Diese Startwerte sind
> daher über die fehlenden Dimensionen gleich gesetzt und **müssen vor dem
> Live-Gang mit dem Verein abgestimmt** werden. Es wurden keine Preise erfunden.
> Anpassung im Admin-Bereich unter „Tarife".

## Tests

```bash
npm run test
```

- **Reine Unit-Tests** (ohne DB): Zeit/Slots, Saison, Preisberechnung
- **Integrationstests** (benötigen migrierte DB): Slot-Verfügbarkeit,
  Doppelbuchung bei gleichzeitigen Anfragen, Ablauf der Code-Frist,
  Stornierung nur mit gültigem Token. Die Tests legen einen eigenen Testplatz an
  und räumen nach sich selbst auf.

## DSGVO-Aufräumung

Buchungsdaten werden nach `DATEN_LOESCH_TAGE` Tagen gelöscht:

```bash
npm run cleanup                 # manuell / per Cron
```

Auf Vercel ist in `vercel.json` ein täglicher Cron auf `/api/cron/cleanup`
hinterlegt (mit `CRON_SECRET` absicherbar).

## Deployment auf Vercel

1. Repository zu Vercel hinzufügen.
2. Datenbank: SQLite ist auf Vercel (read-only FS) **nicht** für Schreibzugriffe
   geeignet – für Produktion **PostgreSQL** verwenden:
   - in `prisma/schema.prisma`: `provider = "postgresql"`
   - `DATABASE_URL` auf die Postgres-Instanz setzen (z. B. Vercel Postgres / Neon)
3. Umgebungsvariablen im Vercel-Projekt setzen (siehe Tabelle oben).
4. Build-Command nutzt `prisma generate` automatisch (`npm run build`).
   Migrationen vor/bei Deploy ausführen: `npm run prisma:deploy`.
5. Seed einmalig ausführen (lokal gegen die Prod-DB oder via One-off-Job):
   `npm run seed`.

## Projektstruktur (Auszug)

```
prisma/schema.prisma     Datenmodell (Platz, Buchung, Belegung, Sperrung, Tarif)
prisma/seed.ts           Seed: 3 Plätze + Tarif-Startwerte
src/lib/                 Kernlogik (Zeit, Verfügbarkeit, Preise, Code, Versand)
src/app/api/             API-Routen (Buchung, Verfügbarkeit, Admin, Cron)
src/app/                 Seiten (Buchung, Storno, Admin, Impressum, Datenschutz)
src/components/          UI-Komponenten (Buchungsflow, Admin)
tests/                   Unit- und Integrationstests
```

## Vereinsdaten

Tennisclub Frankenau 1978 e.V. · Am Sternberg 3 (Navi: Am Sternberg 1d), 35110
Frankenau · Vorsitzender: Uwe Eimer · kontakt@tennis-frankenau.de · Tel.
01578 5533988 · WhatsApp +49 159 01233300 · Instagram @tcfrankenau
