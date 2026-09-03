import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { renderAlbumDocuments } from "../src/lib/album/renderer";
import type { AlbumConfiguration, AlbumPlan } from "../src/lib/album/types";

const workspace = path.resolve(process.cwd(), "..");
const assetsRoot = path.join(workspace, "tmp", "pdfs", "album-premium", "assets");
const extractedRoot = path.join(workspace, "tmp", "pdfs", "album-assets");
const outputRoot = path.join(workspace, "output", "pdf");

const sceneNames = [
  "scene-02-firefly-map.png",
  "scene-04-gate-of-winds.png",
  "scene-04b-valley-of-echoes.png",
  "scene-06-moon-garden.png",
  "scene-07-hall-of-shadows.png",
  "scene-07b-friendly-shadows.png",
  "scene-09-constellation-stairs.png",
  "scene-09b-sky-platform.png",
];

const extractedNames = ["asset-005.jpg", "asset-006.jpg", "asset-007.jpg", "asset-008.jpg", "asset-009.jpg"];
const headings = [
  "O lumină neașteptată", "Harta licuricilor", "Poarta care șoptește", "Valea ecourilor", "Grădina lunii",
  "Sala umbrelor cuminți", "O alegere curajoasă", "Prietenii de lumină", "Scara constelațiilor", "Podul dintre stele",
  "Secretul observatorului", "Drumul spre casă", "Lumina dusă mai departe",
];
const texts = [
  "Într-o seară albastră, Eva a găsit o steluță tremurând sub florile din grădină. A ridicat-o cu grijă, iar lumina ei i-a desenat pe palmă începutul unei hărți.",
  "Licuricii s-au așezat unul câte unul pe cărare și au arătat drumul spre observator. Eva și noua ei prietenă au pornit împreună, fără să lase nicio lumină în urmă.",
  "La marginea pădurii le aștepta o poartă înaltă, mișcată de vânt. Nu se deschidea cu o cheie, ci doar pentru cine putea spune cu voce tare ce își dorea cu adevărat.",
  "Dincolo de poartă, fiecare cuvânt se întorcea ca un ecou. Eva a ascultat atent și a descoperit că ecourile nu o speriau, ci o ajutau să aleagă drumul potrivit.",
  "În grădina lunii, florile se deschideau numai când primeau o poveste. Eva le-a vorbit despre casa ei, iar petalele au aprins o lumină caldă spre turnul observatorului.",
  "Umbrele din sala mare păreau uriașe, dar steluța le-a luminat pe rând. Fiecare ascundea doar un obiect obișnuit, iar Eva a început să râdă de formele lor caraghioase.",
  "În fața a două scări, Eva a ales-o pe cea mai puțin strălucitoare. Nu părea drumul ușor, însă urmele mici de lumină îi spuneau că cineva trecuse pe acolo înainte.",
  "Pe trepte au întâlnit stele rătăcite, prea obosite să mai zboare. Eva le-a strâns într-un șir luminos, iar împreună au urcat mai repede decât și-ar fi imaginat.",
  "Scara constelațiilor se învârtea încet deasupra norilor. Eva a pășit cu răbdare, numărând fiecare lumină și ținând steluța aproape, până când cerul s-a deschis deasupra lor.",
  "Podul dintre stele lipsea chiar la mijloc. Eva și-a amintit harta de pe palmă și a unit punctele luminoase, construind o trecere nouă pentru toți prietenii ei.",
  "În observator, o lentilă uriașă a prins lumina steluței și a trimis-o peste întreaga vale. Dintr-odată, toate cărările și ferestrele au început să sclipească blând.",
  "Misiunea era împlinită. Steluța i-a arătat Evei un drum auriu spre casă, iar prietenii de lumină au însoțit-o până când grădina cunoscută a apărut din nou.",
  "Înainte să se despartă, steluța a lăsat o scânteie în rucsacul Evei. De atunci, când avea nevoie de curaj, Eva își amintea că și o lumină mică poate schimba o lume întreagă.",
];

const configuration: AlbumConfiguration = {
  generation: {
    type: "album",
    name: "Eva",
    age: "5",
    hairStyle: "ondulat până la umeri",
    hairColor: "șaten",
    eyeColor: "căprui",
    skinTone: "deschisă",
    outfit: "salopetă cărămizie, bluză crem și rucsac bleumarin cu stele",
    appearanceDetail: "o agrafă aurie în formă de stea",
    favoriteColor: "albastru ceresc",
    world: "stars",
    companion: "O steluță rătăcită",
    lesson: "Curaj și încredere",
    mood: "Aventuros și luminos",
    artStyle: "Acuarelă cinematografică",
    personalDetail: "Eva păstrează în rucsac o lanternă mică primită de la bunica.",
    storyContext: "Eva ajută o steluță să ducă lumina înapoi la observator.",
  },
  dedication: "Pentru Eva, care găsește o rază de lumină chiar și atunci când drumul pare necunoscut.",
  dedicationFrom: "Cu toată dragostea, Mama și Tata",
};

const plan: AlbumPlan = {
  title: "Eva și lumina dintre stele",
  characterBible: "Eva, 5 years old, brown eyes and wavy brown hair, brick-red overalls and a navy star backpack.",
  characterPrompt: "Character reference for Eva and her tiny star companion.",
  coverPrompt: "Eva discovers a tiny living star in a moonlit garden.",
  coloringPrompt: "Eva and the star in the moon garden.",
  differencesPrompt: "Eva and the star exploring an enchanted observatory.",
  scenes: headings.map((heading, index) => ({
    heading,
    text: texts[index],
    imagePrompt: `Premium scene ${index + 1}`,
    panelPosition: "bottom",
    panelTone: index % 2 ? "navy" : "cream",
  })),
  textModel: "sample",
};

await mkdir(outputRoot, { recursive: true });
const cover = await readFile(path.join(extractedRoot, "asset-000.jpg"));
const scenes = await Promise.all([
  ...sceneNames.map((name) => readFile(path.join(assetsRoot, name))),
  ...extractedNames.map((name) => readFile(path.join(extractedRoot, name))),
]);
const coloring = await readFile(path.join(assetsRoot, "coloring-moon-garden.png"));
const documents = await renderAlbumDocuments(configuration, plan, {
  cover,
  scenes,
  coloring,
  differences: scenes[5],
});
await Promise.all([
  writeFile(path.join(outputRoot, "albumul-meu-magic-eva-premium-v2.pdf"), documents.storybook),
  writeFile(path.join(outputRoot, "caietul-magic-eva-premium-v2.pdf"), documents.activityBooklet),
]);
