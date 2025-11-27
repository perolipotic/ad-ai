import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { MainNav } from "@/components/Navigation";
import Image from "next/image";
import Script from "next/script";

export const metadata: Metadata = {
  title: "kreirajoglas.com – AI oglasi za nekretnine",
  description:
    "Brzo generiraj profesionalan oglas za stan ili kuću uz pomoć AI-ja.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          strategy="afterInteractive"
        />
        <div className="flex min-h-screen flex-col">
          {/* HEADER / NAV */}
          <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:py-4">
              {/* Logo + naziv appa kao jedan klikabilan blok */}
              <Link href="/" className="flex items-center gap-3">
                <Image
                  src="/images/logo.png"
                  alt="Logo kreirajoglas.com"
                  width={56}
                  height={56}
                  className="shrink-0"
                />
                <span className="text-xl md:text-2xl font-semibold tracking-tight">
                  kreiraj<span className="text-blue-600">oglas</span>.com
                </span>
              </Link>

              {/* Navigacija */}
              <MainNav />
            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
              {children}
            </div>
          </main>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 bg-white/70">
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 md:flex-row md:items-center md:justify-between">
              <p className="text-xs md:text-sm text-slate-500">
                © {new Date().getFullYear()} kreirajoglas.com · MVP projekt za
                generiranje oglasa za nekretnine.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 bg-white">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    Powered by
                  </span>
                  <span className="text-xs font-semibold text-slate-900">
                    OpenAI
                  </span>
                </div>
                <Link
                  href="/legal"
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Kako koristimo tvoje podatke?
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
