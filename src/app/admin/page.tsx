import { istAdmin } from "@/lib/admin";
import { config } from "@/lib/config";
import { heuteISO } from "@/lib/time";
import { prisma } from "@/lib/prisma";
import AdminApp from "@/components/AdminApp";
import AdminLogin from "@/components/AdminLogin";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!config.adminPasswort) {
    return (
      <div className="rounded border border-amber-300 bg-amber-50 p-4 text-sm">
        Der Admin-Bereich ist nicht konfiguriert. Bitte die Umgebungsvariable{" "}
        <code>ADMIN_PASSWORD</code> setzen.
      </div>
    );
  }

  if (!istAdmin()) {
    return <AdminLogin />;
  }

  const plaetze = await prisma.platz.findMany({
    where: { aktiv: true },
    orderBy: { id: "asc" },
    select: { id: true, name: true },
  });

  return <AdminApp plaetze={plaetze} heute={heuteISO()} />;
}
