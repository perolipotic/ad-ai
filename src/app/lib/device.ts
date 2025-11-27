// lib/device.ts
"use client";
export type DeviceMeta = {
  id: string;
  createdAt: string; // ISO string
  lastSeenAt: string; // ISO string
  platform: string;
  userAgent: string;
  language: string;
  screen?: {
    width: number;
    height: number;
  };
  resetCount: number; // koliko puta smo morali rekreirati meta (npr. nakon brisanja LS-a)
};

const LS_KEY = "kj_device_meta";
const COOKIE_KEY = "kj_device_id";

// mali helperi za cookie
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

function safeParseMeta(raw: string | null): DeviceMeta | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DeviceMeta;
    if (!parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

// glavna funkcija – vrati meta (u meta.id imaš deviceId)
export function getOrCreateDeviceMeta(): DeviceMeta {
  if (typeof window === "undefined") {
    // SSR fallback
    return {
      id: "server",
      createdAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      platform: "server",
      userAgent: "server",
      language: "server",
      resetCount: 0,
    };
  }

  const now = new Date().toISOString();
  const rawMeta = window.localStorage.getItem(LS_KEY);
  const cookieId = getCookie(COOKIE_KEY);

  let meta = safeParseMeta(rawMeta);

  // 1) Imamo meta u localStorage → update lastSeen + sync cookie
  if (meta) {
    meta.lastSeenAt = now;

    // ako iz nekog razloga cookie nema id, postavi ga
    if (!cookieId) {
      setCookie(COOKIE_KEY, meta.id);
    }

    window.localStorage.setItem(LS_KEY, JSON.stringify(meta));
    return meta;
  }

  // 2) Nemamo meta, ali imamo cookieId → netko je vjerojatno obrisao localStorage
  if (!meta && cookieId) {
    const newMeta: DeviceMeta = {
      id: cookieId,
      createdAt: now, // prvi put kad smo rekreirali – možeš ovo drugačije interpretirati
      lastSeenAt: now,
      platform: window.navigator.platform ?? "unknown",
      userAgent: window.navigator.userAgent ?? "unknown",
      language: window.navigator.language ?? "unknown",
      screen:
        typeof window !== "undefined"
          ? {
              width: window.screen.width,
              height: window.screen.height,
            }
          : undefined,
      resetCount: 1, // znači: barem jednom je LS bio “prazan” dok cookie postoji
    };

    window.localStorage.setItem(LS_KEY, JSON.stringify(newMeta));
    // cookie već postoji, ali možemo ga opet postaviti radi roka trajanja
    setCookie(COOKIE_KEY, cookieId);

    return newMeta;
  }

  // 3) Nema ni meta ni cookie → potpuno novi device
  const newId = crypto.randomUUID();

  const freshMeta: DeviceMeta = {
    id: newId,
    createdAt: now,
    lastSeenAt: now,
    platform: window.navigator.platform ?? "unknown",
    userAgent: window.navigator.userAgent ?? "unknown",
    language: window.navigator.language ?? "unknown",
    screen:
      typeof window !== "undefined"
        ? {
            width: window.screen.width,
            height: window.screen.height,
          }
        : undefined,
    resetCount: 0,
  };

  window.localStorage.setItem(LS_KEY, JSON.stringify(freshMeta));
  setCookie(COOKIE_KEY, newId);

  return freshMeta;
}
