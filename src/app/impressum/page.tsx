import { VEREIN } from "@/lib/config";

export const metadata = { title: "Impressum – TC Frankenau" };

export default function ImpressumPage() {
  return (
    <div className="prose prose-sm max-w-none">
      <h1 className="text-2xl font-bold text-verein-blau">Impressum</h1>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Angaben gemaess § 5 DDG</h2>
      <p>
        {VEREIN.name}
        <br />
        {VEREIN.vereinsanschrift}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Vertreten durch</h2>
      <p>
        Vorsitzender: {VEREIN.vorsitzender}
        <br />
        {VEREIN.vorsitzenderAdresse}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Kontakt</h2>
      <p>
        Telefon: {VEREIN.telefon}
        <br />
        E-Mail: {VEREIN.email}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Postadresse</h2>
      <p>
        {VEREIN.name}
        <br />
        Vorsitzender: {VEREIN.vorsitzender}
        <br />
        {VEREIN.vorsitzenderAdresse}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Steuernummer</h2>
      <p>{VEREIN.steuernummer}</p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Redaktionell verantwortlich</h2>
      <p>
        {VEREIN.name}
        <br />
        Vorsitzender: {VEREIN.vorsitzender}
        <br />
        {VEREIN.vorsitzenderAdresse}
      </p>

      <h2 className="mt-6 text-lg font-semibold text-verein-blau">Webmaster</h2>
      <p>{VEREIN.webmaster}</p>

      <p className="mt-6 text-sm text-gray-500">
        Anfahrt zur Tennishalle: {VEREIN.adresse} ({VEREIN.naviHinweis}).
      </p>
    </div>
  );
}
