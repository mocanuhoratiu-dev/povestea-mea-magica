# PLAN.md - Povestea Mea Magica

## Obiectiv curent

Lansarea comerciala a unei colectii premium cu trei produse digitale:

1. **Povestea Magica** - carte ilustrata personalizata, 16 pagini A5 landscape, audio si caiet separat de activitati.
2. **Scutul de Noapte** - ritual personalizat de seara, 6 pagini A4.
3. **Trusa de Rabdare** - activitati personalizate pentru asteptare, 7 pagini A4.

Pachetul Complet contine toate cele trei produse si patru PDF-uri. Pretul aprobat este 79 lei, fata de 97 lei cumparate separat.

## Starea produsului

### Povestea Magica

- configurator complet pentru personaj, lume, companion, persoana apropiata, tema, atmosfera, stil, context si dedicatie;
- descriere vizuala sau fotografie optionala, cu acord explicit;
- Story Bible V3 si Character Lock bazat pe coperta aprobata;
- 13 scene ilustrate distinct, plus coperta, dedicatie si coperta finala;
- verificare tehnica si editoriala a imaginilor;
- preview privat inainte de plata: coperta si doua pagini interioare, cu watermark;
- flipbook final, naratiune in romana si doua PDF-uri;
- caiet separat cu colorat, labirint si joc de diferente;
- limite explicite de apeluri si cost pentru fiecare comanda.

### Scutul de Noapte V2

- 6 pagini personalizate;
- ritual, reteta simbolica, card pentru noptiera si certificat;
- plan practic pentru parinte;
- calendar pentru sapte seri;
- continut adaptat fricii si reperelor alese de familie.

### Trusa de Rabdare V2

- 7 pagini A4, redesenate pentru citire si print;
- activitati adaptate varstei, locului, duratei si intereselor;
- Radarul de observatie are titlu si instructiuni clare;
- raspunsuri separate pentru parinte si diploma finala;
- continutul mai lung curge pe pagini dedicate, fara depasirea cadrului.

### Lumi

- ghid in 8 pasi pentru construirea Povestii Magice;
- intrebarile sunt adresate parintelui, fara raspunsuri puse in gura utilizatorului;
- toate alegerile sunt transferate in configurator numai dupa confirmare;
- flow optimizat pentru mobil si desktop, cu scroll propriu si fereastra compacta;
- voce Aoede si control audio comun, astfel incat doua naratiuni sa nu se suprapuna.

## Arhitectura de productie

- **Cloud Run** gazduieste site-ul si API-urile.
- **Vertex AI** genereaza textul, imaginile si verificarea editoriala.
- **Cloud Tasks** continua preview-ul si comenzile dupa inchiderea paginii.
- **Firestore** pastreaza starea comenzilor.
- **Cloud Storage** pastreaza temporar imaginile, PDF-urile si audio-ul privat.
- **Stripe Checkout** proceseaza plata si codurile promotionale.
- **Resend** trimite linkul securizat de livrare.
- **SmartBill** emite factura cand integrarea este activata.
- **Cloud Logging/Monitoring** primeste telemetrie fara continutul familiei.

## Performanta si cost

- preview-ul reutilizeaza coperta si primele doua scene in cartea platita;
- Scutul si Trusa din Pachetul Complet sunt generate in paralel;
- imaginile albumului raman secventiale pentru consistenta vizuala si evitarea limitelor Vertex;
- retry-urile au pauze progresive si timeout-uri suficient de lungi pentru a evita dublarea inutila a apelurilor;
- o comanda de album este oprita inainte sa depaseasca plafonul configurat de 2,50 USD;
- limita publica implicita este de 4 preview-uri de album per IP in 24 de ore;
- protectia de la aplicatie ramane completata de WAF/rate limiting la edge.

## Verificari obligatorii inainte de fiecare deploy

1. TypeScript, ESLint, testele automate si build-ul Next.js trebuie sa treaca.
2. Se verifica pe mobil si desktop homepage-ul si fiecare configurator.
3. Se genereaza local cate un Scut si o Trusa si se verifica toate paginile.
4. Se verifica flow-ul Lumi pana la transferul complet in configurator.
5. In Stripe test mode se parcurg checkout-ul, webhook-ul, generarea, PDF-urile, audio-ul, emailul si livrarea.
6. Dupa deploy se verifica `/api/health`, domeniul public si starea noii revizii Cloud Run.

## Activarea platilor live

Platile live se activeaza numai dupa:

- cont Stripe complet si cont bancar confirmat;
- chei Stripe live salvate in Secret Manager;
- webhook live verificat;
- SmartBill mutat din seria si datele de test pe datele fiscale finale;
- o comanda reala de valoare mica verificata cap-coada;
- alerte de eroare, latenta si buget active.

## Ordinea urmatoarelor imbunatatiri

1. Date reale despre rata de succes, durata si cost pentru primele comenzi.
2. Ajustarea prompturilor pe baza feedback-ului real, fara schimbarea structurii aprobate.
3. Mostre noi, realizate numai din comenzi pentru care exista acord de publicare.
4. Pregatirea variantei tiparite si a fisierelor de tipar dupa alegerea furnizorului.
