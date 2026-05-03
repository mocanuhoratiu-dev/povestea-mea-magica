import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "";

    console.log("🚀 Cerere generare primită:", data.type, data.name);

    // LOGICĂ GENERARE LOCALĂ PENTRU MONSTER KIT (Bypass n8n)
    if (data.type === "monster") {
        const monsterResponse = `
📜 CERTIFICAT DE PROTECȚIE MAGICĂ 🛡️
Prezentul document atestă că eroul ${data.name} este sub protecția directă a Consiliului Magiei.

✨ VRAJA TA MAGICĂ:
"Luminițe sclipitoare, fugiți umbre temătoare! 
Cu inima plină de curaj, fac al fricii un naufragiu!"

🧪 REȚETA PENTRU SPRAY-UL ANTI-${data.monster.toUpperCase()}:
1. Un flacon cu apă curată.
2. Trei picături de "esență de curaj" (suc de lămâie).
3. Un strop de sclipici invizibil.
Pulverizează sub pat înainte de culcare și nicio urmă de ${data.monster} nu va mai rămâne!

💪 MESAJUL CONSILIULUI:
Ești mai puternic decât orice umbră, ${data.name}! Dormi liniștit, magia este cu tine.
        `;
        return NextResponse.json({ success: true, data: { text: monsterResponse } });
    }

    // Trimiterea datelor către n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, timestamp: new Date().toISOString() }),
    });

    if (!response.ok) {
      throw new Error(`n8n Error: ${response.status}`);
    }

    let rawResponse = await response.text();
    rawResponse = rawResponse.trim().replace(/^=/, '');

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (e) {
      result = { text: rawResponse };
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    return NextResponse.json({ success: false, error: "Magia a întârziat puțin. Încearcă din nou!" }, { status: 500 });
  }
}
