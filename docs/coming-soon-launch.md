# Pagina de lansare: 18 septembrie 2026

## Status

Pregatita in copie de lucru separata, de la commitul GitHub `bba24d0`.
Nu este publicata. Nu a fost activat niciun gate pe Cloud Run.
Nu sunt modificate homepage-ul, produsele, plata, generarea sau livrarea.

Preview local: `http://127.0.0.1:3016/in-curand`.

## Acces privat pentru proprietar

- Pagina de autentificare este `/acces-preview`. Nu este afisata in navigatia publica.
- Parola este verificata pe server cu scrypt si salt aleator. In configuratie se
  pastreaza doar hash-ul, nu parola in clar.
- Sesiunea semnata dureaza 8 ore, fara prelungire automata. Cookie-ul de productie
  este `__Host-pmm-launch-preview`, Secure, HttpOnly, SameSite=Lax, Path=/,
  fara Domain. Parola, hash-ul si secretul nu sunt trimise in codul browserului.
- `/acces-preview` permite si deconectarea, prin POST. Alte file deschise verifica
  sesiunea la revenire in fila si cel mult o data pe minut cat timp accesul este activ.
- Un browser neautentificat, inclusiv incognito, vede countdown-ul. Un parametru
  `preview=true` sau un cookie nesemnat nu deblocheaza site-ul.
- Raspunsurile private sunt no-store si noindex. Pagina de autentificare este noindex.
- Formularul functioneaza si fara JavaScript. Sunt validate originea cererii,
  destinatia dupa autentificare si marimea formularului (maximum 4 KiB).
- Limita de login este 8 incercari / 15 minute / adresa, per instanta Cloud Run.
  Este o protectie suplimentara, nu un rate limit distribuit. Pentru trafic ostil,
  regula edge trebuie aplicata si pe `/acces-preview`.
- Rotirea hash-ului sau a secretului invalideaza toate sesiunile. Deconectarea
  sterge cookie-ul browserului; nu exista o lista centrala de revocari individuale
  pentru o eventuala copie furata a unui token. Acesta expira in maximum 8 ore.
- Dupa termenul lansarii, accesul public nu mai depinde de parola sau sesiune.

### Proba locala

```sh
node --experimental-strip-types scripts/prepare-preview-access.mjs
node node_modules/next/dist/bin/next build
node scripts/start-coming-soon-preview.mjs --private
```

Parola generata este in `.preview/acces-privat.txt`; configuratia serverului in
`.preview/private-access.json`. Fisierele sunt ignorate de Git, cu permisiuni 0600,
intr-un director 0700. Sunt excluse si din contextul Docker si din upload-ul Cloud
Build. Scriptul nu le suprascrie la fiecare pornire.

Pe HTTP local folosim un cookie separat, permis numai cu
`LAUNCH_PREVIEW_ALLOW_LOCAL_HTTP=true`, pe loopback, in afara Cloud Run/Vercel.
Nu activa aceasta variabila in productie. Portul poate fi schimbat prin
`PREVIEW_PORT`; fisierul cu parola mentioneaza portul implicit 3016.

### Configurare Cloud Run, numai dupa aprobare

Configureaza in Secret Manager valorile `LAUNCH_PREVIEW_PASSWORD_HASH` si
`LAUNCH_PREVIEW_SESSION_SECRET`, apoi ataseaza-le ca variabile secrete la ambele
servicii. Foloseste aceleasi valori, ca autentificarea sa functioneze indiferent de
instanta. Secretul sesiunii trebuie sa aiba 32 de octeti aleatori, codificati hex.
Scriptul de pregatire locala genereaza valori in formatul corect. Nu copia parola
sau secretele in Git, in URL-uri sau in comenzi care ajung in istoricul shellului.

Testeaza autentificarea pe domeniul HTTPS inainte de a activa gate-ul. Configuratia
absenta sau invalida refuza accesul privat; nu deschide site-ul pentru public.
Aceasta implementare nu a creat secrete si nu a modificat servicii Google Cloud.

## Comportament

- `LAUNCH_GATE_ENABLED` este dezactivat implicit. Nu se activeaza doar prin deploy.
- Cu valoarea `true`, paginile publice afiseaza temporar pagina de lansare.
- Termen: `2026-09-18T18:00:00+03:00`, adica `2026-09-18T15:00:00Z`.
- Fiecare cerere este verificata pe server. La termen, gate-ul inceteaza automat,
  chiar daca variabila ramane `true`. Nu trebuie programat un al doilea deploy.
