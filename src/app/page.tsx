import Link from "next/link";

export default function HomePage() {
  return (
    <main className="space-y-10">
      {/* HERO */}
      <section className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr] items-center">
        <div className="space-y-5">
          {/* MAIN BADGE */}
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 border border-blue-100">
            <span className="text-[11px] font-medium text-blue-700">
              AI oglasi • raniji pristup
            </span>
          </div>

          {/* MINI BADGE S IKONICOM */}
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 border border-slate-200">
            <span className="text-[12px]">🏷️</span>
            <span className="text-[11px] font-medium text-slate-700">
              Sve vrste oglasa na jednom mjestu • nekretnine lansiramo prve
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">
            Napiši oglas za stan ili kuću{" "}
            <span className="text-blue-600">kao profesionalac</span>, bez prazne
            stranice.
          </h1>

          <p className="text-sm md:text-base text-slate-600 max-w-xl">
            Platforma za generiranje oglasa koja kreće s nekretninama – stanovi
            i kuće – a kasnije se širi i na druge vrste oglasa. Unesi podatke,
            dodaj slike (i tlocrt ako ga imaš), a AI će složiti naslov i opis
            spreman za objavu.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
            <Link
              href="/create-ad"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
            >
              🚀 Kreiraj oglas za nekretninu
            </Link>
            <p className="text-xs text-slate-500">
              Bez registracije, bez kartice. Danas: nekretnine. Uskoro: i drugi
              tipovi oglasa.
            </p>
          </div>
        </div>

        {/* DESNI MOCK */}
        <div className="hidden lg:block">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500">
                  Live preview oglasa
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Demo prikaz sučelja
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="h-32 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-[11px] text-slate-500 border border-slate-200">
                Trenutno: fotografije stana / kuće
              </div>
              <div className="space-y-2">
                <div className="h-3 w-52 rounded-full bg-slate-200" />
                <div className="space-y-1">
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-5/6 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-3/4 rounded-full bg-slate-200" />
                </div>
                <div className="space-y-1 pt-1">
                  <div className="h-2 w-1/3 rounded-full bg-slate-200" />
                  <div className="h-2.5 w-full rounded-full bg-slate-200" />
                  <div className="h-2.5 w-4/5 rounded-full bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KORACI */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Kako radi
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard
            number="1"
            title="Unesi osnovne podatke"
            text="Vrsta nekretnine, kvadratura, broj soba, kat, stanje, grad i kvart. Dodaš i napomene ako želiš."
          />
          <StepCard
            number="2"
            title="Dodaj slike i tlocrt"
            text="Uploadaš fotografije, a tlocrt možeš označiti jednim klikom. AI ga koristi za puno bolji opis rasporeda."
          />
          <StepCard
            number="3"
            title="Kopiraj gotov oglas"
            text="Naslov i opis u stilu koji odabereš – obiteljski, investitorski, luksuzni ili kratki. Samo copy/paste."
          />
        </div>
      </section>

      {/* FEATURESI */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Zašto uopće koristiti ovo?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            title="Štedi vrijeme"
            text="Umjesto da kreneš od prazne stranice, imaš draft za par sekundi – koji po potrebi malo prilagodiš."
          />
          <FeatureCard
            title="Opis koji ima smisla"
            text="Kombinira podatke iz forme i detalje sa slika – pogotovo tlocrta – da naglasi raspored i stvarne prednosti."
          />
          <FeatureCard
            title="Fleksibilan stil"
            text="Različiti presetovi za različitu publiku: kupce koji traže dom, investitore ili premium nekretnine."
          />
        </div>
      </section>

      {/* NEXT FEATURES */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Što dolazi sljedeće?
        </h2>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl">
          Nekretnine su tek prvi use-case. U sljedećim fazama cilj je omogućiti
          isti AI proces za druge vrste oglasa — vozila, najam opreme, usluge i
          druge kategorije — uz moderne opcije uređivanja i spremanja više
          verzija oglasa.
        </p>
      </section>

      {/* CTA */}
      <section className="mt-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            Spreman isprobati prvi modul?
          </p>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-md">
            Trenutno podržavamo oglase za nekretnine. Ovo je temelj za širenje
            na sve vrste oglasa – a tvoja povratna informacija oblikuje
            platformu.
          </p>
        </div>
        <Link
          href="/create-ad"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Kreni s oglasom za nekretninu
        </Link>
      </section>
    </main>
  );
}

function StepCard({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
      <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {number}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs md:text-sm text-slate-600">{text}</p>
    </div>
  );
}

function FeatureCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-xs md:text-sm text-slate-600">{text}</p>
    </div>
  );
}
