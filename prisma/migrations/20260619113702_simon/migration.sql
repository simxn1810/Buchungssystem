-- CreateTable
CREATE TABLE "Platz" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "Buchung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platzId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "startzeit" TEXT NOT NULL,
    "dauerMinuten" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "kontakt" TEXT NOT NULL,
    "kontaktTyp" TEXT NOT NULL,
    "mitglied" BOOLEAN NOT NULL DEFAULT false,
    "leihschlaegerAnzahl" INTEGER NOT NULL DEFAULT 0,
    "baelle" BOOLEAN NOT NULL DEFAULT false,
    "ermaessigung" BOOLEAN NOT NULL DEFAULT false,
    "gesamtpreisCent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ausstehend',
    "code" TEXT,
    "codeAblauf" DATETIME,
    "stornoToken" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Buchung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Belegung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "buchungId" INTEGER NOT NULL,
    "platzId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    CONSTRAINT "Belegung_buchungId_fkey" FOREIGN KEY ("buchungId") REFERENCES "Buchung" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Belegung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sperrung" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "platzId" INTEGER,
    "datum" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "grund" TEXT NOT NULL,
    "erstelltAm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sperrung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Tarif" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sportart" TEXT NOT NULL,
    "saison" TEXT NOT NULL,
    "mitglied" BOOLEAN NOT NULL,
    "wochentagGruppe" TEXT NOT NULL,
    "zeitVon" TEXT NOT NULL,
    "zeitBis" TEXT NOT NULL,
    "preisProStundeCent" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Buchung_stornoToken_key" ON "Buchung"("stornoToken");

-- CreateIndex
CREATE INDEX "Buchung_datum_idx" ON "Buchung"("datum");

-- CreateIndex
CREATE INDEX "Buchung_status_idx" ON "Buchung"("status");

-- CreateIndex
CREATE INDEX "Belegung_datum_idx" ON "Belegung"("datum");

-- CreateIndex
CREATE UNIQUE INDEX "Belegung_platzId_datum_slot_key" ON "Belegung"("platzId", "datum", "slot");

-- CreateIndex
CREATE INDEX "Sperrung_datum_idx" ON "Sperrung"("datum");

-- CreateIndex
CREATE INDEX "Tarif_sportart_saison_idx" ON "Tarif"("sportart", "saison");
