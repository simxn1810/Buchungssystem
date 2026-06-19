-- CreateTable
CREATE TABLE "Zugangscode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "wochentag" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "aktualisiertAm" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Zugangscode_wochentag_key" ON "Zugangscode"("wochentag");
