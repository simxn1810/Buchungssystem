// Erkennung und einfache Validierung des Kontaktwegs.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Deutsche/internationale Telefonnummern grob: optional +, dann 6-15 Ziffern.
const TEL_RE = /^\+?[0-9 /()-]{6,20}$/;

export type KontaktTyp = "email" | "telefon";

export function erkenneKontaktTyp(kontakt: string): KontaktTyp | null {
  const k = kontakt.trim();
  if (EMAIL_RE.test(k)) return "email";
  // Nur als Telefon werten, wenn ueberwiegend Ziffern.
  const ziffern = (k.match(/[0-9]/g) || []).length;
  if (TEL_RE.test(k) && ziffern >= 6) return "telefon";
  return null;
}

export function telefonNormalisieren(tel: string): string {
  const t = tel.replace(/[^0-9+]/g, "");
  if (t.startsWith("+")) return t;
  if (t.startsWith("00")) return "+" + t.slice(2);
  if (t.startsWith("0")) return "+49" + t.slice(1); // Deutschland-Default
  return t;
}
