// Saison-Erkennung anhand des Buchungsdatums.
// Winter: 01.10. - 30.04., Sommer: 01.05. - 30.09.

export function saisonFuerDatum(datum: string): "winter" | "sommer" {
  const monat = Number(datum.split("-")[1]);
  // Mai (5) bis September (9) = Sommer, sonst Winter.
  return monat >= 5 && monat <= 9 ? "sommer" : "winter";
}
