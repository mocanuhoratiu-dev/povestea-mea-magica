import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPreviewPassword, previewConfigured } from "../src/lib/launchPreview.ts";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Eye, EyeOff, LogOut } from "lucide-react";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const directory = path.join(root, ".preview");
await mkdir(directory, { recursive: true, mode: 0o700 });
await chmod(directory, 0o700);
const credentials = path.join(directory, "private-access.json");
let existing;
try { existing = JSON.parse(await readFile(credentials, "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
if (existing && !previewConfigured(existing)) throw new Error("Invalid existing preview credentials; not overwriting.");
if (!existing) {
  const password = randomBytes(18).toString("base64url");
  await writeFile(credentials, JSON.stringify({
    LAUNCH_PREVIEW_PASSWORD_HASH: await hashPreviewPassword(password),
    LAUNCH_PREVIEW_SESSION_SECRET: randomBytes(32).toString("hex"),
  }, null, 2), { mode: 0o600, flag: "wx" });
  await writeFile(path.join(directory, "acces-privat.txt"), `ACCES PRIVAT LOCAL - POVESTEA MEA MAGICA\n\nPagina: http://127.0.0.1:3016/acces-preview\nParola: ${password}\n\nValabilitate sesiune: 8 ore. Nu trimite parola altor persoane.\nDatele acestea nu sunt publicate si nu intra in Git.\n`, { mode: 0o600, flag: "wx" });
}
for (const [name, Icon] of [["eye", Eye], ["eye-off", EyeOff], ["log-out", LogOut]]) {
  await writeFile(path.join(root, "public/launch", `${name}.svg`), renderToStaticMarkup(createElement(Icon, { xmlns: "http://www.w3.org/2000/svg", color: "#173d3d", width: 24, height: 24, strokeWidth: 1.7 })));
}
console.log("Private preview configured. Password is in .preview/acces-privat.txt; no credentials printed.");
