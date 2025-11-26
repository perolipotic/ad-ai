export default function LegalPage() {
  return (
    <main className="max-w-3xl space-y-6">
      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
        Pravila &amp; korištenje podataka
      </h1>

      <p className="text-sm md:text-base text-slate-600">
        Ovo je MVP projekt za generiranje oglasa za nekretnine. Cilj je ubrzati
        pisanje oglasa, a ne trajno prikupljati ili analizirati tvoje podatke.
      </p>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Što se događa s podacima koje unosiš?
        </h2>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
          <li>
            Podaci iz forme (grad, kvadratura, broj soba, opis, napomene) šalju
            se modelu umjetne inteligencije (OpenAI) kako bi se generirao naslov
            i opis oglasa.
          </li>
          <li>
            Slike koje učitaš (uključujući tlocrt) također se šalju modelu kako
            bi AI mogao bolje opisati raspored i izgled nekretnine.
          </li>
          <li>
            U ovoj MVP fazi aplikacija ne radi javnu objavu oglasa – tekst
            ostaje isključivo kod tebe (copy/paste u tvoj oglasnik).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          OpenAI i obrada sadržaja
        </h2>
        <p className="text-sm text-slate-600">
          Generiranje oglasa pokreće se putem OpenAI API-ja. OpenAI može
          privremeno obrađivati i pohranjivati sadržaj koji šalješ kako bi mogao
          vratiti odgovor (generirani tekst oglasa). Preporučujemo da ne unosiš
          osjetljive osobne podatke (npr. puno ime i prezime, OIB, točnu adresu
          vlasnika i sl.) u tekst napomena.
        </p>
        <p className="text-xs text-slate-500">
          Za detalje o načinu na koji OpenAI obrađuje podatke pogledaj njihova
          službena pravila privatnosti i uvjete korištenja.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Što planiramo kasnije?
        </h2>
        <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1.5">
          <li>Spremanje tvojih oglasa uz korisnički račun (opcionalno).</li>
          <li>Više jezika (npr. engleski, njemački) za strane kupce.</li>
          <li>
            Transparentnije postavke privatnosti i mogućnost brisanja svih
            spremljenih podataka.
          </li>
        </ul>
      </section>

      <p className="text-xs text-slate-500">
        Ako imaš bilo kakva pitanja ili želiš predložiti izmjene ovih pravila,
        javi se vlasniku projekta putem kontakta navedenog na početnoj stranici
        (ili dodaj kontakt sekciju ovdje kad bude spremna).
      </p>
    </main>
  );
}
