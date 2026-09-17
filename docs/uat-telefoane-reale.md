# Verificare finala pe telefoane reale

Status: NECONFIRMAT pe dispozitive fizice. Testele automate WebKit/Chromium sunt
simulari in browser; nu valideaza tastatura nativa, camera sau selectorul foto iOS/Android.

## Acces si siguranta

1. Deschide https://www.povestea-mea-magica.ro/acces-preview pe telefon.
2. Introdu parola privata existenta. Nu folosi localhost de pe telefon.
3. Verifica separat, intr-o fila privata fara autentificare, ca publicul vede counterul.
4. Stripe trebuie sa ramana TEST in aceasta etapa. Nu folosi date de card reale.
5. Pentru o fotografie reala, foloseste numai o imagine pentru care ai permisiunea
   necesara; acordul pentru analiza este separat de acordul pentru publicare.
6. Ascunde parola, emailul, fotografia si linkurile private din capturile de eroare.

## Matrice de verificat

| Telefon / browser | Versiune OS | Data | Rezultat |
| --- | --- | --- | --- |
| iPhone / Safari | de completat | de completat | netestat fizic |
| Android / Chrome | de completat | de completat | netestat fizic |

## Parcurgere (pentru fiecare telefon)

- [ ] Homepage, cele trei produse si pachetul: fara derulare orizontala.
- [ ] Langa pret este clar ca livrarea e digitala; caietul inclus are 5 pagini,
      iar Dosarul este un produs separat de 10 pagini.
- [ ] Completeaza numele "Stefan Luca" si apoi foloseste diacriticele tastaturii.
      Spatiile si caracterele raman dupa revenirea la pasul anterior.
- [ ] Deschide Lumi, scrie numele, inchide/redeschide tastatura. Campul, butonul
      pentru pasul urmator si inchiderea ferestrei raman accesibile.
- [ ] In Lumi, completeaza o lume proprie cu 2-3 propozitii; derularea ramane
      in fereastra, inclusiv cu tastatura deschisa. Incearca si landscape.
- [ ] Deschide galeria foto nativa: JPG, PNG sau WebP, minimum 512x512,
      maximum 10 MB / 40 megapixeli. Testeaza HEIC/HEIF din iPhone: conversie
      automata pe dispozitiv, indicator de pregatire si anulare. Pentru un fisier
      necompatibil, mesajul trebuie sa ofere alternativa exportului in JPG.
- [ ] Anuleaza alegerea fotografiei: datele deja scrise nu dispar.
- [ ] Alege o fotografie facuta vertical cu telefonul: nu apare rotita.
- [ ] Nu bifa acordul: analiza nu poate porni. Bifeaza doar cand doresti analiza.
- [ ] Decupeaza, apoi revizuieste trasaturile si confirma personajul.
- [ ] Scoate fotografia si continua prin descriere; numele ramane completat.
- [ ] Repeta incarcarea la Poveste, Atelier, Explorator si Pachet.
- [ ] In pachet, alege copii diferiti, revino si editeaza, apoi verifica rezumatul.
- [ ] Incearca acelasi flux pe Wi-Fi si date mobile. Noteaza timpul si mesajul
      exact al unei erori; nu relansa repetat daca serviciul cere o pauza.

## Ce acopera automatizarea locala

`scripts/qa-mobile-photo.mjs` verifica formatele, limitele, fisierele corupte,
orientarea EXIF, decuparea, acordul, reluarea dupa eroare, editarea trasaturilor,
confirmarea si eliminarea fotografiei, plus spatiul vizibil redus pentru Lumi.

Fotografiile sunt dreptunghiuri sintetice locale, iar raspunsurile AI sunt
simulate. Nu se trimit fotografii catre modele, nu se genereaza materiale, nu
se fac plati sau trimiteri email. Calitatea personajului, autentificarea Stripe,
livrarea reala si comportamentul tastaturii native raman teste separate.

## Raportarea unei probleme

Noteaza modelul telefonului, versiunea OS/browser, pagina si pasul exact,
orientarea ecranului, daca tastatura era deschisa si daca problema se repeta.
Pentru fotografii: doar tipul, dimensiunea si orientarea, nu fotografia in raport.
