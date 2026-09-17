# Mobile si fotografii: verificare 17 septembrie 2026

## Modificari

- Sectiuni secundare mai compacte pe mobil: proces, incredere, testimoniale,
  FAQ si explicatiile dinaintea configuratorului. Preturile, continutul ofertei,
  mostrele si diferenta caiet/Dosar raman vizibile.
- Incarcare foto cu explicatie scurta si detalii tehnice intr-un `details`.
  Consimtamantul nu este ascuns in sectiunea extensibila.
- HEIC/HEIF convertit local, intr-un worker incarcat la nevoie. JPG normalizat,
  fara metadatele originale; analiza AI necesita in continuare acord explicit.
- Anulare, timeout de 45 secunde, reluare, erori explicite si limite pastrate.

## Masuratori

Chrome, viewport 390 x 844, aceleasi fonturi si miscare redusa:

| Pagina | Inainte | Dupa | Reducere |
| --- | ---: | ---: | ---: |
| Homepage | 11872 px | 10953 px | 7,7% |
| Povestea Magica | 10167 px | 9135 px | 10,2% |

Lungimea paginii nu este un scor Lighthouse si nu demonstreaza conversie comerciala.

## Probe

- 179 teste automate trecute; 16 teste focalizate reluate dupa ultimele corectii.
- 57 verificari UI la 320, 390 si 1440 px.
- 15 scenarii foto/tastatura simulata in WebKit si Chrome.
- HEIC real sintetic decodat in Chrome si WebKit, in toate cele patru formulare.
- Verificare dimensiuni si orientare prin cele patru cadrane colorate.
- HEIF generic `mif1` fara MIME, fisier corupt, limita de bytes/pixeli, refuzul
  secventelor animate, anulare, timeout si reusita la reincercare.
- Conversia verificata si cu CSP de productie, fara `unsafe-eval`, pe HTTPS local.
- API-urile simulate: nicio fotografie trimisa la AI, nicio comanda sau plata.

Rulare: `scripts/qa-mobile-photo.mjs`, `scripts/qa-offer-experience.mjs`,
`scripts/qa-heic.mjs`. Ultimul accepta si HTTPS local pentru proba CSP in WebKit.

## Ramane separat

Nu am testat un iPhone/Android fizic, selectorul nativ de poze ori fotografii
reale din mai multe generatii de iPhone. Checklist: `uat-telefoane-reale.md`.
Fisierele HEIF necompatibile trebuie sa ofere alternativa exportului in JPG,
nu sa consume o generare AI.

Modificarile nu schimba counterul, Stripe, modelele AI sau preturile.
