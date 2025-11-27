import { openai } from "./openai";
export type GenerateAdInput = {
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
};

export function buildTextPrompt(input: GenerateAdInput): string {
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
  } = input;

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
  }

  return `
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

Stil pisanja (preset): ${stylePreset || "standard"}
${styleInstruction}

VAŽNO:
- Kombiniraj informacije iz teksta i iz slika.
- Nemoj izmišljati stvari koje se ne vide na slikama ili nisu navedene.

Vrati JSON u formatu:
{
  "title": "...",
  "description": "..."
}
`.trim();
}

export async function callOpenAIForAd(input: GenerateAdInput) {
  const textPrompt = buildTextPrompt(input);

  const floorplanImages = input.images?.filter((i) => i.isFloorplan);
  const normalImages = input.images?.filter((i) => !i.isFloorplan);

  const imageParts = [
    ...(floorplanImages ?? []).map((img) => ({
      type: "input_image" as const,
      image_url: img.dataUrl,
      detail: "auto" as const,
    })),
    ...(normalImages ?? []).map((img) => ({
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
        content: [{ type: "input_text", text: textPrompt }, ...imageParts],
      },
    ],
  });

  // parsiranje kao prije
  // @ts-ignore
  const rawText = (response as any).output_text as string | undefined;
  const textToParse =
    rawText ??
    // @ts-ignore
    response.output?.[0]?.content?.[0]?.text ??
    "";

  let parsed: { title?: string; description?: string } = {};

  try {
    parsed = JSON.parse(textToParse);
  } catch {
    const match = textToParse.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {
        // ignore
      }
    }
  }

  return {
    title: parsed.title ?? "Oglas za nekretninu",
    description: parsed.description ?? textToParse,
  };
}
