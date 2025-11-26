"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 md:gap-3">
      {/* POČETNA */}
      <Link
        href="/"
        className={
          "text-xs md:text-sm rounded-full px-3 py-1.5 transition-colors " +
          (isActive(pathname, "/")
            ? "text-blue-700 border border-blue-500 bg-blue-50"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        Početna
      </Link>

      {/* KREIRAJ OGLAS */}
      <Link
        href="/create-ad"
        className={
          "text-xs md:text-sm rounded-full px-3 py-1.5 transition-colors " +
          (isActive(pathname, "/create-ad")
            ? "text-blue-700 border border-blue-500 bg-blue-50"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        Kreiraj oglas
      </Link>

      {/* LEGAL */}
      <Link
        href="/legal"
        className={
          "hidden sm:inline text-xs md:text-sm rounded-full px-3 py-1.5 transition-colors " +
          (isActive(pathname, "/legal")
            ? "text-blue-700 border border-blue-500 bg-blue-50"
            : "text-slate-600 hover:text-slate-900")
        }
      >
        Pravila &amp; privatnost
      </Link>
    </nav>
  );
}
