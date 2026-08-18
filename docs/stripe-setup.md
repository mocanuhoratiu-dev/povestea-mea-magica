# Stripe: activare plati

Integrarea foloseste Stripe Checkout, gazduit de Stripe. Cheile private si semnatura webhookului nu ajung niciodata in browser sau in Git.

## Ce este deja implementat

- `POST /api/checkout` valideaza produsul si pretul exclusiv pe server.
- `POST /api/stripe-webhook` verifica semnatura Stripe folosind corpul brut al cererii.
- Catalogul comercial este in `src/lib/catalog.ts`, cu sume in bani (RON).
- Plata este oprita implicit prin `NEXT_PUBLIC_STRIPE_ENABLED=false`.
- Stripe Checkout cere acceptarea Termenilor și afișează acordul pentru livrarea imediată a materialului digital. Webhookul nu pornește livrarea fără confirmarea acestui consimțământ de la Stripe.
- Stripe Checkout afișează câmpul pentru coduri promoționale. Reducerile sunt validate și calculate exclusiv de Stripe.
- Comenzile reduse la 0 RON sunt acceptate și livrate după confirmarea semnată de Stripe cu statusul `no_payment_required`.

## Conditii inainte de activare

Nu seta `NEXT_PUBLIC_STRIPE_ENABLED=true` pana nu exista:

1. Cont Stripe verificat, cont bancar asociat si setari fiscale finalizate.
2. Firestore, Cloud Tasks, Cloud Storage si secretele de mai jos configurate in proiect.
3. Un test reusit de generare/livrare pe email dupa confirmarea platii.
4. URL-ul public al Termenilor este configurat în Stripe Dashboard: `https://www.povestea-mea-magica.ro/termeni-si-conditii`.
5. Teste Stripe in test mode: plata reusita, plata esuata, webhook repetat, acceptarea termenilor si email livrat.
6. Teste pentru codurile promoționale: cod valid, cod expirat, limită de utilizări atinsă și reducere de 100%.
7. Politica de rambursare, date de facturare si emailul comercial verificate juridic.

Aplicatia salveaza configuratia aleasa in Firestore inainte de Checkout. Dupa plata, webhookul pune o sarcina in Cloud Tasks; workerul genereaza materialul, pastreaza coperta privata in Cloud Storage si trimite emailul cu un link semnat. Linkul redeschide template-ul existent pentru previzualizare si descarcare PDF. Nu trimitem datele copilului in Stripe metadata.

## Pregatirea livrarii dupa plata

Varianta recomandata este scriptul idempotent din repository. Creeaza doar resursele lipsa, aplica TTL-ul Firestore, lifecycle-ul bucketului, permisiunile IAM si secretele interne ale comenzilor, fara sa activeze Stripe:

```bash
cd ~/povestea-mea-magica
git pull origin main
./scripts/provision-paid-orders.sh
```

Alternativ, daca ai nevoie sa rulezi manual fiecare pas, foloseste instructiunile de mai jos.

Ruleaza o singura data in Cloud Shell, dupa ce alegi un nume de bucket unic:

```bash
export PROJECT_ID="project-e0c2efff-d456-48f9-9fe"
export REGION="europe-west3"
export BUCKET="pmm-orders-${PROJECT_ID}"

gcloud services enable firestore.googleapis.com cloudtasks.googleapis.com storage.googleapis.com secretmanager.googleapis.com --project="$PROJECT_ID"
gcloud firestore databases create --location="$REGION" --project="$PROJECT_ID"
gcloud storage buckets create "gs://${BUCKET}" --location="$REGION" --uniform-bucket-level-access --project="$PROJECT_ID"
```

Activeaza TTL pentru campul `expiresAt` din toate documentele `orders`. Aplicatia pune comenzile neplatite la expirare dupa 24 de ore si comenzile platite la expirare dupa 31 de zile. Firestore elimina documentele expiratate automat; actiunea poate dura pana la aproximativ 24 de ore dupa momentul de expirare.

