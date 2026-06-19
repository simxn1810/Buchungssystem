import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Hallenbuchung – TC Frankenau 1978 e.V.",
  description:
    "Online einen Hallenplatz beim Tennisclub Frankenau 1978 e.V. reservieren. Tennis und Squash, Zahlung vor Ort.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00417A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
