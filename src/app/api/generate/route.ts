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
  tone?: string;
  themeDetail?: string;
  lessonDetail?: string;
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

function stripHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?em[^>]*>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sanitizeEmHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<em[^>]*>/gi, "[[EM]]")
    .replace(/<\/em>/gi, "[[/EM]]")
    .replace(/<[^>]*>/g, "")
    .replace(/\[\[EM\]\]/g, "<em>")
    .replace(/\[\[\/EM\]\]/g, "</em>")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRomanianText(value: string): string {
  return value
    .replace(/\bUrsii\b/g, "Urșii")
    .replace(/\bursii\b/g, "urșii")
    .replace(/\bPestii\b/g, "Peștii")
    .replace(/\bpestii\b/g, "peștii")
    .replace(/\bsosea\b/g, "șosea")
    .replace(/\bconteaza\b/g, "contează")
    .replace(/\bcasutele\b/g, "căsuțele")
    .replace(/\bmasina\b/g, "mașina")
    .replace(/\bmancarea\b/g, "mâncarea");
}

function sanitizeStoryText(value: unknown): string {
  return normalizeRomanianText(
    String(value ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]*>/g, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/\*\*/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}

function sanitizeStoryPayload(value: unknown, fallbackName: string, themeLabel: string) {
  const story = value as {
    title?: unknown;
    text?: unknown;
    imagePrompt?: unknown;
  };
  const name = stripHtml(fallbackName) || "Eroul";
  const title = stripHtml(story.title) || `Povestea lui ${name}`;
  const text = sanitizeStoryText(story.text);
  const imagePrompt = stripHtml(story.imagePrompt) ||
    `warm square children's book cover illustration of ${name} inside a ${themeLabel} world, based on the bedtime story, soft magical light, expressive friendly character, watercolor and gouache texture, no text`;

  return { title, text, imagePrompt };
}

function buildStableStoryPayload(data: GenerateRequest, themeLabel: string) {
  const name = stripHtml(data.name) || "Eroul";
  const age = stripHtml(data.age) || "4";
  const lesson = stripHtml(data.lesson) || "curaj și încredere";
  const tone = stripHtml(data.tone) || "Liniștită de somn";
  const worldDetail = stripHtml(data.themeDetail) || `o lume ${themeLabel.toLocaleLowerCase("ro-RO")} plină de lumină blândă`;
  const lessonDetail = stripHtml(data.lessonDetail) || "lecția apare printr-o alegere mică, făcută cu răbdare";
  const childDetails = stripHtml(data.context) || "curiozitatea și imaginația copilului";
  const title = `${name} și Scânteia Curajului`;

  const text = [
    `Într-o seară liniștită, ${name}, care avea ${age} ani, a descoperit lângă pernă o scânteie mică, rotundă și caldă. Nu era o stea obișnuită, ci o invitație către ${worldDetail}. Scânteia a clipit de trei ori, ca și cum ar fi spus: „Vino, avem nevoie de tine.” Povestea avea tonul ales de părinte: ${tone.toLocaleLowerCase("ro-RO")}. ${name} a zâmbit, și-a luat curajul în buzunar și a pășit încet în aventura care tocmai începea.`,
    `Lumea din jur era construită din lucruri cunoscute și lucruri nemaivăzute. Totul părea pregătit special pentru ${name}: poteci care se aprindeau când erau atinse, sunete moi ca o poveste spusă în șoaptă și mici semne care aminteau de ${childDetails}. În depărtare, o poartă aurie se închisese, iar dincolo de ea rămăsese blocată Lumina de Seară, cea care ajuta toate visele bune să ajungă la copii.`,
    `Paznicul porții, un spiriduș cu pălărie prea mare, i-a explicat că poarta nu putea fi deschisă cu forță. Se deschidea doar când cineva învăța ${lesson.toLocaleLowerCase("ro-RO")} fără grabă și fără teamă. ${name} a ascultat atent. Nu părea o misiune cu săbii sau tunete, ci una cu inimă, răbdare și pași mici. Iar asta o făcea cu adevărat importantă.`,
    `Mai întâi, ${name} a întâlnit un pod subțire făcut din nori. Podul tremura ușor și părea să spună că nu este sigur pe el. ${name} a respirat adânc și a făcut primul pas. Apoi încă unul. Cu fiecare pas, podul devenea mai luminos. Așa a înțeles că uneori curajul nu înseamnă să nu simți emoții, ci să mergi mai departe cu blândețe, exact în ritmul tău.`,
    `La mijlocul drumului, scânteia s-a oprit lângă o cutie mică. Înăuntru era o cheie, dar cheia avea nevoie de o promisiune. ${name} s-a gândit la lecția zilei: ${lessonDetail}. A promis să încerce, să ceară ajutor când are nevoie și să țină minte că fiecare pas mic contează. Atunci cheia s-a încălzit în palmă și a început să cânte încetișor.`,
    `Când ${name} s-a întors la poarta aurie, spiridușul a făcut o reverență. Cheia a intrat singură în broască, iar Lumina de Seară a ieșit ca o pătură caldă peste întreaga lume. Totul s-a liniștit. Potecile au clipit, norii s-au așezat, iar scânteia mică s-a lipit de pieptul lui ${name}, acolo unde curajul se simțea ca o lumină prietenoasă.`,
    `Înainte să adoarmă, ${name} a auzit șoapta Luminii de Seară: „Ai reușit pentru că ai fost tu.” Camera era din nou camera cunoscută, dar povestea rămăsese acolo, invizibilă și caldă. Iar când pleoapele s-au închis, ${name} a știut că mâine va putea încerca din nou, cu aceeași scânteie mică și magică în inimă.`,
  ].join("\n\n");

  return {
    title,
    text,
    imagePrompt: `English prompt: square children's book cover of ${name}, age ${age}, holding a tiny warm courage spark in a ${themeLabel} world, based on a gentle bedtime adventure about ${lesson}, premium watercolor and gouache, soft bedtime light, no text`,
    fallback: true,
    note: `Am folosit varianta stabilă pentru că serviciul AI este temporar aglomerat. Textul poate fi editat înainte de PDF.`,
  };
}

function sanitizeMonsterKit(value: unknown) {
  const kit = value as {
    body?: unknown;
    ingredients?: Array<{ num?: unknown; icon?: unknown; name?: unknown; detail?: unknown }>;
    steps?: Array<{ roman?: unknown; l1?: unknown; l2?: unknown }>;
    spell?: unknown;
  };

  return {
    body: sanitizeEmHtml(kit.body),
    ingredients: Array.isArray(kit.ingredients)
      ? kit.ingredients.slice(0, 4).map((ingredient, index) => ({
          num: stripHtml(ingredient.num) || String(index + 1),
          icon: stripHtml(ingredient.icon),
          name: stripHtml(ingredient.name),
          detail: stripHtml(ingredient.detail),
        }))
      : [],
    steps: Array.isArray(kit.steps)
      ? kit.steps.slice(0, 3).map((step, index) => ({
          roman: stripHtml(step.roman) || ["I", "II", "III"][index] || String(index + 1),
          l1: stripHtml(step.l1),
          l2: stripHtml(step.l2),
        }))
      : [],
    spell: stripHtml(kit.spell),
  };
}

function sanitizeEmergencyKit(value: unknown) {
  const kit = value as {
    radar?: unknown[];
    riddle?: unknown;
    drawing?: unknown;
    patience?: unknown;
    story_starters?: unknown[];
    true_or_false?: Array<{ q?: unknown; a?: unknown }>;
  };

  return {
    radar: Array.isArray(kit.radar)
      ? kit.radar.slice(0, 4).map((item) => normalizeRomanianText(stripHtml(item)))
      : [],
    riddle: normalizeRomanianText(stripHtml(kit.riddle)),
    drawing: normalizeRomanianText(stripHtml(kit.drawing)),
    patience: normalizeRomanianText(stripHtml(kit.patience)),
    story_starters: Array.isArray(kit.story_starters)
      ? kit.story_starters.slice(0, 3).map((item) => normalizeRomanianText(stripHtml(item)))
      : [],
    true_or_false: Array.isArray(kit.true_or_false)
      ? kit.true_or_false.slice(0, 3).map((item) => ({
          q: normalizeRomanianText(stripHtml(item.q)),
          a: normalizeRomanianText(stripHtml(item.a)),
        }))
      : [],
  };
}

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      if (data.type === "story") {
        const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
        return NextResponse.json({ success: true, data: buildStableStoryPayload(data, themeLabel) });
      }

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
        "body": "podeaua acestei camere este protejată de... (poți folosi doar tag-uri HTML <em> pentru 1-2 accente scurte)",
        "ingredients": [ 
          { "num": "1", "icon": "emoji", "name": "nume comun obiect (ex: Apa)", "detail": "denumire magică (ex: Lacrimi de dragon)" },
          { "num": "2", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" },
          { "num": "3", "icon": "emoji", "name": "nume comun obiect", "detail": "denumire magică" }
        ],
        "steps": [ 
          { "roman": "I", "l1": "pasul 1 linia 1 (1/2 propoziție, FĂRĂ tag-uri HTML)", "l2": "pasul 1 linia 2 (continuare, FĂRĂ tag-uri HTML)" }, 
          { "roman": "II", "l1": "pasul 2 linia 1", "l2": "pasul 2 linia 2" } 
        ],
        "spell": "Un descântec vesel și magic în RIME PERFECTE (format AABB), compus din exact 4 versuri scurte, fără HTML. TREBUIE să includă numele copilului și să alunge monstrul/frica respectivă."
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
      const result = sanitizeMonsterKit(JSON.parse(jsonText));

      return NextResponse.json({ success: true, data: result });
    }

    if (data.type === "story") {
      const themeLabel = data.theme === 'space' ? 'Spațiu' : data.theme === 'forest' ? 'Pădure Fermecată' : 'Castel Magic';
      const personalizationParts = [
        data.themeDetail ? `Lume: ${stripHtml(data.themeDetail)}` : "",
        data.lessonDetail ? `Lecție: ${stripHtml(data.lessonDetail)}` : "",
        data.context ? `Detalii copil: ${stripHtml(data.context)}` : "",
      ].filter(Boolean);
      const personalization = personalizationParts.join(" | ");
      const tone = stripHtml(data.tone) || "Liniștită de somn";
      const ageNumber = Number.parseInt(data.age || "", 10) || 4;
      const wordTarget = ageNumber <= 3 ? "800-950" : ageNumber <= 6 ? "950-1150" : "1100-1300";
      const paragraphTarget = ageNumber <= 3 ? "7-8" : "8-9";
      
      const prompt = `Scrie o poveste personalizată pentru copii, în română.
      Copil: "${data.name}", ${data.age} ani. Lume: "${themeLabel}". Lecție: "${data.lesson}". Ton: ${tone}.
      ${personalization ? `Detalii de integrat natural: ${personalization}.` : "Personalizează prin nume, vârstă, lume și lecție."}

      Reguli: copilul este protagonist activ; folosește numele în titlu, prima propoziție și natural de 7-10 ori; lumea influențează problema și rezolvarea; lecția se vede prin acțiuni, fără predică; limbaj potrivit pentru ${data.age} ani; fără violență, markdown sau emoji; ${wordTarget} de cuvinte în ${paragraphTarget} paragrafe.

      Returnează doar JSON strict:
      {
        "title": "titlu scurt în română, cu numele copilului",
        "text": "povestea completă, paragrafe separate prin două newline-uri",
        "imagePrompt": "English prompt for one square children's book cover based on the central story scene, describe the child protagonist and setting, premium watercolor and gouache, soft bedtime light, no text"
      }`;

      const generated = await generateGeminiText({
        apiKey,
        prompt,
        responseMimeType: "application/json",
      });
      if ("error" in generated) {
        return NextResponse.json({
          success: true,
          data: buildStableStoryPayload(data, themeLabel),
          warning: generated.error,
        });
      }
      let result: ReturnType<typeof sanitizeStoryPayload>;
      try {
        result = sanitizeStoryPayload(JSON.parse(generated.text), data.name || "Eroul", themeLabel);
      } catch {
        return NextResponse.json({
          success: true,
          data: buildStableStoryPayload(data, themeLabel),
          warning: "Răspunsul AI nu a putut fi citit ca JSON.",
        });
      }

      return NextResponse.json({ success: true, data: result });
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
          { "q": "O întrebare amuzantă adevărat/fals despre lume, natură sau animale, potrivită pentru vârsta copilului.", "a": "Adevărat/Fals + explicație scurtă pentru pagina de răspunsuri" },
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
      const result = sanitizeEmergencyKit(JSON.parse(jsonText));

      return NextResponse.json({ success: true, data: result });
    }

    return NextResponse.json({ success: false, error: "Tip necunoscut" }, { status: 400 });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    const message = error instanceof Error ? error.message : "Magia a întârziat puțin. Încearcă din nou!";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
