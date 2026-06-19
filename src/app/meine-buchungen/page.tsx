import MeineBuchungen from "@/components/MeineBuchungen";

export const metadata = { title: "Meine Buchungen stornieren – TC Frankenau" };

export default function MeineBuchungenPage() {
  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-verein-blau">Buchung stornieren</h1>
      <p className="mb-6 text-sm text-gray-600">
        Geben Sie Ihren Namen und Ihre E-Mail-Adresse ein, um Ihre kommenden Buchungen anzuzeigen
        und zu stornieren.
      </p>
      <MeineBuchungen />
    </div>
  );
}
