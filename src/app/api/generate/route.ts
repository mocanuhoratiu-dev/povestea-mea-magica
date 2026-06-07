import { NextResponse } from "next/server";
import https from "node:https";

type GenerateRequest = {
  type?: "monster" | "story" | "emergency";
  name?: string;
  age?: string;
  theme?: string;
  lesson?: string;
  monster?: string;
  context?: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message?: string;
    status?: string;
  };
};

type GeminiTextResult = { text: string; error?: never } | { text?: never; error: string };

async function generateGeminiText({
  apiKey,
  prompt,
  responseMimeType,
}: {
  apiKey: string;
  prompt: string;
  responseMimeType?: "application/json";
}): Promise<GeminiTextResult> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    ...(responseMimeType ? { generationConfig: { responseMimeType } } : {}),
  });

  const { statusCode, responseBody, requestError } = await new Promise<{
    statusCode: number;
    responseBody: string;
    requestError?: string;
  }>(
    (resolve) => {
      const request = https.request(
        {
          hostname: "generativelanguage.googleapis.com",
          path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
          },
        },
        (response) => {
          const chunks: Buffer[] = [];
          response.on("data", (chunk: Buffer) => chunks.push(chunk));
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 500,
              responseBody: Buffer.concat(chunks).toString("utf8"),
            });
          });
        }
      );

      request.on("error", (error) => {
        resolve({ statusCode: 500, responseBody: "", requestError: error.message });
      });
      request.write(body);
      request.end();
    }
  );

  if (requestError) {
    return { error: requestError };
  }

  let payload: GeminiResponse;
  try {
    payload = JSON.parse(responseBody || "{}") as GeminiResponse;
  } catch {
    return { error: "Gemini API nu a returnat JSON valid." };
  }

  if (statusCode < 200 || statusCode >= 300) {
    return { error: payload.error?.message || "Gemini API a returnat o eroare." };
  }

  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) {
    return { error: "Gemini nu a returnat conținut pentru această cerere." };
  }

  return { text };
}

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as GenerateRequest;
    console.log("🚀 Cerere generare primită:", data.type, data.name);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "GEMINI_API_KEY lipsește din .env.local." },
        { status: 500 }
      );
    }

    if (data.type === "monster") {
      const prompt = `Ești reprezentantul Ministerului Protecției Magice. 
      Sarcina ta: Inventează o rețetă magică amuzantă și un descântec pentru a alunga monstrul/frica de: "${data.monster}" din camera eroului/eroinei: "${data.name}".
      REGULĂ CRITICĂ: Părintele va prepara fizic această rețetă într-o STICLĂ CU PULVERIZATOR (spray). Prin urmare, ingredientele trebuie să fie DOAR LICHIDE SAU PULBERI INOFENSIVE care se găsesc în bucătărie și pot fi amestecate cu apă (ex: apă de la robinet, 2 picături de zeamă de lămâie, un praf de sare, un praf de scorțișoară, o picătură de colorant alimentar, puțin zahăr). NU folosi obiecte solide (cum ar fi perne, șosete, jucării).
      Tu le vei da o denumire magică în câmpul "detail".
      Returnează răspunsul în format JSON STRICT. Nu adăuga block-uri markdown de tip \`\`\`json.
      Format JSON necesar:
      {
        "body": "podeaua acestei camere este protejată de... (folosește tag-uri HTML <em> pt accent, text scurt)",
        "ingredients": [ 
          { "num": "1", "icon": "emoji", "name": "nume comun obiect (ex: Apa)", "detail": "denumire magică (ex: Lacrimi de dragon)" },
          { "num": "2", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" },
          { "num": "3", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" }
        ],
        "steps": [ 
          { "roman": "I", "l1": "pasul 1 linia 1 (1/2 propozitie)", "l2": "pasul 1 linia 2 (continuare)" }, 
          { "roman": "II", "l1": "pasul 2 linia 1", "l2": "pasul 2 linia 2" } 
        ],
        "spell": "Un descântec vesel și magic în RIME PERFECTE (format AABB), compus din exact 4 versuri scurte. TREBUIE să includă numele copilului și să alunge monstrul/frica respectivă."
      }`;

      const generated = await generateGeminiText({
        apiKey,
        prompt,
        responseMimeType: "application/json",
      });
      if ("error" in generated) {
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const jsonText = generated.text;
      const result = JSON.parse(jsonText);

      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
      
      const prompt = `Ești un autor premiat de cărți de povești pentru copii.
      Sarcina ta: Scrie o poveste amplă, detaliată și fermecătoare (aprox. 800 - 1000 de cuvinte) pentru copilul: ${data.name} care are ${data.age} ani.
      Tema poveștii (locația): ${themeLabel}.
      Povestea trebuie să aibă o morală discretă despre: ${data.lesson}.
      Tonul trebuie să fie cald, liniștitor, visător și potrivit pentru culcare. Fără scene de acțiune prea intense sau violență.
      Formatează textul folosind paragrafe despărțite prin linie nouă (fără titlu la început, doar textul poveștii). Nu folosi markdown excesiv (fără bold, italic sau titluri h1).`;

      const generated = await generateGeminiText({ apiKey, prompt });
      if ("error" in generated) {
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: { text: generated.text } });
    }

    if (data.type === "emergency") {
      const prompt = `Ești un educator creativ și asistent pentru părinți.
      Sarcina ta: Generează un "Kit de Urgență" pentru copilul ${data.name} (vârsta: ${data.age} ani) care se află în situația: "${data.context}".
      Trebuie să oferi 6 secțiuni adaptate STRICT la restricțiile locației și la vârsta copilului.
      Returnează răspunsul în format JSON STRICT. Nu adăuga block-uri markdown de tip \`\`\`json.
      Format JSON necesar:
      {
        "radar": [
          "1. ceva specific locației de găsit cu privirea (ex: o mașină roșie / un om cu ochelari)",
          "2. altceva de căutat vizual",
          "3. altceva de căutat vizual",
          "4. altceva de căutat vizual"
        ],
        "riddle": "O ghicitoare scurtă și amuzantă, în rime (2-4 versuri), legată de locația respectivă.",
        "drawing": "O provocare creativă și amuzantă de desen legată de situație.",
        "patience": "Un mini-joc de răbdare/respirație potrivit pentru acel loc.",
        "story_starters": [
          "Odată, un dragon a intrat în... (continuă tu!)",
          "Alt început de poveste amuzant #2...",
          "Alt început de poveste amuzant #3..."
        ],
        "true_or_false": [
          { "q": "O întrebare amuzantă adevărat/fals despre lume, natură sau animale, potrivită pentru vârsta copilului.", "a": "Adevărat sau Fals + explicație scurtă" },
          { "q": "O altă întrebare amuzantă.", "a": "Adevărat sau Fals + explicație scurtă" },
          { "q": "O altă întrebare amuzantă.", "a": "Adevărat sau Fals + explicație scurtă" }
        ]
      }`;

      const generated = await generateGeminiText({
        apiKey,
        prompt,
        responseMimeType: "application/json",
      });
      if ("error" in generated) {
        return NextResponse.json({ success: false, error: generated.error }, { status: 500 });
      }
      const jsonText = generated.text;
      const result = JSON.parse(jsonText);

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Tip necunoscut" }, { status: 400 });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    const message = error instanceof Error ? error.message : "Magia a întârziat puțin. Încearcă din nou!";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