```bash
gcloud firestore fields ttls update expiresAt \
  --collection-group=orders \
  --enable-ttl \
  --project="$PROJECT_ID"
```

Pentru regula de stergere automata, creeaza `lifecycle.json` cu acest continut:

```json
{"rule":[{"action":{"type":"Delete"},"condition":{"age":31,"matchesPrefix":["orders/"]}}]}
```

Aplica apoi regula:

```bash
gcloud storage buckets update "gs://${BUCKET}" --lifecycle-file=lifecycle.json --project="$PROJECT_ID"
gcloud tasks queues create pmm-order-processing --location="$REGION" --max-attempts=5 --max-retry-duration=1h --project="$PROJECT_ID"
gcloud iam service-accounts create pmm-order-worker --display-name="PMM order worker" --project="$PROJECT_ID"
```

Service account-ul existent al site-ului are nevoie de acces la Firestore, Cloud Tasks si obiectele din bucket. Workerul Cloud Tasks are nevoie doar de dreptul de a invoca serviciile Cloud Run:

```bash
export APP_SA="povestea-mea-magica-ai@${PROJECT_ID}.iam.gserviceaccount.com"
export WORKER_SA="pmm-order-worker@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${APP_SA}" --role="roles/datastore.user"
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:${APP_SA}" --role="roles/cloudtasks.enqueuer"
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" --member="serviceAccount:${APP_SA}" --role="roles/storage.objectAdmin"
gcloud run services add-iam-policy-binding povestea-mea-magica --region=europe-west3 --member="serviceAccount:${WORKER_SA}" --role="roles/run.invoker"
gcloud run services add-iam-policy-binding povestea-mea-magica-domain --region=europe-west1 --member="serviceAccount:${WORKER_SA}" --role="roles/run.invoker"
```

Genereaza secretele o singura data. Nu le afisa si nu le adauga in `.env` versionat:

```bash
openssl rand -base64 48 | tr -d '\n' | gcloud secrets create pmm-order-access-secret --data-file=- --project="$PROJECT_ID"
openssl rand -base64 48 | tr -d '\n' | gcloud secrets create pmm-order-worker-secret --data-file=- --project="$PROJECT_ID"
```

Acorda aplicatiei acces strict de citire la secretele de comenzi:

```bash
for SECRET in pmm-order-access-secret pmm-order-worker-secret; do
  gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT_ID" \
    --member="serviceAccount:${APP_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

Ataseaza-le ambelor servicii, impreuna cu `ORDER_STORAGE_BUCKET`:

```bash
for SERVICE_REGION in "povestea-mea-magica:europe-west3" "povestea-mea-magica-domain:europe-west1"; do
  SERVICE="${SERVICE_REGION%%:*}"; REGION="${SERVICE_REGION##*:}"
  gcloud run services update "$SERVICE" --region="$REGION" --project="$PROJECT_ID" \
    --update-env-vars="ORDER_STORAGE_BUCKET=${BUCKET}" \
    --update-secrets="ORDER_ACCESS_SECRET=pmm-order-access-secret:latest,ORDER_WORKER_SECRET=pmm-order-worker-secret:latest"
done
```

## Configurare test mode

1. Creeaza produsele optional in Dashboard numai pentru rapoarte; aplicatia calculeaza preturile din catalogul server-side.
2. Salveaza `STRIPE_SECRET_KEY` in Secret Manager, de exemplu `stripe-secret-key`.
3. Pentru test local, adauga in `.env.local`:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_ENABLED=false
```

4. Instaleaza Stripe CLI local si asculta webhookul:

```bash
stripe listen --forward-to localhost:3010/api/stripe-webhook
```

5. Trimite un eveniment de test dupa ce serverul ruleaza:

```bash
stripe trigger checkout.session.completed
```

## Coduri promoționale

Codurile se administrează în Stripe Dashboard, fără modificări sau deploy-uri noi în aplicație:

