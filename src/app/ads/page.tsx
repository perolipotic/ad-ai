"use client";

import { useState, useCallback, FormEvent } from "react";
import { getOrCreateDeviceMeta } from "../lib/device";

type GeneratedAd = {
  title: string;
  description: string;
};

type OtherAdState = {
  loading: boolean;
  error: string | null;
  generated: GeneratedAd | null;
  toastMessage: string | null;
};

export default function OtherAdsPage() {
  const [category, setCategory] = useState<string>("vozilo");
  const [tone, setTone] = useState<string>("neutral");
  const [notes, setNotes] = useState<string>("");
  const [state, setState] = useState<OtherAdState>({
    loading: false,
    error: null,
    generated: null,
    toastMessage: null,
  });

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        generated: null,
      }));

      const deviceMeta = getOrCreateDeviceMeta();

      const payload = {
        category, // npr. "vozilo", "posao", "usluga", "oprema", "ostalo"
        tone, // "neutral", "professional", "informal"
        notes, // slobodan tekst korisnika
      };

      try {
        const res = await fetch("/api/generate-other-ad", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-device-id": deviceMeta.id,
            "x-device-reset-count": String(deviceMeta.resetCount),
            "x-device-platform": deviceMeta.platform,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          if (
            data?.error === "limit_reached" ||
            data?.error === "device_limit_reached"
          ) {
            setState((prev) => ({
              ...prev,
              error: data.message || "Dosegnut je limit korištenja.",
              toastMessage:
                data.message || "Iskoristio si limit za ovaj mjesec.",
              loading: false,
            }));
            return;
          }

          if (data?.error === "unauthorized") {
            setState((prev) => ({
              ...prev,
              error: "Prijavi se za korištenje proširenih limita.",
              loading: false,
            }));
            return;
          }

          throw new Error(data?.message || "Nešto je pošlo po zlu.");
        }

        setState((prev) => ({
          ...prev,
          loading: false,
          generated: {
            title: data.title ?? "Oglas",
            description: data.description ?? "",
          },
          error: null,
        }));
      } catch (err: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err.message || "Greška pri generiranju oglasa.",
        }));
      }
    },
    [category, tone, notes]
  );

  const handleCopy = useCallback(() => {
    if (!state.generated) return;

    const text = `${state.generated.title}\n\n${state.generated.description}`;

    navigator.clipboard
      .writeText(text)
      .then(() =>
        setState((prev) => ({
          ...prev,
          toastMessage: "Tekst oglasa je kopiran u međuspremnik.",
        }))
      )
      .catch(() =>
        setState((prev) => ({
          ...prev,
          toastMessage: "Nešto je pošlo po zlu pri kopiranju teksta.",
        }))
      );
  }, [state.generated]);

  const handleToastClose = useCallback(() => {
    setState((prev) => ({ ...prev, toastMessage: null }));
  }, []);

  return (
    <>
      <div className="space-y-8">
        {/* HEADER / HERO ZA OSTALe OGLASE */}
        <section className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
            <span className="text-[12px]">✏️</span>
            <span className="text-[11px] font-medium text-slate-700">
              Brzi AI oglasi za sve ostalo – auto, posao, usluge, oprema...
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
            Jednostavan AI generator za oglase izvan nekretnina.
          </h1>

          <p className="text-sm md:text-base text-slate-600 max-w-2xl">
            Ako ti ne treba detaljan kreator s tlocrtom i slikama kao za
            nekretnine, ovdje jednostavno odabereš kategoriju, napišeš par
            rečenica što prodaješ ili nudiš – i dobiješ gotov oglas spreman za
            objavu.
          </p>
        </section>

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs md:text-sm text-amber-800 flex items-start gap-2">
          <span className="text-lg">⚠️</span>
          <p>
            Ovo je <strong>beta verzija</strong>. Tekst oglasa uvijek{" "}
            <strong>pročitaj i po potrebi prilagodi</strong> prije objave na
            oglasnicima ili slanja klijentima.{" "}
            <strong>Ne unosi osobne ili osjetljive podatke</strong> (ime,
            prezime, telefon, adresa, OIB, itd...). Generiraj samo opis!!.
          </p>
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr] items-start">
          {/* LEFT: FORMA */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-5">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Brzi kreator oglasa
              </h2>
              <p className="text-xs md:text-sm text-slate-500">
                Odaberi tip oglasa, stil pisanja i u par rečenica opiši što
                prodaješ ili tražiš. AI će to pretvoriti u naslov i strukturan
                opis.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* KATEGORIJA */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Tip oglasa
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="field-input"
                >
                  <option value="vozilo">Vozilo (auto, motor, kombi...)</option>
                  <option value="posao">Posao / oglas za radno mjesto</option>
                  <option value="usluga">
                    Usluga (npr. čišćenje, uređenje, tečaj)
                  </option>
                  <option value="oprema">Najam / prodaja opreme</option>
                  <option value="ostalo">Ostalo</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Ovo pomaže AI-ju da pogodi pravi format oglasa i što
                  istaknuti.
                </p>
              </div>

              {/* TON PISANJA */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Ton oglasa
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="field-input"
                >
                  <option value="neutral">Neutralan / standardni</option>
                  <option value="professional">
                    Profesionalan (posao, B2B)
                  </option>
                  <option value="informal">Neformalni / prijateljski</option>
                </select>
              </div>

              {/* BILJEŠKE / PROMPT */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Opiši ukratko što prodaješ ili nudiš
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="field-input min-h-[140px]"
                  placeholder="Npr. auto: marka, model, godište, kilometraža, stanje, vlasnik, oprema...
Posao: naziv pozicije, lokacija, odgovornosti, uvjeti, plaća...
Usluga: što radiš, kome je namijenjeno, na kojem području, iskustvo..."
                  required
                />
                <p className="text-[11px] text-slate-500">
                  Piši kao da pričaš kupcu – AI će od toga složiti jasan oglas.
                </p>
              </div>

              {/* FOOTER */}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    disabled={state.loading || !notes.trim()}
                    className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {state.loading ? "Generiram oglas..." : "Generiraj oglas"}
                  </button>

                  {state.error && (
                    <p className="text-xs text-red-500 max-w-xs">
                      {state.error}
                    </p>
                  )}
                </div>
              </div>
            </form>
          </section>

          {/* RIGHT: PREVIEW */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4 lg:sticky lg:top-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
                  Tvoj AI oglas
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Rezultat koji dobiješ možeš direktno kopirati u oglasnik ili
                  ga dodatno doraditi.
                </p>
              </div>

              {state.generated && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="hidden sm:inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Kopiraj tekst
                </button>
              )}
            </div>

            {/* LOADING STATE */}
            {state.loading && (
              <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                <p className="mb-1 font-medium text-slate-800">
                  Generiram oglas...
                </p>
                <p className="text-slate-500">
                  AI pretvara tvoje bilješke u jasan naslov i strukturiran opis
                  prilagođen tipu oglasa koji si odabrao.
                </p>
              </div>
            )}

            {/* RESULT */}
            {state.generated && !state.loading && (
              <div className="mt-1 space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Naslov oglasa
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={state.generated.title}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-600">
                    Opis oglasa
                  </label>
                  <textarea
                    readOnly
                    value={state.generated.description}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm md:text-base leading-relaxed text-slate-800 min-h-[180px]"
                  />
                </div>

                <div className="flex justify-end sm:hidden">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Kopiraj
                  </button>
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {!state.generated && !state.loading && (
              <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                <p className="font-medium text-slate-700 mb-1">
                  Još nema generiranog oglasa
                </p>
                <p>
                  Odaberi tip oglasa, napiši par rečenica o onome što prodaješ
                  ili nudiš i klikni{" "}
                  <span className="font-semibold text-slate-900">
                    &ldquo;Generiraj oglas&rdquo;
                  </span>
                  . Ovdje će se pojaviti naslov i opis.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>

      <Toast message={state.toastMessage} onClose={handleToastClose} />
    </>
  );
}

function Toast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto rounded-full bg-slate-900 text-white text-xs md:text-sm px-4 py-2 shadow-lg shadow-slate-900/30 flex items-center gap-3">
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] uppercase tracking-wide text-slate-300 hover:text-white"
        >
          Zatvori
        </button>
      </div>
    </div>
  );
}
