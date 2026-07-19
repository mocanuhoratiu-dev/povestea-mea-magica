import { GoogleAuth } from "google-auth-library";

export type NarrationKind = "story" | "lumi";

function getVertexCredentials() {
  const encodedCredentials = process.env.VERTEX_AI_SERVICE_ACCOUNT_JSON_BASE64?.trim();
  if (!encodedCredentials) return undefined;

  try {
    return JSON.parse(Buffer.from(encodedCredentials, "base64").toString("utf8"));
  } catch {
    throw new Error("Configurarea de autentificare Google Cloud este invalidă.");
  }
}

function voiceFor(kind: NarrationKind) {
  return kind === "lumi"
    ? process.env.GOOGLE_TTS_LUMI_VOICE?.trim() || "ro-RO-Chirp3-HD-Aoede"
    : process.env.GOOGLE_TTS_STORY_VOICE?.trim() || "ro-RO-Chirp3-HD-Zephyr";
}

export async function synthesizeRomanianSpeech(text: string, kind: NarrationKind) {
  const credentials = getVertexCredentials();
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    ...(credentials ? { credentials } : {}),
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = typeof token === "string" ? token : token.token;
  if (!accessToken) throw new Error("Google Cloud nu a putut autentifica nararea audio.");

  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(process.env.VERTEX_AI_PROJECT_ID?.trim()
        ? { "x-goog-user-project": process.env.VERTEX_AI_PROJECT_ID.trim() }
        : {}),
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: "ro-RO", name: voiceFor(kind) },
      audioConfig: { audioEncoding: "MP3" },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Google Cloud Text-to-Speech a răspuns cu ${response.status}: ${details.slice(0, 600)}`);
  }

  const payload = (await response.json()) as { audioContent?: unknown };
  if (typeof payload.audioContent !== "string" || !payload.audioContent) {
    throw new Error("Google Cloud Text-to-Speech nu a returnat fișierul audio.");
  }
  return Buffer.from(payload.audioContent, "base64");
}
