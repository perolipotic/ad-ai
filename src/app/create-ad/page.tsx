"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";

type GeneratedAd = {
  title: string;
  description: string;
};

type ImagePreview = {
  file: File;
  url: string;
  base64: string;
  isFloorplan: boolean;
};

type CreateAdState = {
  loading: boolean;
  generated: GeneratedAd | null;
  error: string | null;
  images: ImagePreview[];
  toastMessage: string | null;
  editedTitle: string;
  editedDescription: string;
};

type CreateAdHandlers = {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onImagesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleFloorplan: (index: number) => void;
  onCopy: () => void;
  onDismissToast: () => void;
  onEditedTitleChange: (value: string) => void;
  onEditedDescriptionChange: (value: string) => void;
};

/**
 * HOOK = sva logika i state na jednom mjestu (container)
 */
function useCreateAdLogic(): {
  state: CreateAdState;
  handlers: CreateAdHandlers;
} {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedAd | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [editedTitle, setEditedTitle] = useState("");
  const [editedDescription, setEditedDescription] = useState("");

  // kad dobijemo novi generated → inicijalno popuni editable polja
  useEffect(() => {
    if (generated) {
      setEditedTitle(generated.title);
      setEditedDescription(generated.description);
    } else {
      setEditedTitle("");
      setEditedDescription("");
    }
  }, [generated]);

  // auto-hide toast nakon par sekundi
  useEffect(() => {
    if (!toastMessage) return;
    const id = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(id);
  }, [toastMessage]);

  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setLoading(true);
      setGenerated(null);
      setError(null);

      const formData = new FormData(e.currentTarget);

      const payload = {
        propertyType: formData.get("propertyType") || "",
        city: formData.get("city") || "",
        neighborhood: formData.get("neighborhood") || "",
        areaM2: formData.get("areaM2") || "",
        rooms: formData.get("rooms") || "",
        floor: formData.get("floor") || "",
        totalFloors: formData.get("totalFloors") || "",
        condition: formData.get("condition") || "",
        price: formData.get("price") || "",
        extraNotes: formData.get("extraNotes") || "",
        stylePreset: formData.get("stylePreset") || "standard",
        imageCount: images.length,
        images: images.slice(0, 8).map((img) => ({
          dataUrl: img.base64,
          isFloorplan: img.isFloorplan,
        })),
        // 👇 user edits – backend ih može iskoristiti u promptu
        userEditedTitle: editedTitle || null,
        userEditedDescription: editedDescription || null,
      };

      try {
        const res = await fetch("/api/generate-ad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error("Nešto je pošlo po zlu");
        }

        const data = await res.json();
        setGenerated(data);
      } catch (err: any) {
        setError(err.message || "Greška pri generiranju oglasa");
      } finally {
        setLoading(false);
      }
    },
    [images, editedTitle, editedDescription]
  );

  const onImagesChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []).slice(0, 8);

      const previews: ImagePreview[] = await Promise.all(
        files.map(async (file) => {
          const base64 = await fileToBase64(file);
          return {
            file,
            url: URL.createObjectURL(file),
            base64,
            isFloorplan: false,
          };
        })
      );

      setImages(previews);
    },
    [fileToBase64]
  );

  const onToggleFloorplan = useCallback((index: number) => {
    setImages((prev) =>
      prev.map((img, i) =>
        i === index ? { ...img, isFloorplan: !img.isFloorplan } : img
      )
    );
  }, []);

  const onCopy = useCallback(() => {
    if (!generated && !editedTitle && !editedDescription) return;

    const titleToCopy = editedTitle || generated?.title || "";
    const descToCopy = editedDescription || generated?.description || "";
    const text = `${titleToCopy}\n\n${descToCopy}`;

    navigator.clipboard
      .writeText(text)
      .then(() => setToastMessage("Tekst oglasa je kopiran u međuspremnik."))
      .catch(() =>
        setToastMessage("Nešto je pošlo po zlu pri kopiranju teksta.")
      );
  }, [generated, editedTitle, editedDescription]);

  const onDismissToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const onEditedTitleChange = useCallback((value: string) => {
    setEditedTitle(value);
  }, []);

  const onEditedDescriptionChange = useCallback((value: string) => {
    setEditedDescription(value);
  }, []);

  return {
    state: {
      loading,
      generated,
      error,
      images,
      toastMessage,
      editedTitle,
      editedDescription,
    },
    handlers: {
      onSubmit,
      onImagesChange,
      onToggleFloorplan,
      onCopy,
      onDismissToast,
      onEditedTitleChange,
      onEditedDescriptionChange,
    },
  };
}

