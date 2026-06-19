"use client";

import { useState } from "react";

export default function StornoForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "fehler">("idle");
  const [fehler, setFehler] = useState<string | null>(null);

  async function stornieren() {
    setStatus("busy");
    setFehler(null);
    try {
      const res = await fetch("/api/buchungen/stornieren", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFehler(json.fehler || "Stornierung fehlgeschlagen.");
        setStatus("fehler");
        return;
      }
      setStatus("ok");
    } catch {
      setFehler("Netzwerkfehler. Bitte erneut versuchen.");
      setStatus("fehler");
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-lg border border-green-300 bg-green-50 p-5">
        <p className="font-semibold text-green-800">Ihre Buchung wurde storniert.</p>
        <a href="/" className="mt-3 inline-block text-verein-blau underline">
          Zurueck zur Buchung
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 p-5">
      <p className="mb-4 text-sm text-gray-700">
        Moechten Sie diese Buchung wirklich stornieren? Dieser Schritt kann nicht rueckgaengig
        gemacht werden.
      </p>
      {fehler && <p className="mb-3 text-sm text-red-600">{fehler}</p>}
      <button
        onClick={stornieren}
        disabled={status === "busy"}
        className="w-full rounded bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {status === "busy" ? "Storniere…" : "Jetzt stornieren"}
      </button>
      <a href="/" className="mt-2 block text-center text-sm text-gray-500 underline">
        Abbrechen
      </a>
    </div>
  );
}
