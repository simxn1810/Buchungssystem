import { randomBytes, randomInt } from "crypto";

// 6-stelliger Bestätigungscode.
export function erzeugeCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

// Zufälliger Storno-Token (URL-sicher).
export function erzeugeStornoToken(): string {
  return randomBytes(24).toString("base64url");
}
