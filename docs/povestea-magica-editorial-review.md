# Povestea Magica: actualizare editoriala

## Implementat

- Pagina de produs: scena reala full-bleed, oferta digitala explicita, o singura demonstratie principala cu flipbook si audio; fara repetarea galeriei si a clipului.
- Configurator: 11 lumi ilustrate, aspectul si fotografia grupate, rezumat dinamic, revenire la aspect dupa preview. Corectiile folosesc mecanismul existent de amprenta a configuratiei si limita zilnica de mostre.
- Mobil: Lumi flotanta dispare cat timp configuratorul este vizibil; ajutorul ramane disponibil prin butonul din formular. Navigare intre pasi cu date pastrate.
- PDF: font Crimson Text licentiat OFL, titluri masurate cu fontul final, text mai mare, ilustratii pastrate integral, compozitie aleasa dupa proportiile imaginii si lungimea textului, folio discret.
- Activitati: cinci diferente geometrice, inclusiv solutii pentru parinte. Nu se mai plateste o ilustratie AI separata pentru acest joc determinist.
- Control AI obligatoriu pentru imaginile noi: identitate minimum 85, poveste 75, tehnic 75; fara acceptare automata determinista sau dupa epuizarea incercarilor.
- Evaluatorul se reincearca de trei ori pe aceeasi imagine. Workerul salveaza imaginile in asteptarea QC in pendingImages, pastrand bugetele existente. Coperta initiala are aceste retry-uri in aceeasi cerere, nu persistenta intre cereri HTTP separate.

## Verificari

- 76 teste automate trecute, inclusiv indisponibilitatea QC, limitele de buget, pragurile si diferentele geometrice.
- TypeScript si build de productie trecute.
- Browser la 360, 390, 768 si 1440 px: fara overflow orizontal sau erori JavaScript; nume, varsta, aspect, selectie lume, revenire intre pasi si deschidere Lumi verificate.
- Mostra: 16 pagini de poveste si 5 de activitati randate pentru inspectie. Foloseste arta demo existenta, nu o noua comanda AI.

## Limite ale verificarii

Nu au fost efectuate in aceasta sesiune o plata Stripe, o livrare email sau o generatie completa live Vertex. Scorurile QC sunt evaluari probabilistice, nu o garantie ca toate ilustratiile sunt perfecte. Macheta finala PDF are verificari de incadrare; nu este trimisa ca pagina compusa la un al doilea evaluator semantic.

Modificarile sunt locale, nepublicate. Dupa publicare trebuie rulata o comanda Stripe test cu generare reala si verificata continuarea unui worker dupa o indisponibilitate QC.
