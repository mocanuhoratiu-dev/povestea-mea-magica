import { KIT_SAMPLE_ASSETS, readKitInput, type KitKind, type PremiumKit } from "./content.ts";

/** Explicit public samples only. Never used as generation fallback. */
export function kitSample(kind: KitKind) {
  const night = kind === "monster";
  const input = readKitInput({ kitVersion: 2, type: kind, name: night ? "Eva" : "Raul", age: night ? "6" : "4", appearance: night ? "păr blond și creț, pijama verde-mentă" : "păr șaten, jachetă verde și eșarfă corai", monster: "umbrele noptii", context: night ? "umbra de pe dulap" : "la restaurant, asteptand mancarea", interest: night ? "veioza mov" : "bicicleta albastră", tone: "o îmbrățișare", trustedAdult: "mama", difficulty: "easy", favoriteColor: "pruna" })!;
  const kit: PremiumKit = {
    version: 2, kind, assets: KIT_SAMPLE_ASSETS[kind], imageAttempts: 0,
    title: night ? "Umbra avea un nume." : "Un oraș, pe masa voastră.",
    subtitle: night ? "Eva și lumina care rămâne aproape" : "Raul și misterul plicului verde",
    story: night ? ["Pe ușa dulapului Evei se întindea o umbră lungă. Eva a strâns marginea pijamalei. Mama s-a așezat lângă ea, iar Lumi a apropiat felinarul.", "Au privit împreună. Era cardiganul de pe scaun! Când mama l-a mutat, umbra s-a făcut mică. Eva a zâmbit: «Deci tu erai.»"] : ["Cât timp aștepta masa, Raul a observat că șervețelul semăna cu un munte. Lumi a văzut o lingură-pod și un turn făcut dintr-o ceașcă.", "În oraș apăruse un plic verde cu o bicicletă pe sigiliu. «Adună trei litere», scria în bilet. «Ele îți spun unde ducem mesajul.»"],
    ending: ["Raul a dus bicicleta până la pod. Lumi a deschis plicul verde. Înăuntru era un bilet mic.", "O ceașcă, un șervețel și o lingură deveniseră o aventură. Raul a privit în jur. Ce alt loc ar fi putut descoperi?"],
    letter: ["Îți amintești umbra de pe dulap? Semăna cu ceva uriaș, dar în spatele ei era un cardigan cunoscut.", "Ai spus ce te neliniștea. Mama a ascultat. Ați privit împreună. Din acea întrebare a început atelierul nostru.", "Scutul îți amintește că poți să întrebi, să alegi și să ceri apropiere. Nu trebuie să facă emoțiile să dispară."],
    formula: "Pot să spun ce mă neliniștește. Mama mă ascultă.",
    parentMessage: night ? "Ascultă emoția înainte să o explici. Întreabă dacă vrea să priviți împreună și respectă răspunsul. Ritualul este o joacă de apropiere, nu o probă de curaj." : "Pentru o pauză scurtă, alegeți povestea, radarul și finalul. Pentru mai mult timp, adăugați labirintul și desenul. Nu trebuie să terminați totul la o singură ieșire.",
    ritual: [{ title: "Ne uităm împreună.", text: "Mama, umbra de lângă dulap mă neliniștește. Vii să ne uităm?" }, { title: "Expirăm ușor.", text: "Inspirăm firesc. Expirăm lent, ca să mișcăm o pană imaginară. Repetăm dacă ne place." }, { title: "Te pot chema.", text: "Dacă mă trezesc și am nevoie de tine, pot să te strig." }],
    radar: [{ title: "Ceva rotund", text: "Ce obiect are forma unei roți?" }, { title: "O pată de albastru", text: "Găsește culoarea bicicletei tale." }, { title: "Un sunet liniștit", text: "Îl poți descrie fără să spui sursa?" }, { title: "Un drum mic", text: "Unde ar merge o bicicletă de jucărie?" }],
    tickets: [{ title: "Roți peste tot.", text: "Găsește trei forme rotunde. Care ar fi o roată amuzantă?" }, { title: "Un plic vorbește.", text: "Ce ar spune plicul verde dacă s-ar deschide singur?" }, { title: "O lingură-pod.", text: "Ce alte trei obiecte ar încăpea în orașul vostru?" }, { title: "Orașul de mâine.", text: "Desenează o clădire pe care o pot folosi bicicletele." }],
    drawingPrompt: "Cum ai transporta plicul cu bicicleta fără să-l pierzi? Colorează plicul și desenează invenția ta în jurul lui.",
    discovery: night ? "Cardiganul Evei." : "Orașul acesta a apărut pentru că te-ai uitat cu atenție. Acum îi poți da un nume.",
    codeWord: "POD", characterDescription: night ? "Blonde curly-haired child in mint pajamas" : "Chestnut-haired child with teal jacket and coral scarf",
    coverPrompt: "Original public sample cover illustration", scenePrompt: "Original public sample interior illustration",
  };
  return { input, kit };
}
