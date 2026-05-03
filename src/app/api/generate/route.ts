import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("🚀 Cerere generare primită:", data.type, data.name);

    // Initializam Gemini client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    if (data.type === "monster") {
      const prompt = `Ești reprezentantul Ministerului Protecției Magice. 
      Sarcina ta: Inventează o rețetă magică amuzantă și un descântec pentru a alunga monstrul/frica de: "${data.monster}" din camera eroului/eroinei: "${data.name}".
      Returnează răspunsul în format JSON STRICT. Nu adăuga block-uri markdown de tip \`\`\`json.
      Format JSON necesar:
      {
        "body": "podeaua acestei camere este protejată de... (folosește tag-uri HTML <em> pt accent, text scurt)",
        "ingredients": [ 
          { "num": "1", "icon": "emoji", "name": "nume amuzant ingredient", "detail": "scurt detaliu magic" },
          { "num": "2", "icon": "emoji", "name": "nume amuzant ingredient", "detail": "scurt detaliu magic" },
          { "num": "3", "icon": "emoji", "name": "nume amuzant ingredient", "detail": "scurt detaliu magic" }
        ],
        "steps": [ 
          { "roman": "I", "l1": "pasul 1 linia 1 (1/2 propozitie)", "l2": "pasul 1 linia 2 (continuare)" }, 
          { "roman": "II", "l1": "pasul 2 linia 1", "l2": "pasul 2 linia 2" } 
        ],
        "spell": "o scurtă rimă magică amuzantă (2 rânduri, ex: Umbre mici plecați din zori / Fugiți iute printre nori)"
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });
      
      const jsonText = response.text || "{}";
      const result = JSON.parse(jsonText);

      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
      
      const prompt = `Ești un autor premiat de cărți de povești pentru copii.
      Sarcina ta: Scrie o poveste scurtă, fermecătoare (aprox. 400 de cuvinte) pentru copilul: ${data.name} care are ${data.age} ani.
      Tema poveștii (locația): ${themeLabel}.
      Povestea trebuie să aibă o morală discretă despre: ${data.lesson}.
      Tonul trebuie să fie cald, liniștitor, visător și potrivit pentru culcare. Fără scene de acțiune prea intense sau violență.
      Formatează textul folosind paragrafe despărțite prin linie nouă (fără titlu la început, doar textul poveștii). Nu folosi markdown excesiv (fără bold, italic sau titluri h1).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      return NextResponse.json({ success: true, data: { text: response.text } });
    }

    return NextResponse.json({ success: false, error: "Tip necunoscut" }, { status: 400 });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    return NextResponse.json({ success: false, error: "Magia a întârziat puțin. Încearcă din nou!" }, { status: 500 });
  }
}