1. Creează un **Coupon** cu reducerea dorită, procentuală sau valorică.
2. Creează peste acel coupon un **Promotion code**, adică textul introdus de client, de exemplu `LUMI10`.
3. Configurează data expirării și numărul maxim de utilizări.
4. Pentru colaboratori, folosește câte un cod distinct, astfel încât utilizările să poată fi urmărite separat în Stripe.
5. Testează codul în Stripe test mode înainte să îl recreezi în live mode. Obiectele și codurile din test mode nu se transferă automat în live mode.

Exemple recomandate:

| Scop | Cod | Reducere | Limită recomandată |
| --- | --- | --- | --- |
| Lansare | `MAGIE10` | 10% | 100 utilizări, 7 zile |
| Colaborator | `NUME15` | 15% | limită și expirare per colaborare |
| Cadou / test controlat | `POVESTECADOU` | 100% | 1-5 utilizări |

Nu publica un cod fără dată de expirare sau limită de utilizări. Pentru produsele actuale, codurile sunt generale. Restricțiile Stripe pe produse individuale necesită trecerea catalogului la produse și prețuri Stripe persistente.

## Configurare Cloud Run

Adauga secretele Stripe in Google Cloud Secret Manager si acorda aplicatiei acces strict de citire. Domeniul public este servit de `povestea-mea-magica-domain`, astfel incat configuratia trebuie sa fie identica pentru ambele servicii:

```bash
read -rsp "Stripe secret key: " STRIPE_SECRET_KEY; echo
printf '%s' "$STRIPE_SECRET_KEY" | gcloud secrets create stripe-secret-key --data-file=- --project="$PROJECT_ID"
unset STRIPE_SECRET_KEY

read -rsp "Stripe webhook secret: " STRIPE_WEBHOOK_SECRET; echo
printf '%s' "$STRIPE_WEBHOOK_SECRET" | gcloud secrets create stripe-webhook-secret --data-file=- --project="$PROJECT_ID"
unset STRIPE_WEBHOOK_SECRET

for SECRET in stripe-secret-key stripe-webhook-secret; do
  gcloud secrets add-iam-policy-binding "$SECRET" --project="$PROJECT_ID" \
    --member="serviceAccount:${APP_SA}" \
    --role="roles/secretmanager.secretAccessor"
done
```

Ataseaza apoi secretele ambelor servicii:

```bash
for SERVICE_REGION in "povestea-mea-magica:europe-west3" "povestea-mea-magica-domain:europe-west1"; do
  SERVICE="${SERVICE_REGION%%:*}"; REGION="${SERVICE_REGION##*:}"
  gcloud run services update "$SERVICE" --region="$REGION" --project="$PROJECT_ID" \
    --update-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest"
done
```

In Stripe Dashboard adauga endpointul live:

```text
https://www.povestea-mea-magica.ro/api/stripe-webhook
```

Selecteaza cel putin `checkout.session.completed`, `checkout.session.async_payment_succeeded` si `checkout.session.async_payment_failed`.

In **Settings → Public details**, setează URL-ul pentru Termeni și condiții:

```text
https://www.povestea-mea-magica.ro/termeni-si-conditii
```

Checkout-ul cere această acceptare înainte de plată. Mesajul de sub bifă explică livrarea imediată a materialului digital personalizat și condițiile privind retragerea.

## Activare comerciala

`NEXT_PUBLIC_STRIPE_ENABLED` este o setare compilata in aplicatia web. Dupa ce parcurgi toate testele de mai sus si Stripe este gata de productie, ruleaza deploy-ul cu Stripe activat. Scriptul transmite setarea atat la build, cat si la runtime, pentru ambele servicii Cloud Run:

```bash
cd ~/povestea-mea-magica
git pull origin main
STRIPE_ENABLED=true ./scripts/deploy-cloud-run.sh
```

Pentru a reveni la experiența gratuită fără plată, folosește `STRIPE_ENABLED=false` și rulează din nou același deploy.

## Date personale

Metadata Stripe contine numai codul produsului si versiunea catalogului. Numele copilului, textul povestii si alte campuri de personalizare nu trebuie trimise in Stripe metadata.
