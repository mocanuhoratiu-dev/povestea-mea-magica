import { cp, mkdir, readFile } from "node:fs/promises";
import { openSync, closeSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PREVIEW_PORT || 3016);
const privateAccess = process.argv.includes("--private");
const credentials = privateAccess ? JSON.parse(await readFile(path.join(root, ".preview/private-access.json"), "utf8")) : {};
try {
  await fetch(`http://127.0.0.1:${port}/api/launch`, { signal: AbortSignal.timeout(1000) });
  throw new Error(`Port ${port} is already in use. Choose PREVIEW_PORT.`);
} catch (error) {
  if (error.message.startsWith("Port ")) throw error;
}
const standalone = path.join(root, ".next/standalone");
await cp(path.join(root, "public"), path.join(standalone, "public"), { recursive:true });
await cp(path.join(root, ".next/static"), path.join(standalone, ".next/static"), { recursive:true });
await mkdir(path.join(root, ".preview"), { recursive:true });
const log = openSync(path.join(root, ".preview/server.log"), "a");
const child = spawn(process.execPath, [path.join(standalone, "server.js")], {
  cwd: standalone, detached:true, stdio:["ignore",log,log],
  env:{...process.env,...credentials,HOSTNAME:"127.0.0.1",PORT:String(port),LAUNCH_GATE_ENABLED:String(privateAccess),LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP:String(privateAccess),LAUNCH_AT:"2026-09-18T18:00:00+03:00"},
});
child.unref();
closeSync(log);
let ready = false;
for(let n=0;n<80;n++) {
  try { if((await fetch(`http://127.0.0.1:${port}/in-curand`)).ok) { ready=true;break; } } catch {}
  await new Promise(resolve=>setTimeout(resolve,100));
}
if(!ready) { child.kill("SIGTERM"); throw new Error("Preview did not start; see .preview/server.log"); }
console.log(JSON.stringify({url:`http://127.0.0.1:${port}/${privateAccess ? "acces-preview" : "in-curand"}`,pid:child.pid,privateAccess,productionPublished:false}));
