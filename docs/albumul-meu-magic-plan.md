# Albumul Meu Magic - plan și status V2 Premium

**Status la 4 septembrie 2026:** varianta premium include modelul public răsfoibil și preview-ul personalizat al copertei înainte de plată. Linkul privat al preview-ului expiră în 24 de ore; coperta curată este păstrată intern conform ciclului de viață existent, devine coperta finală și referința vizuală pentru scene. Fluxul comercial rămâne bazat pe Stripe, Vertex, Cloud Tasks, email, SmartBill și descărcare securizată.

## 1. Decizia de produs

**Albumul Meu Magic** va fi un produs digital separat, premium, orientat spre ilustrație. Varianta tipărită va fi prezentată pe site ca **„În curând”**, dar nu va putea fi cumpărată în V1.

### Oferta de lansare

| Variantă | Disponibilitate | Conținut | Preț |
| --- | --- | --- | --- |
| Album Digital | Disponibil | Carte ilustrată de 16 pagini + caiet de activități de 5 pagini, ambele PDF A5 landscape | **59 lei** |
| Pachet tipărit | În curând | Carte ilustrată + caiet separat pe hârtie mată | Fără preț public încă |
| Carte tipărită premium | Fază ulterioară | Carte cu copertă cartonată + caiet separat capsat | Fără preț public încă |

Prețul standard de lansare este 59 lei. Reducerile vor fi aplicate numai prin campanii și codurile promoționale existente, fără un preț introductiv permanent. Produsul nu intră automat în Pachetul Familiei Magice la lansare.

### Diferența față de Povestea de Seară

| Produs | Rol | Format | Text | Ilustrații |
| --- | --- | --- | --- | --- |
| Povestea de Seară | Lectură personalizată, cu mai mult text | A4 portret | 2 sau 4 pagini de poveste | Copertă personalizată |
| Albumul Meu Magic | Experiență vizuală și cadou personalizat | A5 landscape | 400-500 de cuvinte | Copertă + 13 ilustrații distincte |

## 2. Contractul V1

### Structura livrării digitale

Clientul primește două PDF-uri complementare, nu un singur document mixt.

**Cartea ilustrată are exact 16 pagini:**

1. Copertă personalizată.
2. Dedicație din partea familiei.
3. Treisprezece pagini de poveste, fiecare cu o ilustrație distinctă.
4. Copertă finală.

**Caietul de activități are exact 5 pagini:**

1. Copertă personalizată.
2. Pagină de colorat inspirată din aventură.
3. Labirint personalizat cu elemente din lumea aleasă.
4. „Găsește cele 5 diferențe”, construit din două imagini ale aceleiași scene.
5. Copertă finală.

Nicio imagine de poveste nu este reutilizată pe altă pagină. Ultima scenă include „Sfârșit” în compoziția aplicată de renderer, nu în imaginea generată.

### Specificații vizuale

- format real A5 landscape: 210 x 148 mm;
- țintă de 400-500 de cuvinte în total, cu toleranță tehnică 360-560;
- țintă de 28-40 de cuvinte pe fiecare pagină, cu toleranță tehnică 24-50;
- text de 10,8-11,2 pt în mod normal, fără a coborî sub 9,2 pt;
- contrast ridicat, cu textul așezat într-o zonă editorială separată de ilustrație;
- margine de siguranță de minimum 10 mm;
- bleed de 3 mm păstrat în design pentru viitorul tipar;
- rezoluție efectivă a imaginilor de minimum 240 dpi la dimensiunea finală;
- PDF digital sub 20 MB;
- fonturi cu diacritice românești incluse în fișier;
- zero text generat în interiorul imaginilor AI.

Cele două PDF-uri sunt optimizate pentru ecran și print acasă, dar sunt pregătite diferit pentru viitoarea ediție fizică. Cartea ilustrată poate primi copertă cartonată; caietul de activități va fi tipărit separat, capsat, pe hârtie mată necretată de 120-140 g/mp, potrivită pentru creioane colorate.

### Personalizarea

1. Prenumele copilului.
2. Vârsta copilului.
3. Coafura, culoarea părului și culoarea ochilor.
4. Nuanța pielii, ținuta și semnele distinctive.
5. Culoarea preferată.
6. Lumea poveștii, aleasă din zece variante.
7. Companionul, ales din zece variante.
8. Lecția sau emoția urmărită.
9. Atmosfera și stilul vizual al albumului.
10. O idee proprie pentru firul poveștii, de până la 700 de caractere.
11. Un detaliu personal scurt.
12. Dedicația și semnătura familiei.

