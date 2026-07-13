import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-verein-blau">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-badge-weiss.png" alt="" width={44} height={28} priority />
          <span className="text-lg font-bold text-white">TC Frankenau</span>
        </Link>
        <span className="hidden text-sm text-white/80 sm:block">Hallenbuchung</span>
      </div>
    </header>
  );
}
