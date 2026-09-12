import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url), root = process.cwd(), cache = new Map();
function load(file) {
 file = file.endsWith(".ts") ? file : file + ".ts";
 if (cache.has(file)) return cache.get(file).exports;
 const module = { exports: {} }; cache.set(file, module);
 const source = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
 const localRequire = id => id.startsWith(".") ? load(resolve(dirname(file), id)) : id.startsWith("@/") ? load(resolve(root, "src", id.slice(2))) : require(id);
 vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(localRequire, module, module.exports);
 return module.exports;
}
process.env.RESEND_API_KEY = execFileSync("/private/tmp/party-puf-sdk-20260912/google-cloud-sdk/bin/gcloud", ["secrets", "versions", "access", "latest", "--secret=pmm-resend-api-key", "--project=project-e0c2efff-d456-48f9-9fe"], { encoding: "utf8" }).trim();
process.env.EMAIL_FROM = "office@povestea-mea-magica.ro";
const transport = globalThis.fetch; let sent;
globalThis.fetch = async (...args) => {
 const response = await transport(...args);
 if (String(args[0]) === "https://api.resend.com/emails") sent = { status: response.status, body: await response.clone().json() };
 return response;
};
await load(resolve(root, "src/lib/generationIncident.ts")).notifyGenerationFailure("uat-photo-alert-20260912", "TEST UAT", "Test notificare, nu este o comandă eșuată", Error("quality_unavailable gemini-3.1-flash-lite gemini-3.5-flash gemini-3.1-pro-preview"));
assert.equal(sent?.status, 200);
console.log(JSON.stringify({ test: "operational_failure_email", status: sent.status, emailId: sent.body.id }));
await new Promise(resolve => setTimeout(resolve, 5000));
const status = await transport(`https://api.resend.com/emails/${sent.body.id}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
const result = await status.json();
console.log(JSON.stringify({ statusLookup: status.status, providerEvent: result.last_event || "unavailable with current key" }));
