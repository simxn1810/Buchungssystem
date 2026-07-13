// SMS-Versand als pluggbarer Adapter (Beispiel: Twilio REST-API).
// Sind keine Twilio-Zugangsdaten gesetzt, ist SMS deaktiviert. Die App muss
// dann ohne SMS-Provider voll funktionieren (nur E-Mail-Kanal).

export function smsAktiv(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER
  );
}

type SmsInput = {
  to: string;
  text: string;
};

export async function sendeSms({ to, text }: SmsInput): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    // Fallback für lokale Entwicklung ohne SMS-Provider.
    console.log("\n--- SMS (kein Provider konfiguriert) ---");
    console.log(`An: ${to}`);
    console.log(text);
    console.log("--- ENDE SMS ---\n");
    return;
  }

  const body = new URLSearchParams({ To: to, From: from, Body: text });
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Twilio-Fehler ${res.status}: ${t}`);
  }
}
