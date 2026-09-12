# Alerte operationale V2

Aplicate direct in proiectul `project-e0c2efff-d456-48f9-9fe` pe 12 septembrie 2026. Nu necesita redeploy Cloud Run.

## Ce era gresit

- Orice 5xx, inclusiv o singura incercare recuperata, putea trimite email imediat.
- P99 peste 30 secunde includea generarea AI si workerii, fara persistenta sau volum minim.
- Alerta AI urmarea evenimentele din prima versiune si nu distingea un model principal esuat de un rezultat recuperat prin fallback.
- Nu exista verificare externa de disponibilitate a site-ului.
- Notificarile Google mergeau la Gmail, nu la adresa actuala office.

In ultimele 48 de ore, filtrul nou pentru pagini/checkout a gasit 2.509 cereri, toate sub HTTP 400, P95 0,138 secunde si maximum 3,451 secunde. Acestea sunt cereri HTTP, inclusiv verificari automate, NU vizitatori unici si NU generari.

## Reguli active

| Regula | Conditie | Confirmare |
| --- | --- | --- |
| Erori repetate Cloud Run | Minimum 5 raspunsuri 5xx/10 minute SI peste 10% erori in acelasi serviciu | 5 minute |
| Site sau checkout lent | P95 peste 8 secunde, minimum 20 cereri/10 minute | 10 minute |
| Generari indisponibile dupa rezerve | Minimum 3 evenimente finale de indisponibilitate/15 minute | 5 minute |
| Facturare sau notificari indisponibile | Configuratie/billing blocant sau imposibilitatea de a trimite notificari operationale | Imediat, cel mult o notificare/6 ore |
| Site indisponibil | `/api/health` esueaza din cel putin 2 locatii | 10 minute |
| Watchdog fara executie reusita | Lipseste semnalul unei executii Scheduler HTTP 2xx | 60 minute |

Regulile Cloud Run includ ambele servicii PMM si agrega reviziile. Latenta urmareste paginile principale si checkout-ul, nu generarea, polling-ul, documentele sau workerii. Alerta AI numara evenimente finale, nu neaparat comenzi distincte; retry-urile unui model, respingerile de continut/calitate si fallback-urile reusite nu o declanseaza singure.

Uptime verifica HTTPS, certificatul TLS si `"ready":true`, la fiecare 5 minute, din Europa, Virginia si Asia-Pacific. Foloseste un GET public si nu genereaza continut AI.

Watchdog-ul ramane programat la 10 minute. Masurarea provine din logurile Scheduler, pe o resursa stabila, fara alarme false la schimbarea reviziilor Cloud Run. Alerta de absenta necesita o prima masuratoare reala dupa instalare; ulterior poate detecta lipsa executiilor. Nu este un test de livrare efectiva a unei comenzi.

## Notificari si costuri

- Canal Google actualizat la **office@povestea-mea-magica.ro**, activ, fara stare `UNVERIFIED`.
- Notificari la deschiderea incidentelor, fara remindere periodice si fara email de inchidere.
- Notificarile individuale ale comenzilor prin Resend, recuperarea comenzilor si raportul zilnic la 09:00 nu au fost modificate.
- Bugetul existent de **100 USD/luna** si pragurile **50%, 80%, 100%** au ramas identice. El foloseste acelasi canal de notificare, acum office.
- Bugetul acopera contul de facturare, nu doar acest proiect, si include deducerea creditelor. Este o alerta de cheltuieli, NU un plafon care opreste consumul.
- Nu au fost schimbate cotele Vertex, modelele, limitele de generare, Stripe sau accesul clientilor.

## Verificare si operare

- 7 teste automate pentru scope, praguri, volum minim, filtre AI, uptime, watchdog si frecventa notificarilor.
- API-ul Google a acceptat si a returnat cele 6 politici ca valide si active.
- Verificarea live la 13:53, ora Romaniei: metricile de cereri si latenta primesc puncte, watchdog-ul are o executie reusita recenta, iar verificarile externe sunt verzi in Belgia, Virginia si Singapore. Dovada locala: `/private/tmp/pmm-alert-audit-20260912/live-verification.json`.
- Politicile vechi au fost actualizate pe aceleasi ID-uri. Cele 3 politici suplimentare sunt create idempotent, fara stergere generala.
- Bugetul a fost recitit dupa modificari si comparat integral cu copia initiala: neschimbat.
- Nu s-au injectat erori artificiale in productie si nu s-a simulat trimiterea unui email Google. Confirmarea primirii in inbox este separata de configurarea canalului.
- Metricile noi nu completeaza retroactiv istoricul. Primele puncte apar dupa trafic/executii reale si intarzierea de colectare Google.

Comenzi din radacina proiectului, cu Node si gcloud autentificat. Seteaza `GCLOUD_BIN` la calea SDK-ului daca nu folosesti instalarea locala curenta:

```sh
node --test scripts/alert-v2-config.test.mjs
node scripts/provision-alerts-v2.mjs
node scripts/provision-alerts-v2.mjs --apply
node scripts/verify-alerts-v2.mjs
node scripts/verify-alerts-v2.mjs --require-live
```

Fara `--apply`, provisionarea salveaza planul si inventarul fara sa schimbe reguli. Copia dinaintea acestei migrari: `/private/tmp/pmm-alert-rollout-2026-09-12T10-46-34.602Z`. Pastrati copiile private: contin configuratie operationala si destinatari. Pentru revenire restaurati selectiv campurile politicii afectate, nu toate regulile din proiect.

Consola: [Cloud Monitoring Alerts](https://console.cloud.google.com/monitoring/alerting?project=project-e0c2efff-d456-48f9-9fe).

Documentatie: [politici prin API](https://docs.cloud.google.com/monitoring/alerts/policies-in-api), [absenta masuratorilor](https://docs.cloud.google.com/monitoring/alerts/metric-absence), [verificari externe](https://docs.cloud.google.com/monitoring/uptime-checks), [loguri Scheduler](https://docs.cloud.google.com/scheduler/docs/viewing-logs).
