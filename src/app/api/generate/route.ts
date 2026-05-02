import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // URL-ul Webhook-ului tău din n8n (Placeholder)
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.ta.com/webhook-test/magic-engine";

    console.log("Trimitere date către n8n:", data);

    // Trimiterea datelor către n8n
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n a răspuns cu eroare:", response.status, errorText);
      throw new Error(`n8n Error: ${response.status}`);
    }

    let rawResponse = await response.text();
    console.log("Răspuns brut original:", rawResponse);

    // Curățăm semnele de egalitate sau alte caractere de la început (bug n8n)
    rawResponse = rawResponse.trim().replace(/^=/, '');

    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch (e) {
      console.log("Răspunsul nu este JSON valid nici după curățare, îl tratăm ca text.");
      result = { text: rawResponse };
    }

    return NextResponse.json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error("Eroare API Generate:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Nu am putut porni generarea." 
    }, { status: 500 });
  }
}
