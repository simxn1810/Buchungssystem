import StornoForm from "@/components/StornoForm";

export const dynamic = "force-dynamic";

export default function StornoPage({ params }: { params: { token: string } }) {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-verein-blau">Buchung stornieren</h1>
      <StornoForm token={params.token} />
    </div>
  );
}
