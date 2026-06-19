import { VEREIN } from "@/lib/config";

export const metadata = { title: "Impressum – TC Frankenau" };

export default function ImpressumPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-verein-blau">Impressum</h1>
      <p className="text-sm text-gray-500">
        Platzhalter – bitte vor dem Live-Gang durch das offizielle Impressum des Vereins ersetzen.
        Es gilt das Impressum unter{" "}
        <a className="text-verein-blau underline" href={VEREIN.website} target="_blank">
          tennis-frankenau.de
        </a>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Angaben gemaess § 5 DDG</h2>
      <p>
        {VEREIN.name}
        <br />
        {VEREIN.adresse}
        <br />
        {VEREIN.naviHinweis}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Vertreten durch</h2>
      <p>Vorsitzender: {VEREIN.vorsitzender}</p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Kontakt</h2>
      <p>
        E-Mail: {VEREIN.email}
        <br />
        Telefon: {VEREIN.telefon}
      </p>
    </div>
  );
}
