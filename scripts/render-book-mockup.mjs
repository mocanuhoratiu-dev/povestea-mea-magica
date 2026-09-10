import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const threeRoot = path.dirname(require.resolve("three"));
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1400, height: 1050 },
    deviceScaleFactor: 1,
  });
  await page.route("https://book.local/**", async (route) => {
    const file = new URL(route.request().url()).pathname.slice(1);
    if (file === "")
      return route.fulfill({
        contentType: "text/html",
        body: '<html><body style="margin:0"><script type="module" src="/scene.js"></script></body></html>',
      });
    if (file === "cover.webp")
      return route.fulfill({
        contentType: "image/webp",
        body: await readFile("public/examples/album/collection/coperta.webp"),
      });
    if (file.startsWith("three."))
      return route.fulfill({
        contentType: "text/javascript",
        body: await readFile(path.join(threeRoot, file)),
      });
    if (file === "scene.js")
      return route.fulfill({
        contentType: "text/javascript",
        body: `
   import * as T from '/three.module.js';
   const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setSize(1400,1050);renderer.setPixelRatio(1);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;document.body.appendChild(renderer.domElement);
   const scene=new T.Scene();const camera=new T.PerspectiveCamera(32,1400/1050,.1,100);camera.position.set(2,1.7,8);camera.lookAt(0,0,0);
   scene.add(new T.HemisphereLight(0xffffff,0x66786a,2.6));const light=new T.DirectionalLight(0xffffff,3.2);light.position.set(-3,5,6);light.castShadow=true;light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-5;light.shadow.camera.right=5;light.shadow.camera.top=5;light.shadow.camera.bottom=-5;light.shadow.normalBias=.02;scene.add(light);
   const texture=await new T.TextureLoader().loadAsync('/cover.webp');texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=renderer.capabilities.getMaxAnisotropy();
   const group=new T.Group();scene.add(group);group.rotation.y=-.10;group.rotation.z=-.035;
   const cloth=new T.MeshStandardMaterial({color:0x402847,roughness:.76});
   const front=new T.MeshStandardMaterial({map:texture,roughness:.7});
   const box=(w,h,d,m,z)=>{const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),m);mesh.position.z=z;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
   box(3.42,2.41,.035,cloth,-.12);
   const lines=document.createElement('canvas');lines.width=128;lines.height=512;const c=lines.getContext('2d');c.fillStyle='#eeeae1';c.fillRect(0,0,128,512);for(let y=3;y<512;y+=8){c.fillStyle=y%3?'#d5d3c9':'#c3c3b7';c.fillRect(0,y,128,1)}const paperTexture=new T.CanvasTexture(lines);paperTexture.colorSpace=T.SRGBColorSpace;
   box(3.35,2.33,.18,new T.MeshStandardMaterial({map:paperTexture,roughness:1}),-.012);
   box(3.42,2.41,.04,[cloth,cloth,cloth,cloth,front,cloth],.105);
   const spine=box(.045,2.405,.23,cloth,-.015);spine.position.x=-1.69;
   const seam=new T.Mesh(new T.BoxGeometry(.011,2.38,.003),new T.MeshStandardMaterial({color:0x291a30,roughness:1}));seam.position.set(-1.61,0,.128);group.add(seam);
   const floor=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.16}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.28;floor.receiveShadow=true;scene.add(floor);
   renderer.render(scene,camera);window.bookReady=true;window.rotateBook=()=>{group.rotation.y+=.25;renderer.render(scene,camera)};
  `,
      });
    return route.abort();
  });
  await page.goto("https://book.local/");
  await page.waitForFunction(() => window.bookReady === true);
  const buffer = await page.screenshot({ omitBackground: true });
  const stats = await sharp(buffer).stats();
  if (stats.channels.every((c) => c.stdev < 3))
    throw Error("Blank book render");
  await sharp(buffer)
    .trim({ threshold: 8 })
    .extend({
      top: 32,
      bottom: 32,
      left: 32,
      right: 32,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .resize({ width: 1200 })
    .webp({ quality: 90 })
    .toFile("public/examples/album/collection/book-mockup.webp");
  await mkdir("/private/tmp/pmm-book-render-qa", { recursive: true });
  await page.evaluate(() => window.rotateBook());
  await page.screenshot({
    path: "/private/tmp/pmm-book-render-qa/alternate-angle.png",
    omitBackground: true,
  });
  console.log(
    "Three.js book rendered with cover texture, spine, page block and shadows.",
  );
} finally {
  await browser.close();
}
