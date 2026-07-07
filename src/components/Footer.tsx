import Link from "next/link";
import { VEREIN } from "@/lib/config";

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-gray-600">
        <p className="font-semibold text-verein-blau">{VEREIN.name}</p>
        <p>
          {VEREIN.adresse} ({VEREIN.naviHinweis})
        </p>
        <p>Vorsitzender: {VEREIN.vorsitzender}</p>
        <p>
          E-Mail:{" "}
          <a className="text-verein-blau underline" href={`mailto:${VEREIN.email}`}>
            {VEREIN.email}
          </a>
        </p>
        <p>Telefon: {VEREIN.telefon}</p>
        <p>WhatsApp: {VEREIN.whatsapp}</p>
        <p>Instagram: {VEREIN.instagram}</p>

        <nav className="mt-4 flex flex-wrap gap-4">
          <Link className="text-verein-blau underline" href="/">
            Buchen
          </Link>
          <Link className="text-verein-blau underline" href="/kalender">
            Wochenübersicht
          </Link>
          <Link className="text-verein-blau underline" href="/meine-buchungen">
            Buchung stornieren
          </Link>
          <Link className="text-verein-blau underline" href="/preise">
            Preise
          </Link>
          <Link className="text-verein-blau underline" href="/kontakt">
            Kontakt
          </Link>
          <Link className="text-verein-blau underline" href="/impressum">
            Impressum
          </Link>
          <Link className="text-verein-blau underline" href="/datenschutz">
            Datenschutz
          </Link>
          <Link className="text-verein-blau underline" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </footer>
  );
}
