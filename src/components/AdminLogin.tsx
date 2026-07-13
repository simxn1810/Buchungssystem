"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [passwort, setPasswort] = useState("");
  const [fehler, setFehler] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function login() {
    setBusy(true);
    setFehler(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passwort }),
      });
      if (!res.ok) {
        const json = await res.json();
        setFehler(json.fehler || "Login fehlgeschlagen.");
        return;
      }
      window.location.reload();
    } catch {
      setFehler("Netzwerkfehler.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-lg border border-gray-200 p-5">
      <h1 className="mb-4 text-xl font-bold text-verein-blau">Admin-Login</h1>
      <input
        type="password"
        value={passwort}
        onChange={(e) => setPasswort(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && login()}
        placeholder="Passwort"
        className="w-full rounded border border-gray-300 px-3 py-2"
      />
      {fehler && <p className="mt-3 text-sm text-red-600">{fehler}</p>}
      <button
        onClick={login}
        disabled={busy || !passwort}
        className="mt-4 w-full rounded bg-verein-gelb px-4 py-2 font-semibold text-verein-blau disabled:opacity-50"
      >
        {busy ? "…" : "Anmelden"}
      </button>
    </div>
  );
}
