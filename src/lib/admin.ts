import { cookies } from "next/headers";
import { config } from "./config";

export const ADMIN_COOKIE = "tc_admin";

// Sehr einfacher Schutz für das MVP: Das in ADMIN_PASSWORD gesetzte Passwort
// wird als Cookie-Wert gespeichert und bei jeder Anfrage verglichen.
export function adminPasswortKorrekt(eingabe: string): boolean {
  return Boolean(config.adminPasswort) && eingabe === config.adminPasswort;
}

export function istAdmin(): boolean {
  if (!config.adminPasswort) return false;
  const c = cookies().get(ADMIN_COOKIE);
  return c?.value === config.adminPasswort;
}
