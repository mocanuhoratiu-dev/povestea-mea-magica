# Colectie compacta si texte aliniate

## Modificari

- FAQ foto reutilizeaza cerintele formularului, inclusiv conversia HEIC/HEIF
  pe dispozitiv si limitele de dimensiune.
- FAQ print si Livrare digitala mentioneaza diplomele orizontale ale ambelor kituri.
- Homepage: livrarea PDF, personalizarea si excluderea tiparirii sunt explicate
  o singura data, inaintea colectiei. Fiecare produs pastreaza coperta intreaga,
  continutul esential, pretul, tipul real de mostra si legatura catre produs.
- Caietul de 5 pagini inclus in poveste ramane diferentiat explicit de Dosar.
- Pachetul pastreaza pretul, economia, alegerea copiilor diferiti si mostra.
- Ofertele complete de pe paginile produselor si preturilor nu sunt modificate.

## Masuratori locale

Chrome, 390 x 844, aceleasi fonturi, miscare redusa:

| Element | Inainte | Dupa | Reducere |
| --- | ---: | ---: | ---: |
| Colectie homepage | 2770 px | 1628 px | 41,2% |
| Homepage | 10953 px | 9812 px | 10,4% |

Lungimea paginii nu reprezinta un scor de performanta sau o dovada de conversie.

## Verificari

- 181 teste automate trecute; testele noi reluate dupa corectia de tip TypeScript.
- 57 verificari UI existente: oferte, mostre, editarea pachetului si Lumi.
- `scripts/qa-compact-collection.mjs`: 320, 390, 768 si 1440 px; fara depasiri
  orizontale, suprapuneri intre elementele produselor sau decuparea imaginilor.
- Preturile, continutul minim, mostrele si accesul la informatiile complete verificate.
- API-urile simulate: fara generari, comenzi, plati sau emailuri.

Configuratia Cloud Run, counterul si Stripe nu sunt schimbate de aceasta iteratie.
