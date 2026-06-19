-- CreateTable
CREATE TABLE "Platz" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "typ" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Platz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Buchung" (
    "id" SERIAL NOT NULL,
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
    "codeAblauf" TIMESTAMP(3),
    "stornoToken" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Buchung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Belegung" (
    "id" SERIAL NOT NULL,
    "buchungId" INTEGER NOT NULL,
    "platzId" INTEGER NOT NULL,
    "datum" TEXT NOT NULL,
    "slot" TEXT NOT NULL,

    CONSTRAINT "Belegung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sperrung" (
    "id" SERIAL NOT NULL,
    "platzId" INTEGER,
    "datum" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "grund" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sperrung_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zugangscode" (
    "id" SERIAL NOT NULL,
    "wochentag" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zugangscode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarif" (
    "id" SERIAL NOT NULL,
    "sportart" TEXT NOT NULL,
    "saison" TEXT NOT NULL,
    "mitglied" BOOLEAN NOT NULL,
    "wochentagGruppe" TEXT NOT NULL,
    "zeitVon" TEXT NOT NULL,
    "zeitBis" TEXT NOT NULL,
    "preisProStundeCent" INTEGER NOT NULL,

    CONSTRAINT "Tarif_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Zugangscode_wochentag_key" ON "Zugangscode"("wochentag");

-- CreateIndex
CREATE INDEX "Tarif_sportart_saison_idx" ON "Tarif"("sportart", "saison");

-- AddForeignKey
ALTER TABLE "Buchung" ADD CONSTRAINT "Buchung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belegung" ADD CONSTRAINT "Belegung_buchungId_fkey" FOREIGN KEY ("buchungId") REFERENCES "Buchung"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Belegung" ADD CONSTRAINT "Belegung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sperrung" ADD CONSTRAINT "Sperrung_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz"("id") ON DELETE SET NULL ON UPDATE CASCADE;