Nu cerem genul și nu încărcăm fotografia copilului în V1. Formularul prezintă o descriere clară a personajului înainte de plată.

## 3. Ce intră și ce nu intră în V1

### Inclus

- pagină comercială dedicată;
- model răsfoibil cu pagini din prototip;
- configurator optimizat pentru mobil;
- plată Stripe înainte de generare;
- generare asincronă a poveștii și imaginilor;
- personaj consecvent vizual între scene;
- două PDF-uri construite pe server;
- progres real după plată;
- descărcare securizată și livrare prin email;
- factură SmartBill;
- telemetrie și alerte;
- integrare atentă în recomandările Lumi;
- card vizibil „Pachet tipărit - În curând”.

### Amânat

- comandarea cărții fizice;
- adresă de livrare și tarif de transport;
- integrarea cu o tipografie sau un serviciu print-on-demand;
- AWB și urmărirea coletului;
- copertă cartonată;
- încărcarea fotografiei copilului;
- editor manual de pagini;
- regenerarea liberă a ilustrațiilor de către client.

## 4. Experiența utilizatorului

### Pagina produsului

Ruta recomandată este `/album-ilustrat`. Primul ecran arată produsul real, câteva pagini răsfoibile și comanda „Creează albumul”. Nu folosim un hero generic sau explicații tehnice despre AI.

Sub model apar două variante:

- **Album Digital**, disponibil la 59 lei și livrat ca o carte ilustrată plus un caiet de activități;
- **Pachet tipărit**, marcat clar „În curând”, fără buton de cumpărare.

Cardul variantei tipărite trebuie să explice scurt: „Pregătim cartea ilustrată și un caiet separat, ușor de colorat și completat.” Nu afișăm un termen sau un preț până la validarea tipografiei.

### Configuratorul

Configurarea are patru pași:

1. **Copilul** - nume, vârstă și aspect.
2. **Aventura** - lume, companion, lecție, atmosferă și stil vizual.
3. **Mesajul vostru** - ideea poveștii, detaliu personal și dedicație.
4. **Preview** - copertă personalizată cu watermark, urmată de consimțământ și plată.

Pe mobil, fiecare pas ocupă ecranul, are un singur CTA principal și păstrează datele la revenirea în pasul anterior. Lumi nu acoperă formularul și nu modifică alegerile fără confirmare.

### După plată

Utilizatorul vede un progres real:

1. „Scriem aventura”
2. „Dăm chip personajului”
3. „Ilustrăm scenele 2 din 13”
4. „Pregătim caietul de activități”
5. „Așezăm povestea în pagină”
6. „Albumul este gata”

Pagina interoghează starea comenzii printr-un endpoint protejat și poate fi închisă. Emailul este trimis automat când albumul este gata, iar linkul securizat permite descărcarea fără regenerare. Dacă plata este anulată, configuratorul restaurează local alegerile făcute în aceeași sesiune de browser.

## 5. Arhitectura de generare

### Fluxul complet

1. Configurația este validată și salvată într-o comandă draft.
2. Coperta premium este generată la rezoluție 2K, salvată privat și afișată cu watermark printr-un link temporar.
3. Coperta văzută de client devine referința vizuală a personajului; schimbarea alegerilor cere un preview nou.
4. Stripe Checkout încasează plata pe aceeași comandă.
5. Webhook-ul marchează comanda drept plătită, iar Cloud Tasks pornește procesarea asincronă.
6. Modelul de text produce planul structurat al albumului și păstrează titlul din preview.
7. Cele 13 ilustrații de poveste sunt generate la rezoluție 2K folosind coperta drept referință, dar cu acțiuni și compoziții distincte.
8. Fiecare asset este salvat imediat în Cloud Storage.
9. Rendererul construiește separat cartea ilustrată și caietul de activități A5 landscape.
10. Comanda este marcată `delivered`, iar clientul primește emailul și linkul securizat.

Generarea imaginilor rulează secvențial, cu pacing controlat pentru quota Vertex. Un retry reia numai asseturile lipsă, fără a regenera tot albumul și fără a dubla factura sau emailul.

### Contractul AI

