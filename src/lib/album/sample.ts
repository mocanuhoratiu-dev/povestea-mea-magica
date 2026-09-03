export type AlbumSamplePage = {
  title: string;
  eyebrow: string;
  image: string;
  alt: string;
  narration?: string;
};

export const albumSampleAudio = "/examples/album/flipbook/album-sample.mp3";

const sampleScenes = [
  {
    title: "O lumină neașteptată",
    narration: "Într-o seară albastră, Eva a găsit o steluță tremurând sub florile din grădină. A ridicat-o cu grijă, iar lumina ei i-a desenat pe palmă începutul unei hărți.",
  },
  {
    title: "Harta licuricilor",
    narration: "Licuricii s-au așezat unul câte unul pe cărare și au arătat drumul spre observator. Eva și noua ei prietenă au pornit împreună, fără să lase nicio lumină în urmă.",
  },
  {
    title: "Poarta care șoptește",
    narration: "La marginea pădurii le aștepta o poartă înaltă, mișcată de vânt. Nu se deschidea cu o cheie, ci doar pentru cine putea spune cu voce tare ce își dorea cu adevărat.",
  },
  {
    title: "Valea ecourilor",
    narration: "Dincolo de poartă, fiecare cuvânt se întorcea ca un ecou. Eva a ascultat atent și a descoperit că ecourile nu o speriau, ci o ajutau să aleagă drumul potrivit.",
  },
  {
    title: "Grădina lunii",
    narration: "În grădina lunii, florile se deschideau numai când primeau o poveste. Eva le-a vorbit despre casa ei, iar petalele au aprins o lumină caldă spre turnul observatorului.",
  },
  {
    title: "Sala umbrelor cuminți",
    narration: "Umbrele din sala mare păreau uriașe, dar steluța le-a luminat pe rând. Fiecare ascundea doar un obiect obișnuit, iar Eva a început să râdă de formele lor caraghioase.",
  },
  {
    title: "O alegere curajoasă",
    narration: "În fața a două scări, Eva a ales-o pe cea mai puțin strălucitoare. Nu părea drumul ușor, însă urmele mici de lumină îi spuneau că cineva trecuse pe acolo înainte.",
  },
  {
    title: "Prieteni de lumină",
    narration: "Pe trepte au întâlnit stele rătăcite, prea obosite să mai zboare. Eva le-a strâns într-un șir luminos, iar împreună au urcat mai repede decât și-ar fi imaginat.",
  },
  {
    title: "Scara constelațiilor",
    narration: "Scara constelațiilor se învârtea încet deasupra norilor. Eva a pășit cu răbdare, numărând fiecare lumină și ținând steluța aproape, până când cerul s-a deschis deasupra lor.",
  },
  {
    title: "Podul dintre stele",
    narration: "Podul dintre stele lipsea chiar la mijloc. Eva și-a amintit harta de pe palmă și a unit punctele luminoase, construind o trecere nouă pentru toți prietenii ei.",
  },
  {
    title: "Secretul observatorului",
    narration: "În observator, o lentilă uriașă a prins lumina steluței și a trimis-o peste întreaga vale. Dintr-odată, toate cărările și ferestrele au început să sclipească blând.",
  },
  {
    title: "Drumul spre casă",
    narration: "Misiunea era împlinită. Steluța i-a arătat Evei un drum auriu spre casă, iar prietenii de lumină au însoțit-o până când grădina cunoscută a apărut din nou.",
  },
  {
    title: "Lumina dusă mai departe",
    narration: "Înainte să se despartă, steluța a lăsat o scânteie în rucsacul Evei. De atunci, când avea nevoie de curaj, Eva își amintea că și o lumină mică poate schimba o lume întreagă.",
  },
] as const;

export const albumSamplePages: AlbumSamplePage[] = [
  {
    title: "Eva și lumina dintre stele",
    eyebrow: "Coperta",
    image: "/examples/album/flipbook/page-01.webp",
    alt: "Coperta albumului Eva și lumina dintre stele, cu Eva ținând o steluță luminoasă",
  },
  {
    title: "O poveste creată special",
    eyebrow: "Dedicația",
    image: "/examples/album/flipbook/page-02.webp",
    alt: "Pagina de dedicație personalizată pentru Eva",
  },
  ...sampleScenes.map((scene, index) => ({
    title: scene.title,
    eyebrow: `Scena ${index + 1}`,
    image: `/examples/album/flipbook/page-${String(index + 3).padStart(2, "0")}.webp`,
    alt: `Pagină ilustrată din albumul Evei: ${scene.title}`,
    narration: scene.narration,
  })),
  {
    title: "O poveste în care copilul tău contează",
    eyebrow: "Coperta finală",
    image: "/examples/album/flipbook/page-16.webp",
    alt: "Coperta finală Povestea Mea Magică",
  },
];
