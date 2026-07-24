# Operare Cloud Run, pas cu pas

Acesta este ghidul de operare fără Codex. Totul se face în **Google Cloud Console -> Cloud Shell**; nu ai nevoie de terminal local.

## Datele proiectului

| Câmp | Valoare |
| --- | --- |
| Proiect Google Cloud | `project-e0c2efff-d456-48f9-9fe` |
| Serviciu Cloud Run API/direct | `povestea-mea-magica` (`europe-west3`) |
| Serviciu Cloud Run al domeniului public | `povestea-mea-magica-domain` (`europe-west1`) |
| Service account | `povestea-mea-magica-ai@project-e0c2efff-d456-48f9-9fe.iam.gserviceaccount.com` |
| Site live | `https://www.povestea-mea-magica.ro` |
| Health check | `https://www.povestea-mea-magica.ro/api/health` |

## A. Prima intrare în Cloud Shell

1. Deschide [Google Cloud Console](https://console.cloud.google.com/) și selectează proiectul de mai sus.
2. Apasă **Activate Cloud Shell** din bara de sus.
3. În terminal, rulează:

```bash
git clone https://github.com/mocanuhoratiu-dev/povestea-mea-magica.git
cd povestea-mea-magica
```

Dacă folderul există deja, nu îl clonezi din nou. Rulezi doar:

```bash
cd ~/povestea-mea-magica
git pull --ff-only origin main
```

## B. Modifică un fișier și verifică-l

1. Apasă **Open Editor** în Cloud Shell.
2. Modifică fișierul dorit și salvează cu `Ctrl+S` sau `Cmd+S`.
3. Revino în terminal și verifică exact ce s-a schimbat:

```bash
git status --short
git diff --check
```

Nu pune niciodată chei API în Git, în `.env.example` sau într-un commit.

## C. Rulează verificările înainte de deploy

Din folderul repository-ului:

```bash
npm ci
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

Toate trebuie să se termine fără erori. Pentru o simplă corectură de text, `npm run lint` și `npm run build` sunt de obicei suficiente; pentru cod API rulează toate cele patru comenzi.

## D. Publică modificarea în GitHub

```bash
git add <fisierul-modificat>
git commit -m "Descrie pe scurt modificarea"
git push origin main
```

Înlocuiește `<fisierul-modificat>` cu calea reală, de exemplu `src/components/FAQ.tsx`. Evită `git add .` dacă nu ai verificat lista de fișiere.

## E. Deploy în Cloud Run

Din același folder:

```bash
bash scripts/deploy-cloud-run.sh
```

Scriptul construiește aplicația, actualizează atât serviciul direct, cât și serviciul conectat la domeniul public, trimite tot traficul către noile revizii și verifică `/api/health`. La final trebuie să vezi `ready: true`. Scriptul păstrează fiecare serviciu la maximum trei instanțe și patru cereri simultane pe instanță, pentru a ține costurile AI sub control.

## F. Testul live obligatoriu

După fiecare deploy, verifică endpointul:

```bash
curl -fsS https://www.povestea-mea-magica.ro/api/health
```

Apoi deschide site-ul într-o fereastră incognito și testează:

1. O poveste scurtă.
2. O poveste lungă.
3. Coperta personalizată.
4. Audio pentru poveste și Lumi.
5. Scutul de Noapte și Trusa de Răbdare.
6. Descărcarea PDF-urilor.
7. Emailul, după activare.
8. Domeniul fără `www`: trebuie să redirecționeze permanent către `https://www.povestea-mea-magica.ro`.

## G. Activează livrarea de PDF-uri prin email

Aplicația folosește Resend și nu trimite email până nu faci pașii de mai jos.

1. Creează cont în [Resend](https://resend.com/).
2. În **Domains**, adaugă `povesteamagica.ro` sau domeniul expeditor ales.
3. Copiază în DNS toate înregistrările cerute de Resend și așteaptă statusul **Verified**.
4. Creează o API key de trimitere. Nu o pune în editor, GitHub sau screenshot-uri.
5. În Cloud Shell, rulează comanda următoare și înlocuiește cheia dintre ghilimele:

```bash
PROJECT_ID=project-e0c2efff-d456-48f9-9fe
SERVICE=povestea-mea-magica-domain
REGION=europe-west1
SERVICE_ACCOUNT=povestea-mea-magica-ai@project-e0c2efff-d456-48f9-9fe.iam.gserviceaccount.com

printf %s 're_inlocuieste_cu_cheia_ta' | gcloud secrets create pmm-resend-api-key --project="$PROJECT_ID" --data-file=-
gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SERVICE_ACCOUNT" --role="roles/secretmanager.secretAccessor"
gcloud run services update "$SERVICE" --project="$PROJECT_ID" --region="$REGION" \
  --update-secrets RESEND_API_KEY=pmm-resend-api-key:latest \
  --update-env-vars EMAIL_FROM=povesti@povesteamagica.ro,EMAIL_REPLY_TO=contact@povesteamagica.ro
```

`EMAIL_FROM` trebuie să fie o adresă de pe domeniul verificat în Resend. Dacă secretul există deja și trebuie rotit, nu îl recreezi:

```bash
printf %s 're_cheia_noua' | gcloud secrets versions add pmm-resend-api-key --project=project-e0c2efff-d456-48f9-9fe --data-file=-
gcloud run services update povestea-mea-magica-domain --project=project-e0c2efff-d456-48f9-9fe --region=europe-west1 --update-secrets RESEND_API_KEY=pmm-resend-api-key:latest
```

Trimite apoi un PDF spre adresa ta și confirmă că ajunge cu atașamentul. Aplicația limitează fișierul la 9 MB, sub limita de 40 MB pentru un email cu atașamente la Resend.

## H. Urmărește erorile și utilizarea

În Google Cloud Console:

1. **Cloud Run -> povestea-mea-magica-domain -> Logs** pentru erori și etapele de generare de pe site-ul public.
2. **Monitoring -> Dashboards** pentru Vertex și metricile din [`analytics.md`](analytics.md).
3. **Billing -> Budgets & alerts** pentru o alertă sub creditul disponibil.

Filtru util în Logs Explorer:

```text
resource.type="cloud_run_revision"
resource.labels.service_name="povestea-mea-magica"
jsonPayload.event="pmm_story_cover_failed"
```

Înlocuiește evenimentul cu `pmm_story_text_completed`, `pmm_story_continuation_completed` sau `pmm_email_delivery_failed` pentru o etapă anume. Telemetria aplicației nu trimite nume de copil, povești, adrese de email sau atașamente.

## I. Rollback imediat

Înainte de o schimbare mare, notează revizia sănătoasă. Dacă o versiune nouă are probleme:

```bash
gcloud run revisions list --service=povestea-mea-magica-domain --project=project-e0c2efff-d456-48f9-9fe --region=europe-west1
gcloud run services update-traffic povestea-mea-magica-domain --project=project-e0c2efff-d456-48f9-9fe --region=europe-west1 --to-revisions=NUME_REVIZIE=100
```

Verifică `/api/health` și generează un PDF. Apoi repară în GitHub și redeployează normal; nu rezolva permanent probleme doar din revizia Cloud Run.

## Regula simplă

- Codul intră întâi în GitHub, apoi în Cloud Run.
- Cheile intră doar în Secret Manager sau variabile Cloud Run.
- Fiecare deploy este urmat de health check și un test real.
- Dacă un deploy nu e bun, rollback înainte de alte schimbări.
- Nu trimite traficul public spre URL-ul Cloud Run: acesta redirecționează către domeniul principal.