```ts
type AlbumPlan = {
  title: string;
  characterBible: string;
  characterPrompt: string;
  coverPrompt: string;
  coloringPrompt: string;
  differencesPrompt: string;
  scenes: Array<{
    heading: string;
    text: string;
    imagePrompt: string;
    layout: "single" | "spread";
    panelPosition:
      | "bottom"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right";
    panelTone: "cream" | "navy";
  }>;
};
```

Reguli obligatorii:

- exact 13 scene care formează un arc narativ complet;
- exact 13 prompturi vizuale distincte, fără reutilizarea aceleiași imagini;
- țintă de 400-500 de cuvinte;
- fiecare scenă avansează acțiunea;
- lumea, lecția și detaliul personal influențează evenimentele;
- `characterBible` și planșa de personaj rămân referințele comune pentru toate imaginile;
- fără text, logo sau litere în imagini;
- textul românesc este aplicat numai de renderer;
- final optimist, potrivit vârstei, fără morală artificială.

### Strategia imaginilor

- modelul principal și rezervele rămân configurabile;
- coperta aprobată în preview este referința vizuală pentru toate scenele;
- toate ilustrațiile albumului sunt solicitate la rezoluție 2K, în raport 16:9 pentru scene, 3:2 pentru copertă și 4:3 pentru activități;
- maximum patru încercări pentru fiecare asset;
- imaginile prea mici sau aproape identice cu o scenă existentă sunt respinse automat;
- checkpoint după fiecare imagine;
- asseturile sub rezoluția minimă sunt respinse;
- pentru produsul premium plătit nu livrăm imagini lipsă;
- după eșecul modelelor Vertex, comanda intră în `needs_review` pentru reluare sau rambursare;
- nu folosim automat imagini Pollinations în albumul plătit.

## 6. PDF server-side

Albumul nu este construit în browser cu `html2canvas`. Rendererul Node folosește `jsPDF`, fonturi Liberation incluse și `sharp` pentru ambele documente.

Avantaje:

- rezultat identic pe mobil și desktop;
- dimensiuni A5 exacte;
- fonturi românești incluse;
- verificare automată a overflow-ului;
- compresie controlată a imaginilor;
- generarea unui fișier compatibil cu viitorul tipar;
- relivrare fără alte apeluri AI;
- separarea paginilor de lectură de paginile pe care copilul scrie sau colorează.

În V1 se livrează numai PDF-ul digital. Rendererul păstrează intern regulile de bleed și safe area, astfel încât trecerea la tipar să nu necesite redesenarea paginilor.

## 7. Date și stocare

Extindem comanda cu progres și manifest de asseturi:

```ts
type OrderAsset = {
  key: "character-reference" | "cover" | `scene-${number}` | "activity-coloring" | "activity-differences" | "pdf";
  objectName: string;
  mimeType: string;
  model?: string;
};

type OrderProgress = {
  stage: "planning" | "cover" | "scenes" | "activity" | "rendering" | "delivery";
  current: number;
  total: number;
};
```

Structura Cloud Storage:

```text
orders/{orderId}/album/cover.jpg
orders/{orderId}/album/character-reference.jpg
orders/{orderId}/album/scene-01.jpg
orders/{orderId}/album/...
orders/{orderId}/album/scene-13.jpg
orders/{orderId}/album/activity-coloring.jpg
orders/{orderId}/album/activity-differences.jpg
orders/{orderId}/album/storybook.pdf
orders/{orderId}/album/activity-booklet.pdf
```

Firestore păstrează numai manifestul. Numele copilului, dedicația, povestea și prompturile nu sunt trimise în telemetrie.

## 8. Modificări în proiect

### Fișiere noi implementate

- `src/app/album-ilustrat/page.tsx`
- `src/app/album-ilustrat/livrare/page.tsx`
- `src/components/AlbumCreator.tsx`
- `src/components/AlbumDeliveryClient.tsx`
- `src/lib/album/types.ts`
- `src/lib/album/schema.ts`
- `src/lib/album/generation.ts`
- `src/lib/album/orchestrator.ts`
- `src/lib/album/renderer.ts`
- `src/app/api/orders/[orderId]/document/route.ts`
- `src/app/api/checkout/status/route.ts`
- `src/components/OrderConfirmationClient.tsx`
- `src/lib/album/presentation.ts`

### Fișiere extinse

