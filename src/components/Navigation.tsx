"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function MainNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  // Close menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close if clicking outside (ali ne kad kliknemo na hamburger)
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return; // ako je već zatvoren, ne radi ništa

      const target = e.target as Node | null;
      if (!target) return;

      const menu = menuRef.current;
      const toggle = toggleRef.current;

      // ako klikneš na meni ili na toggle → ne zatvaraj tu
      if (menu?.contains(target) || toggle?.contains(target)) {
        return;
      }

      // bilo gdje drugdje → zatvori
      setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <nav className="relative flex items-center gap-2 md:gap-3">
      {/* DESKTOP NAV */}
      <div className="hidden md:flex items-center gap-2 md:gap-3">
        <NavItem pathname={pathname} href="/">
          Početna
        </NavItem>

        <NavItem pathname={pathname} href="/create-ad">
          Nekretnine
        </NavItem>

        <NavItem pathname={pathname} href="/ads">
          Ostali oglasi
        </NavItem>

        <NavItem pathname={pathname} href="/legal" className="hidden sm:inline">
          Pravila &amp; privatnost
        </NavItem>
      </div>

      {/* MOBILE HAMBURGER */}
      <button
        ref={toggleRef}
        type="button"
        aria-label="Menu"
        onClick={(e) => {
          setOpen((v) => !v);
        }}
        className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-300 bg-white text-slate-700"
      >
        {open ? "✕" : "☰"}
      </button>

      {/* MOBILE MENU DROPDOWN */}
      {open && (
        <div
          ref={menuRef}
          className="absolute right-0 top-12 z-50 w-44 rounded-xl border border-slate-200 bg-white shadow-lg md:hidden"
        >
          <div className="flex flex-col p-2">
            <MobileNavItem
              pathname={pathname}
              href="/"
              onClick={() => setOpen(false)}
            >
              Početna
            </MobileNavItem>

            <MobileNavItem
              pathname={pathname}
              href="/create-ad"
              onClick={() => setOpen(false)}
            >
              Nekretnine
            </MobileNavItem>

            <MobileNavItem
              pathname={pathname}
              href="/ads"
              onClick={() => setOpen(false)}
            >
              Ostali oglasi
            </MobileNavItem>

            <MobileNavItem
              pathname={pathname}
              href="/legal"
              onClick={() => setOpen(false)}
            >
              Pravila & privatnost
            </MobileNavItem>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavItem({
  pathname,
  href,
  children,
  className = "",
}: {
  pathname: string;
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={
        className +
        " text-xs md:text-sm rounded-full px-3 py-1.5 transition-colors " +
        (active
          ? "text-blue-700 border border-blue-500 bg-blue-50"
          : "text-slate-600 hover:text-slate-900")
      }
    >
      {children}
    </Link>
  );
}

function MobileNavItem({
  pathname,
  href,
  children,
  onClick,
}: {
  pathname: string;
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={
        "text-sm rounded-lg px-3 py-2 transition-colors " +
        (active
          ? "text-blue-700 bg-blue-50 border border-blue-200"
          : "text-slate-600 hover:bg-slate-100")
      }
    >
      {children}
    </Link>
  );
}