/**
 * PAGE = koristi hook (container) + rendra čisti view (presentation)
 */
export default function CreateAdPage() {
  const { state, handlers } = useCreateAdLogic();

  return (
    <>
      <CreateAdLayout state={state} handlers={handlers} />
      <Toast message={state.toastMessage} onClose={handlers.onDismissToast} />
    </>
  );
}

/**
 * PRESENTATION: layout stranice (step forma + preview + beta traka + 3. korak)
 */
function CreateAdLayout({
  state,
  handlers,
}: {
  state: CreateAdState;
  handlers: CreateAdHandlers;
}) {
  const { loading, generated, error, images } = state;
  const { onSubmit, onImagesChange, onToggleFloorplan, onCopy } = handlers;

  // 1 = Osnovno, 2 = Stil & slike, 3 = Oglas
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // kad dobijemo rezultat → automatski na Korak 3
  useEffect(() => {
    if (generated) {
      setCurrentStep(3);
    }
  }, [generated]);

  return (
    <div className="space-y-4">
      {/* BETA traka */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs md:text-sm text-amber-800 flex items-start gap-2">
        <span className="mt-0.5 text-lg">⚠️</span>
        <p>
          Ovo je <strong>beta verzija</strong>. Tekst oglasa uvijek{" "}
          <strong>pročitaj i po potrebi prilagodi</strong> prije objave na
          oglasnicima ili slanja klijentima.
        </p>
      </div>

      {/* STEP NAV / BREADCRUMBS */}
      <StepNav currentStep={currentStep} onStepChange={setCurrentStep} />

      <div className="grid gap-6 lg:grid-cols-[1.15fr,0.95fr] items-start">
        {/* Forma samo u koracima 1 i 2 */}
        {currentStep !== 3 && (
          <AdFormCard
            loading={loading}
            error={error}
            images={images}
            onSubmit={onSubmit}
            onImagesChange={onImagesChange}
            onToggleFloorplan={onToggleFloorplan}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        )}

        {/* Pregled/oglas desno; stvarni "Korak 3" */}
        {currentStep === 3 && <GeneratedAdCard state={state} onCopy={onCopy} />}
      </div>
    </div>
  );
}

/**
 * STEP NAV KOMPONENTA – breadcrumbs za 3 koraka
 */
function StepNav({
  currentStep,
  onStepChange,
}: {
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
}) {
  const steps: { id: 1 | 2 | 3; label: string; subtitle?: string }[] = [
    {
      id: 1,
      label: "Osnovne informacije",
      /* subtitle: "tip, lokacija, kvadratura", */
    },
    { id: 2, label: "Stil & slike" /*  subtitle: "preset + fotografije" */ },
    { id: 3, label: "Oglas" /* subtitle: "generirani tekst"  */ },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-3">
      <p className="text-[11px] md:text-xs font-medium uppercase tracking-wide text-slate-500">
        Koraci
      </p>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {steps.map((step) => {
            const active = currentStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => onStepChange(step.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-left ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]">
                  {step.id}
                </span>
                <span className="flex flex-col">
                  <span className="text-[11px] font-semibold">
                    {step.label}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {step.subtitle}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {currentStep !== 3 && (
          <p className="text-[11px] text-slate-500">
            Nakon generiranja oglasa automatski prelaziš na{" "}
            <span className="font-semibold">Korak 3 – Oglas</span>.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * FORM KARTICA – step forma + accordion za slike
 */
function AdFormCard({
  loading,
  error,
  images,
  onSubmit,
  onImagesChange,
  onToggleFloorplan,
  currentStep,
  onStepChange,
}: {
  loading: boolean;
  error: string | null;
  images: ImagePreview[];
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onImagesChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onToggleFloorplan: (index: number) => void;
  currentStep: 1 | 2 | 3;
  onStepChange: (step: 1 | 2 | 3) => void;
}) {
  const [imagesOpen, setImagesOpen] = useState(true);

  const goNext = () => onStepChange(2);
  const goPrev = () => onStepChange(1);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
          Podaci o nekretnini
        </h2>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Ispuni osnovne informacije, dodaj slike i odaberi stil oglasa. AI će
          složiti tekst umjesto tebe.
        </p>
      </div>

      <form onSubmit={onSubmit} className="p-5 space-y-6">
        {/* KORAK 1: OSNOVNE INFO */}
        {currentStep === 1 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Osnovne informacije
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Vrsta nekretnine" required>
                <select
                  name="propertyType"
                  className="field-input"
                  required
                  defaultValue="stan"
                >
                  <option value="stan">Stan</option>
                  <option value="kuca">Kuća</option>
                  <option value="apartman">Apartman</option>
                  <option value="zemljiste">Zemljište</option>
                  <option value="poslovni prostor">Poslovni prostor</option>
                </select>
              </FormField>

              <FormField label="Grad" required>
                <input
                  name="city"
                  type="text"
                  className="field-input"
                  placeholder="npr. Split"
                  required
                />
              </FormField>

              <FormField label="Kvart / lokacija">
                <input
                  name="neighborhood"
                  type="text"
                  className="field-input"
                  placeholder="npr. Meje, centar, Spinut..."
                />
              </FormField>

              <FormField label="Površina (m²)" required>
                <input
                  name="areaM2"
                  type="number"
                  min={1}
                  className="field-input"
                  placeholder="npr. 65"
                  required
                />
              </FormField>

              <FormField label="Broj soba" required>
                <input
                  name="rooms"
                  type="number"
                  min={1}
                  step={0.5}
                  className="field-input"
                  placeholder="npr. 2"
                  required
                />
              </FormField>

              <FormField label="Kat">
                <input
                  name="floor"
                  type="text"
                  className="field-input"
                  placeholder="npr. 2."
                />
              </FormField>

              <FormField label="Ukupno katova u zgradi">
                <input
                  name="totalFloors"
                  type="text"
                  className="field-input"
                  placeholder="npr. 4"
                />
              </FormField>

              <FormField label="Stanje">
                <select name="condition" className="field-input">
                  <option value="novogradnja">Novogradnja</option>
                  <option value="uređen stan">Uređen / renoviran</option>
                  <option value="za adaptaciju">Za adaptaciju</option>
                  <option value="održavano stanje">Održavano stanje</option>
                </select>
              </FormField>

              <FormField label="Cijena (€)">
                <input
                  name="price"
                  type="number"
                  min={0}
                  className="field-input"
                  placeholder="npr. 220000"
                />
              </FormField>
            </div>
          </div>
        )}

        {/* KORAK 2: STIL + SLIKE + NAPOMENE */}
        {currentStep === 2 && (
          <>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Stil oglasa
              </h3>
              <FormField label="Stil oglasa (preset)">
                <select
                  name="stylePreset"
                  className="field-input"
                  defaultValue="standard"
                >
                  <option value="standard">Standardni – profesionalan</option>
                  <option value="family">Za obitelj – topao ton</option>
                  <option value="investor">
                    Za investitore – brojke &amp; ROI
                  </option>
                  <option value="luxury">
                    Luksuz – naglasak na premium detalje
                  </option>
                  <option value="short">Kratak oglas – sažeto</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Odaberi ton pisanja koji odgovara ciljanoj publici za ovu
                  nekretninu.
                </p>
              </FormField>
            </div>

            {/* ACCORDION ZA SLIKE */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setImagesOpen((o) => !o)}
                className="w-full flex items-center justify-between rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-left"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Slike & tlocrt (max 8)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Dodaj fotografije, a tlocrt označi jednim klikom.
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {imagesOpen ? "Sakrij" : "Prikaži"}
                </span>
              </button>

              {imagesOpen && (
                <div className="mt-2 space-y-2">
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onImagesChange}
                      className="block w-full text-xs text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-slate-800"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Dodaj fotografije stana/kuće. Ako imaš tlocrt, označi ga
                      niže – AI će ga iskoristiti za opis rasporeda.
                    </p>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={img.url}
                            alt={`Slika nekretnine ${idx + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute bottom-0 inset-x-0 bg-black/45 px-2 py-1 flex items-center gap-1">
                            <input
                              id={`floorplan-${idx}`}
                              type="checkbox"
                              checked={img.isFloorplan}
                              onChange={() => onToggleFloorplan(idx)}
                              className="h-3 w-3 rounded border-slate-200"
                            />
                            <label
                              htmlFor={`floorplan-${idx}`}
                              className="text-[11px] leading-tight text-white cursor-pointer select-none"
                            >
                              Ovo je tlocrt
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* NAPOMENE */}
            <div className="space-y-3">
              <FormField label="Dodatne napomene (nije obavezno)">
                <textarea
                  name="extraNotes"
                  className="field-input min-h-[90px]"
                  placeholder="npr. rok useljenja, namještaj uključen, parking, pogled, blizina škole..."
                />
              </FormField>
            </div>
          </>
        )}

        {/* FOOTER FORM KARTICE – NAVIGACIJA PO KORACIMA + SUBMIT */}
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-xs md:text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ⬅️ Nazad
                </button>
              )}

              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={goNext}
                  className="inline-flex items-center justify-center rounded-full border border-slate-900 px-4 py-2 text-xs md:text-sm font-semibold text-slate-900 hover:bg-slate-900 hover:text-white"
                >
                  Nastavi na stil & slike ➜
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Generiram oglas..." : "Generiraj oglas"}
                </button>
              )}
            </div>

            {error && <p className="text-xs text-red-500 max-w-xs">{error}</p>}
          </div>
        </div>
      </form>
    </section>
  );
}

/**
 * PREVIEW KARTICA – Korak 3: Oglas (plus hintovi za 1/2)
 */
function GeneratedAdCard({
  state,
  onCopy,
}: {
  state: CreateAdState;
  onCopy: () => void;
}) {
  const { loading, generated, editedTitle, editedDescription } = state;

  return (
    <section className="lg:sticky lg:top-8 rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
            Tvoj oglas
          </h2>

          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Tekst možeš direktno zalijepiti u oglasnik ili ga dodatno
            prilagoditi po potrebi.
          </p>
        </div>

        {generated && (
          <button
            type="button"
            onClick={onCopy}
            className="hidden sm:inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Kopiraj tekst
          </button>
        )}
      </div>

      {/* STATE: loading */}
      {loading && (
        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          <p className="mb-1 font-medium text-slate-800">Generiram oglas...</p>
          <p className="text-slate-500">
            AI prolazi kroz podatke i slike koje si dodao – uključujući tlocrte
            ako su označeni – i slaže finalni tekst.
          </p>
        </div>
      )}

      {/* STATE: Korak 3 + rezultat */}
      {generated && !loading && (
        <div className="mt-1 space-y-4">
          {/* Naslov (read-only za sad) */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Naslov oglasa
            </label>
            <input
              type="text"
              readOnly
              value={editedTitle}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900"
            />
          </div>

          {/* Opis (read-only za sad) */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              Opis oglasa
            </label>
            <textarea
              readOnly
              value={editedDescription}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm md:text-base leading-relaxed text-slate-800 min-h-[180px]"
            />
          </div>

          {/* Copy gumb za mobile */}
          <div className="flex justify-end sm:hidden">
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex items-center rounded-full border border-slate-300 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Kopiraj
            </button>
          </div>
        </div>
      )}

      {/* Ako smo u Koraku 3, ali još nema generiranog oglasa */}
      {!generated && !loading && (
        <div className="mt-2 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700 mb-1">
            Još nema teksta oglasa
          </p>
          <p>
            Vrati se na Korak 1 i 2, ispuni podatke i klikni{" "}
            <span className="font-semibold text-slate-900">
              &ldquo;Generiraj oglas&rdquo;
            </span>
            . Zatim će se ovdje pojaviti naslov i opis.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * MALI HELPER KOMPONENTE
 */
function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * TOAST – globalno, jednostavno
 */
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
