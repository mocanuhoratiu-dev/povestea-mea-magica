# Diploma Micilor Descoperiri

Directia aprobata pe 12 septembrie 2026: **Harta care prinde viata**.

- Inlocuieste vechea pagina finala a Dosarului Micului Explorator.
- Dosarul ramane la 10 pagini: 9 A4 portret si diploma A4 orizontal.
- Compozitia aprobata, Lumi, peisajul pop-up si titlul decorativ sunt pastrate.
- Numele copilului nu este inclus in ilustratie: este text personalizat, escapat inainte de randare, cu diacritice si dimensionare pentru nume lungi.
- Ilustratia reutilizabila este un WebP de aproximativ 468 KiB. Nu necesita o noua generare AI la fiecare comanda.
- Modelul public, cititorul rezultatului, descarcarea si PDF-ul pentru email folosesc acelasi template.
- Diploma nu are subsol administrativ peste ilustratie. Watermark-ul ramane disponibil pentru previzualizarile care il solicita.
- PDF-urile trimise sau descarcate anterior nu se modifica retroactiv; noul model se aplica exporturilor ulterioare deploy-ului.

## Implementare

- `src/lib/kits/explorerKeepsake.ts`: nume si continutul paginii finale.
- `src/components/explorer-keepsake.css`: compozitie fixa, nume centrat, format A4.
- `public/examples/kits-v2/explorer-diploma-map.webp`: fundalul aprobat, fara nume.
- `scripts/prepare-explorer-diploma.mjs`: conversie din PNG-ul aprobat, fara crop.

Numele se afiseaza pe unul sau doua randuri. Numirea paginii si textul alternativ descriu diploma si pentru cititoarele de ecran. Grafica statica contine text decorativ; personalizarea nu este scrisa in imaginea-sursa.

## Verificare

`tests/explorer-diploma.test.ts` verifica numarul si orientarea paginilor, personalizarea, diacriticele, HTML escaping si protectia la depasirea cadrului.

`scripts/qa-premium-kits.mjs` verifica toate paginile, exporta PDF-ul complet si poate intercepta atasamentul de email cu `QA_EMAIL=1`. Nu trimite email real.

`scripts/qa-explorer-diploma.mjs` verifica sase nume (inclusiv limitele de 40 caractere), incadrarea la 360/390/768 px si deschiderea paginii marite. Poate fi rulat pe live cu `QA_BASE_URL` fara generare sau plata: datele comenzii sunt fixture-uri interceptate numai in browserul de test.

PDF-urile QA au fost randate separat pentru verificarea vizuala a diplomei. PDF-ul de descarcare are aproximativ 3,54 MB; atasamentul pentru email aproximativ 1,54 MB. Aceste dimensiuni sunt pentru modelul Raul, nu limite pentru toate comenzile.

Verificari locale inainte de publicare: 138 teste de aplicatie, 7 teste pentru alertele operationale, TypeScript, lint pe componentele modificate si build de productie. Toate au trecut. Browser QA: 6 nume, 3 latimi mobile/tableta, imagine vizibila in fereastra marita si zero depasiri la cele 10 pagini.