- `src/lib/catalog.ts` - `illustrated-album-digital`, 59 lei;
- `src/lib/orders.ts` - produsul `album`, asseturi și progres;
- `src/app/api/orders/route.ts` - validarea configurației;
- `src/app/api/orders/process/route.ts` - procesarea albumului;
- `src/app/api/checkout/route.ts` - catalog version nou;
- `src/lib/emailTemplates.ts` - emailul albumului;
- `src/lib/smartbill.ts` - articolul nou de factură;
- `src/lib/telemetry.ts` și `src/lib/clientTelemetry.ts`;
- `src/lib/siteMode.ts` - preț și feature flags;
- `src/components/ProductExamples.tsx`;
- `src/components/Pricing.tsx`;
- `src/app/modele/page.tsx`;
- `src/components/LumiGuide.tsx`;
- `src/components/FAQ.tsx`;
- paginile comerciale și de confidențialitate;
- `scripts/deploy-cloud-run.sh` și `.env.example`.

### Configurație

```text
ALBUM_TEXT_TIMEOUT_MS=55000
ALBUM_IMAGE_TIMEOUT_MS=45000
CLOUD_RUN_TIMEOUT=1800s
CLOUD_RUN_MEMORY=1Gi
```

Cardul „În curând” este conținut comercial, nu un produs activ în catalog.

## 9. Stripe, SmartBill și livrare

- produs Stripe: `Albumul Meu Magic - Digital`;
- preț: 59 lei;
- plata este obligatorie înainte de generare;
- codurile promoționale existente se aplică prin fluxul actual;
- SmartBill emite o singură factură pentru albumul digital;
- emailul de livrare include titlul, numele copilului și butonul securizat de descărcare;
- webhook-ul și workerul rămân idempotente;
- o comandă eșuată nu este marcată livrată;
- suportul poate relua comanda fără o a doua plată.

Nu colectăm adresă poștală în V1 și nu creăm produse Stripe pentru edițiile fizice.

## 10. Telemetrie și operare

### Evenimente

- `product_started`, `checkout_started` și evenimentele comerciale existente, cu `product=album`;
- `pmm_story_text_completed`, cu numărul real de cuvinte și modelul folosit;
- `pmm_album_stage_completed`, pentru plan, copertă, fiecare scenă, pagina de colorat, randare și livrare;
- `pmm_album_stage_failed`, cu etapa, durata și codul erorii;
- `pmm_pdf_render_completed` și `pdf_downloaded`, cu `product=album`;
- feedback-ul existent „A fost util?”, cu `product=album`.

### Dashboard

- albume începute, plătite și livrate;
- conversie configurator-checkout;
- timp median și P95 până la livrare;
- număr mediu de apeluri per album;
- retry-uri și comenzi `needs_review`;
- cost Vertex estimat per album;
- dimensiune medie PDF;
- feedback „A fost util?”;
- interes pentru cardul ediției tipărite.

### Limite inițiale

- maximum 10 albume pe zi în prima săptămână;
- maximum 16 imagini generate per comandă: coperta din preview, 13 scene și două activități;
- maximum două preview-uri pe zi pentru aceeași adresă de rețea, ca limită inițială de protecție;
- maximum patru încercări per imagine;
- alertă dacă P95 depășește 12 minute;
- alertă dacă rata de eșec depășește 5% în 30 de minute;
- alertă dacă media costului variabil depășește pragul aprobat;
- fișierele expiră conform politicii existente de livrare.

## 11. Testare

### Teste automate

- schema respinge payload-uri invalide și texte prea lungi;
- planul conține exact 13 momente narative și 13 prompturi vizuale distincte;
- povestea respectă toleranța 360-560 și ținta editorială 400-500 de cuvinte;
- retry-ul reia numai asseturile lipsă;
- execuțiile repetate nu dublează PDF-ul, factura sau emailul;
- cartea ilustrată are exact 16 pagini A5 landscape;
- caietul de activități are exact 5 pagini A5 landscape;
- niciun text nu depășește panoul;
- toate diacriticele sunt randate corect;
- PDF-ul are sub 20 MB;
- tokenul expirat nu poate descărca documentul;
- Stripe test mode pornește o singură procesare;
- SmartBill test emite o singură factură.

### Matrice vizuală

Generăm minimum 12 albume complete, fiecare cu ambele documente:

