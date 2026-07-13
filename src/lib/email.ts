// E-Mail-Versand. Reihenfolge:
//   1. Resend (REST-API), wenn RESEND_API_KEY gesetzt ist.
//   2. SMTP (nodemailer), wenn SMTP_HOST gesetzt ist.
//   3. Fallback: Ausgabe in die Server-Konsole (nur lokale Entwicklung).

type MailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendeEmail({ to, subject, text }: MailInput): Promise<void> {
  const from = process.env.EMAIL_FROM || "TC Frankenau <kontakt@tennis-frankenau.de>";

  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend-Fehler ${res.status}: ${body}`);
    }
    return;
  }

  if (process.env.SMTP_HOST) {
    // nodemailer nur dynamisch laden, damit es ohne SMTP nicht benötigt wird.
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: (process.env.SMTP_SECURE || "false").toLowerCase() === "true",
      auth:
        process.env.SMTP_USER || process.env.SMTP_PASSWORD
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
          : undefined,
    });
    await transporter.sendMail({ from, to, subject, text });
    return;
  }

  // Fallback für lokale Entwicklung.
  console.log("\n--- E-MAIL (kein Versand-Provider konfiguriert) ---");
  console.log(`An: ${to}`);
  console.log(`Betreff: ${subject}`);
  console.log(text);
  console.log("--- ENDE E-MAIL ---\n");
}
