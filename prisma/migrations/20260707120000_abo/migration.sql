-- CreateTable
CREATE TABLE "Abo" (
    "id" SERIAL NOT NULL,
    "platzId" INTEGER NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "zeitVon" TEXT NOT NULL,
    "zeitBis" TEXT NOT NULL,
    "datumVon" TEXT NOT NULL,
    "datumBis" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "erstelltAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Abo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Abo_wochentag_idx" ON "Abo"("wochentag");

-- CreateIndex
CREATE INDEX "Abo_platzId_idx" ON "Abo"("platzId");

-- AddForeignKey
ALTER TABLE "Abo" ADD CONSTRAINT "Abo_platzId_fkey" FOREIGN KEY ("platzId") REFERENCES "Platz"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
