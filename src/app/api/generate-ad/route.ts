import { NextResponse } from "next/server";
import { openai } from "../../lib/openai";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      propertyType,
      city,
      neighborhood,
      areaM2,
      rooms,
      floor,
      totalFloors,
      condition,
      price,
      extraNotes,
      stylePreset,
      imageCount,
      images, // array data URL-ova sa frontenda
      userEditedTitle,
      userEditedDescription,
    } = body as {
      propertyType: string;
      city: string;
      neighborhood?: string;
      areaM2: string | number;
      rooms: string | number;
      floor?: string;
      totalFloors?: string;
      condition?: string;
      price?: string | number;
      extraNotes?: string;
      stylePreset?: string;
      imageCount?: number;
      images: { dataUrl: string; isFloorplan?: boolean }[];
      userEditedTitle?: string | null;
      userEditedDescription?: string | null;
    };

    let styleInstruction = "Piši neutralno, jasno i profesionalno.";

    switch (stylePreset) {
      case "family":
        styleInstruction =
          "Naglasak stavi na udobnost, sigurnost, blizinu škola, vrtića i obiteljsku atmosferu. Ton neka bude topao i pristupačan.";
        break;
      case "investor":
        styleInstruction =
          "Naglasak stavi na isplativost, lokaciju, potencijal najma, povrat na ulaganje i brojke. Ton neka bude informativan i racionalan.";
        break;
      case "luxury":
        styleInstruction =
          "Naglasak stavi na luksuz, kvalitetu materijala, dizajn, prestižnu lokaciju i detalje. Ton neka bude elegantan i sofisticiran, ali ne pretjerano napuhan.";
        break;
      case "short":
        styleInstruction =
          "Piši kratko i sažeto, maksimalno 2–3 kraća odlomka, bez nepotrebnog razvlačenja.";
        break;
      default:
        styleInstruction = "Piši neutralno, jasno i profesionalno.";
    }

    const textPrompt = `
Kreiraj oglas za prodaju nekretnine na hrvatskom jeziku.

Podaci (iz forme):
- Vrsta nekretnine: ${propertyType}
- Grad: ${city}
- Kvart / lokacija: ${neighborhood || "—"}
- Površina: ${areaM2} m²
- Broj soba: ${rooms}
- Kat: ${floor || "—"}${totalFloors ? ` od ${totalFloors}` : ""}
- Stanje: ${condition || "nije navedeno"}
- Cijena: ${price ? price + " €" : "nije navedena"}
- Broj slika nekretnine: ${imageCount || 0}
- Dodatne napomene: ${extraNotes || "nema"}

Slike koje dobiješ dijele se na dvije skupine:
- slike označene kao TLOCRT: to su crteži rasporeda prostorija (njih koristiš prvenstveno za razumijevanje rasporeda)
- ostale slike: obične fotografije prostorija, eksterijera, pogleda, dvorišta i slično.

Ako imaš barem jednu sliku tlocrta:
- detaljno opiši raspored prostorija (npr. ulazni hodnik, lijevo kuhinja, desno dnevni boravak, odvojene spavaće sobe, dvije kupaonice, izlaz na balkon iz dnevnog boravka itd.)
- naglasi prednosti takvog rasporeda (logičan tlocrt, odvojen spavaći i dnevni dio, malo hodnika, funkcionalan prostor...)

Ako nemaš tlocrt:
- oslanjaj se na podatke iz forme i vizualni dojam sa običnih fotografija.

Stil pisanja (preset): ${stylePreset || "standard"}
${styleInstruction}

VAŽNO:
- Kombiniraj informacije iz teksta i iz slika.
- Ako na slikama vidiš nešto bitno (npr. moderan namještaj, more, pogled na park, balkon, dvorište, garažu, bazen...), spomeni to u opisu.
- Nemoj izmišljati stvari koje se ne vide na slikama ili nisu navedene.

1) Prvo generiraj KRATAK NASLOV (max 70 znakova).

2) Zatim generiraj OPIS u nekoliko odlomaka:
   - prvi odlomak: sažetak (što, gdje, kome je namijenjeno)
   - drugi dio: raspored prostorija (prema formi + onome što vidiš na slikama)
   - treći dio: prednosti (lokacija, uređenje, pogled, parking, mirno okruženje...)
   - završetak: neutralan poziv na kontakt.

Vrati JSON u formatu:
{
  "title": "...",
  "description": "..."
}
`.trim();

    // Pripremi image partove za multi-modal input
    const floorplanImages = images?.filter((i) => i.isFloorplan);
    const normalImages = images?.filter((i) => !i.isFloorplan);

    const imageParts = [
      // prvo tlocrt(i), pa normalne fotke
      ...floorplanImages?.map((img) => ({
        type: "input_image" as const,
        image_url: img.dataUrl,
        detail: "auto" as const,
      })),
      ...normalImages.map((img) => ({
        type: "input_image" as const,
        image_url: img.dataUrl,
        detail: "auto" as const,
      })),
    ];

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: textPrompt,
            },
            ...imageParts,
          ],
        },
      ],
    });

    // prilagodi ovisno o SDK-u
    // @ts-ignore

    const rawText = (response as any).output_text as string | undefined;
    // fallback ako zbog neke verzije output_text ne postoji
    const textToParse =
      rawText ??
      // @ts-ignore – fallback na prvi content
      response.output?.[0]?.content?.[0]?.text ??
      "";

    let parsed: { title?: string; description?: string } = {};

    try {
      parsed = JSON.parse(textToParse);
    } catch {
      // ako model slučajno vrati nešto s viškom teksta, probaj grublji fallback
      const match = textToParse.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch {
          // zadnji fallback – ništa
        }
      }
    }

    return NextResponse.json(
      {
        title: parsed.title ?? "Oglas za nekretninu",
        description: parsed.description ?? textToParse, // bar nešto prikaži
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Greška pri generiranju oglasa" },
      { status: 500 }
    );
  }
}
