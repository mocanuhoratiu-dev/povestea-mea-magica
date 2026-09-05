# Audit Lighthouse si Core Web Vitals

Data: 5 septembrie 2026

## Rezumat

Auditul Lighthouse a fost rulat pe pagina principala, atat pe versiunea publica existenta, cat si pe build-ul candidat pentru urmatoarea publicare. Masuratorile Lighthouse sunt teste de laborator; valorile reale vor fi agregate separat din sesiunile utilizatorilor dupa publicare.

| Mediu | Performance | Accesibilitate | Best Practices | SEO |
| --- | ---: | ---: | ---: | ---: |
| Site public, mobil | 85 | 94 | 96 | 100 |
| Build candidat, mobil | 88 | 100 | 100 | 100 |
| Site public, desktop | 98 | 94 | 96 | 100 |
| Build candidat, desktop | 98 | 100 | 100 | 100 |

## Indicatori de laborator

| Mediu | FCP | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: |
| Site public, mobil | 1,4 s | 3,4 s | 80 ms | 0 |
| Build candidat, mobil | 1,0 s | 3,8 s | 80 ms | 0 |
| Site public, desktop | 0,4 s | 1,1 s | 0 ms | 0 |
| Build candidat, desktop | 0,3 s | 1,1 s | 0 ms | 0 |

Comparatia de performanta dintre URL-ul public si serverul local este orientativa, deoarece reteaua, cache-ul si infrastructura sunt diferite. Semnalul sigur al acestei runde este eliminarea erorilor din consola, a problemelor Lighthouse de accesibilitate si a incarcarii Three.js inainte ca Lumi sa fie deschisa.

## Core Web Vitals din trafic real

Aplicatia trimite anonim `CLS`, `FCP`, `FID`, `INP`, `LCP` si `TTFB` prin evenimentul `pmm_web_vital_recorded`. Nu sunt trimise nume, adrese de email, continutul povestii sau alte date personale.

In Cloud Logging, filtrul de baza este:

```text
jsonPayload.event="pmm_web_vital_recorded"
```

Evaluarea de productie se face dupa minimum 7 zile de trafic, pe percentila 75, separat pentru mobil si desktop. Pragurile urmarite sunt:

- LCP: maximum 2,5 secunde;
- INP: maximum 200 milisecunde;
- CLS: maximum 0,1;
- FCP: maximum 1,8 secunde;
- TTFB: maximum 800 milisecunde.

## Actiuni dupa publicare

1. Verificare zilnica in primele trei zile pentru erori noi si valori evaluate `poor`.
2. Prima analiza p75 dupa 7 zile de trafic real.
3. Segmentare pe pagina si dispozitiv pentru orice indicator care depaseste pragul.
4. Repetarea Lighthouse dupa fiecare modificare majora de imagini, fonturi sau animatii.

Surse tehnice: [Next.js Web Vitals](https://nextjs.org/docs/app/guides/analytics), [Google Web Vitals](https://web.dev/articles/vitals).