- Un browser deja deschis isi sincronizeaza countdown-ul cu serverul. Cand serverul
  confirma lansarea, reincarca acelasi URL, pastrand query-ul si fragmentul.
  Durata efectiva a incarcarii depinde de conexiune si disponibilitatea serverului.
- Timpul afisat nu depinde de fusul orar sau de ceasul gresit al telefonului.
- Raspunsurile temporare si endpoint-ul ceasului sunt `no-store` pentru browser/CDN.
- API-urile, Stripe webhook, workerii, health check, paginile juridice si contactul
  raman accesibile. Gate-ul este o prezentare temporara, nu o metoda de securizare
  a API-urilor. Protectiile existente pentru API nu sunt modificate.
- Linkurile de livrare pentru album si pachet raman accesibile. Pentru Scut si
  Explorator, care livreaza pe paginile produselor, este validat tokenul semnat al
  comenzii inainte de exceptie. Un query `preview=true` nu ofera acces.
- Calendarul este un fisier .ics descarcat numai la cererea vizitatorului. Nu se
  inscrie automat nimeni si nu este adaugat un serviciu nou de email sau tracking.

## Dupa aprobarea vizuala

1. Verifica daca `main` a avansat fata de `bba24d0`. Integreaza patch-ul fara a
   suprascrie modificarile noi ale site-ului. Testeaza si publica noul container
   cu mecanismul de lansare inca dezactivat.
2. Verifica pagina `/in-curand` pe domeniu si serviciul existent. Pastreaza
   reviziile anterioare disponibile pentru rollback.
3. Numai dupa aprobarea activarii, seteaza pe AMBELE servicii Cloud Run:

```text
LAUNCH_GATE_ENABLED=true
LAUNCH_AT=2026-09-18T18:00:00+03:00
```

Servicii: `povestea-mea-magica` (`europe-west3`) si
`povestea-mea-magica-domain` (`europe-west1`), proiectul
`project-e0c2efff-d456-48f9-9fe`.

Foloseste `--update-env-vars`, nu `--set-env-vars`, pentru a nu sterge setarile
Stripe, email, modele si worker. Scriptul existent de deploy foloseste update si
va pastra variabilele gate-ului la urmatoarele versiuni.

4. Verifica domeniul principal, domeniul fara www si URL-urile Cloud Run, pe
   desktop/mobil, inclusiv linkurile din reclame catre fiecare produs.
5. Daca exista cache HTML cu reguli personalizate in Cloudflare, goleste-l la
   activare si verifica respectarea `Cache-Control: no-store`. Cache-ul pentru
   imagini/fonturi poate ramane activ.
6. La lansare, verificarea de timp din aplicatie lasa sa se afiseze versiunea
   completa din acelasi container. Orice imbunatatiri ale site-ului trebuie sa
   fie deja testate si incluse in containerul servit inainte de ora 18:00.
7. Dupa lansare se poate seta `LAUNCH_GATE_ENABLED=false`, ca operatiune de
   curatenie. Nu este o conditie pentru redeschidere.

Nu este necesar Cloud Scheduler, nici un task Codex. Disponibilitatea Cloud Run,
configuratia Stripe si eventualele restrictii externe raman independente de timer.

## Teste

- `node --experimental-strip-types --test tests/launch-gate.test.ts`
- `node --experimental-strip-types --test tests/launch-preview.test.ts`
- `node --experimental-strip-types --test tests/*.test.ts`
- `node node_modules/next/dist/bin/next build`
- `node scripts/qa-coming-soon.mjs`: Chrome, 7 ecrane, imagini, layout, fonturi,
  countdown, calendar, ancore, fus orar diferit si ceas de dispozitiv gresit.
- `node scripts/qa-launch-transition.mjs`: server local de test pe 3017, cu un
  termen accelerat. Verifica gate, tokenuri de livrare, webhook neinterceptat,
  redeschidere automata si pastrarea UTM/hash. Nu apeleaza API-uri AI sau Stripe.
- `node --experimental-strip-types scripts/qa-preview-access.mjs`: server local
  separat pe 3018, login corect/respins, cookie semnat, expirare, CSRF, redirecturi,
  limita de incercari, mobil/desktop, sesiuni separate, logout intre file si
  formular fara JavaScript. Nu apeleaza servicii AI, Stripe sau email.

`LAUNCH_AT` poate fi suprascris pentru teste locale. Data si calendarul din
prezentarea publica sunt cele aprobate pentru 18 septembrie, nu un CMS de evenimente.