- vârste de 3, 5, 7 și 9 ani;
- minimum trei descrieri de personaj;
- minimum patru lumi;
- dedicații scurte și lungi;
- prenume lungi și diacritice;
- mobil mic, mobil mare și desktop.

Scorul minim:

- consistența personajului: 4/5;
- legătura imaginilor cu textul: 4/5;
- limba română: 4,5/5;
- lizibilitate: 5/5;
- pagini fără defecte sau overflow: 100%;
- niciun asset cu text AI accidental.

### Test de print

Chiar dacă ediția fizică este „În curând”, tipărim intern trei seturi de probă:

- la 100% pe A5;
- „fit to page” pe A4;
- cartea pe hârtia propusă de tipografie și caietul pe hârtie mată necretată de 120-140 g/mp;
- în alb-negru pentru verificarea contrastului;
- cu verificarea marginilor, centrului și scenelor panoramice.

Nu cerem copilului să scrie sau să coloreze în cartea cartonată. Acest test confirmă că produsul digital nu trebuie redesenat când activăm pachetul tipărit.

## 12. Plan de execuție

### Ziua 1 - contracte și cost

- adăugăm tipurile, schema și produsul în catalog;
- rulăm trei seturi complete de imagini;
- măsurăm costul, latența, rezoluția și consistența;
- blocăm promptul și structura celor 16 + 5 pagini.

### Ziua 2 - pipeline

- implementăm planul poveștii;
- implementăm coperta, scenele și checkpoint-urile;
- salvăm asseturile incremental;
- tratăm retry-ul și `needs_review`.

### Ziua 3 - renderer

- construim PDF-ul server-side;
- implementăm cele trei tipuri de layout;
- generăm activitățile;
- verificăm overflow, diacritice, compresie și rezoluție.

### Ziua 4 - experiența de cumpărare

- construim pagina produsului și modelul răsfoibil;
- implementăm configuratorul în patru pași;
- adăugăm cardul „Carte tipărită - În curând”;
- optimizăm complet mobilul;
- integrăm recomandarea controlată din Lumi.

### Ziua 5 - plăți și livrare

- integrăm Stripe test mode;
- integrăm SmartBill test;
- adăugăm progresul, emailul și descărcarea securizată;
- adăugăm telemetria și alertele;
- actualizăm FAQ și paginile comerciale.

### Ziua 6 - QA și soft launch

- rulăm matricea de 12 albume;
- inspectăm toate cele 252 de pagini rezultate;
- testăm plata, retry-ul, emailul, factura și descărcarea;
- verificăm mobil, desktop și print;
- activăm produsul pentru trafic controlat;
- trecem în producție după 10 comenzi consecutive reușite.

## 13. Verificări continue după lansare

Produsul este public. Următoarele praguri sunt urmărite ca obiective operaționale și semnale pentru intervenție:

- costul real pentru maximum 17 imagini este urmărit per comandă;
- timpul P95 este sub 12 minute;
- primele 12 albume sunt evaluate vizual prin eșantionare;
- urmărim serii de minimum 10 comenzi consecutive livrate fără intervenție;
- Stripe, SmartBill și emailul sunt verificate în test mode;
- cartea are 16 pagini, caietul are 5 pagini, ambele au zero overflow și fiecare rămâne sub 24 MB;
- suportul poate relua sau rambursa o comandă eșuată;
- ediția tipărită apare numai ca „În curând”.

## 14. Definition of Done

V1 este complet când părintele poate configura albumul pe telefon, poate vedea coperta personalizată înainte de plată, poate plăti aceeași comandă, poate închide pagina în timpul procesării și primește ulterior două PDF-uri coerente și descărcabile în siguranță. Personajul trebuie să rămână recognoscibil în copertă și în toate cele 13 ilustrații distincte, iar o eroare nu trebuie să producă plăți, facturi sau emailuri duplicate.

Ediția tipărită nu face parte din Definition of Done. Ea rămâne vizibilă ca direcție viitoare și va primi un plan separat după testarea a minimum trei tipografii și a unor mostre fizice.

## Referințe tehnice

- [Vertex AI - subject customization cu imagini de referință](https://cloud.google.com/vertex-ai/generative-ai/docs/image/subject-customization)
- [Vertex AI release notes](https://docs.cloud.google.com/vertex-ai/generative-ai/docs/release-notes)
