export const faqs = [
  {
    question: "Cum aleg materialul potrivit?",
    answer: "Povestea Magică este cartea ilustrată în care copilul devine eroul aventurii. Atelierul Scutului Magic construiește un ritual blând în jurul unei temeri, iar Dosarul Micului Explorator aduce activități pentru drum, restaurant, medic sau alte așteptări.",
  },
  {
    question: "Ce primesc?",
    answer: "Povestea Magică include o carte ilustrată de 16 pagini și un caiet separat de 5 pagini. Atelierul Scutului Magic are 13 pagini de poveste și ritual, cu diploma, rețeta imaginară și etichetele împreună la final, plus audio cu Lumi. Dosarul Micului Explorator are 10 pagini de misiuni și jocuri. Primești materiale digitale, pe care le poți salva și imprima.",
  },
  {
    question: "Este personalizat cu adevărat?",
    answer: "Da. Numele, vârsta, aspectul, lumea, personajele apropiate și ideea familiei schimbă atât firul poveștii, cât și imaginile. Poți porni de la o descriere sau de la o fotografie și poți adăuga o dedicație personală.",
  },
  {
    question: "Cât durează?",
    answer: "Pregătirea durează câteva minute și poate dura mai mult pentru Povestea Magică, unde fiecare scenă este ilustrată separat. Timpul variază în funcție de solicitări și de verificări. Nu trebuie să păstrezi pagina deschisă după confirmarea comenzii: îți trimitem linkul pe email când materialul este gata.",
  },
  {
    question: "Pot modifica ceva înainte de PDF?",
    answer: "Da. Pentru Povestea Magică răsfoiești înainte de plată coperta și două pagini interioare personalizate, cu un marcaj discret. Dacă schimbi alegerile, poți crea o mostră nouă. Coperta confirmată devine reperul vizual al personajului în întreaga carte. Pentru Atelier și Dosar vezi stilul și numele pe o copertă orientativă; ilustrațiile personalizate sunt create după plată.",
  },
  {
    question: "Pot printa materialele?",
    answer: "Da. Povestea Magică și caietul de activități folosesc format A5 orizontal. Atelierul și Dosarul sunt A4; diploma Atelierului este orizontală. Le poți imprima acasă sau la un centru de print. Comanda de pe site nu include un exemplar tipărit.",
  },
  {
    question: "Care sunt prețurile?",
    answer: "Povestea Magică costă 59 lei. Atelierul Scutului Magic și Dosarul Micului Explorator costă câte 19 lei. Pachetul Complet le include pe toate la 79 lei, în loc de 97 lei. Prețul final este afișat înainte de plata securizată.",
  },
  {
    question: "Sunt materialele un sfat medical sau terapeutic?",
    answer: "Nu. Sunt povești, activități și ritualuri de joacă. Dacă o teamă sau o situație este intensă ori persistă, cel mai potrivit este să discuți cu un specialist.",
  },
] as const;

export const faqGroups = [
  { id: "inainte-de-comanda", title: "Înainte de comandă", questions: [
    { id: "alegere", ...faqs[0] }, { id: "ce-primesc", ...faqs[1] }, { id: "preturi", ...faqs[6] },
    { id: "editie-digitala", question: "Primesc o carte tipărită?", answer: "Deocamdată primești ediția digitală, nu o carte prin curier. PDF-urile se pot citi pe ecran și se pot imprima. Variantele tipărite vor fi anunțate separat." },
  ] },
  { id: "personalizare", title: "Personalizare și mostre", questions: [
    { id: "personalizat", ...faqs[2] }, { id: "modificari", ...faqs[4] },
    { id: "limita-mostre", question: "Câte mostre pot crea?", answer: "Numărul de variante disponibile și cele rămase sunt afișate în pasul Mostra. Limita se aplică unui interval de 24 de ore și include variantele create după schimbarea detaliilor. Poți reveni la mostrele păstrate în același browser, cât timp sunt disponibile, fără să creezi una nouă." },
  ] },
  { id: "plata-si-livrare", title: "Plată și livrare", questions: [
    { id: "durata", ...faqs[3] },
    { id: "email-neprimit", question: "Nu am primit emailul. Ce fac?", answer: "Verifică folderul Spam sau Promoții și adresa folosită la comandă. Dacă ai încă pagina de confirmare, poți verifica de acolo progresul livrării. Dacă nu găsești materialul, scrie-ne de la adresa comenzii, cu numărul ei sau data aproximativă. Nu plasa încă o comandă doar pentru a primi din nou emailul." },
    { id: "acces", question: "Cât timp pot deschide materialele?", answer: "Linkul de livrare este valabil 30 de zile. Descarcă PDF-urile în acest interval și păstrează-le pe dispozitivul tău. Mostra personalizată are un link separat, valabil 24 de ore." },
    { id: "print", ...faqs[5] },
    { id: "probleme", question: "Ce fac dacă materialul are o problemă?", answer: "Scrie-ne ce nu funcționează și menționează comanda. Verificăm situația și încercăm refacerea sau relivrarea fără cost suplimentar. Detaliile privind rambursarea sunt explicate în politica de rambursare." },
  ] },
  { id: "fotografii-si-date", title: "Fotografii și date", questions: [
    { id: "fotografie", question: "Este obligatorie fotografia copilului?", answer: "Nu. Toate cele trei produse pot porni din descriere sau dintr-o fotografie, cu permisiunea necesară. Analizăm trăsăturile vizibile, apoi confirmi personajul ilustrat. Folosește JPG, PNG sau WebP de maximum 10 MB / 40 megapixeli și minimum 512 × 512 px, cu un singur copil și fața vizibilă. Fotografia originală nu apare în material. Asemănarea este interpretată artistic, nu garantată identic în fiecare pagină." },
    { id: "stergere", question: "Cum cer ștergerea datelor?", answer: "Ne poți scrie la office@povestea-mea-magica.ro de la adresa folosită la comandă. Fotografiile și materialele sunt păstrate privat și au termene automate de ștergere, explicate în politica de confidențialitate." },
    { id: "rolul-adultului", ...faqs[7] },
  ] },
] as const;
