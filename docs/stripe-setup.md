# Stripe: activare plati

Integrarea foloseste Stripe Checkout, gazduit de Stripe. Cheile private si semnatura webhookului nu ajung niciodata in browser sau in Git.

## Ce este deja implementat

- `POST /api/checkout` valideaza produsul si pretul exclusiv pe server.
- `POST /api/stripe-webhook` verifica semnatura Stripe folosind corpul brut al cererii.
- Catalogul comercial este in `src/lib/catalog.ts`, cu sume in bani (RON).
- Plata este oprita implicit prin `NEXT_PUBLIC_STRIPE_ENABLED=false`.

## Conditii inainte de activare

Nu seta `NEXT_PUBLIC_STRIPE_ENABLED=true` pana nu exista:

1. Cont Stripe verificat, cont bancar asociat si setari fiscale finalizate.
2. Un sistem persistent de comenzi care retine configuratia aleasa **inainte** de plata si marcheaza comanda platita din webhook.
3. Un job idempotent de generare/livrare pe email dupa confirmarea platii.
4. Teste Stripe in test mode: plata reusita, plata esuata, webhook repetat si email livrat.
5. Politica de rambursare, date de facturare si emailul comercial verificate juridic.

Aplicatia curenta genereaza PDF-ul direct in browser. Din acest motiv, Checkout este pregatit, dar mentinut dezactivat: altfel o plata confirmata nu ar avea inca un context sigur al personalizarii din care sa fie creat produsul.

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

## Configurare Cloud Run

Adauga secretele in Google Cloud Secret Manager, apoi acorda service account-ului Cloud Run acces `Secret Manager Secret Accessor`. La deploy, le atasezi astfel:

```bash
gcloud run services update povestea-mea-magica \
  --region=europe-west3 \
  --update-secrets=STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest
```

In Stripe Dashboard adauga endpointul live:

```text
https://www.povestea-mea-magica.ro/api/stripe-webhook
```

Selecteaza cel putin `checkout.session.completed`, `checkout.session.async_payment_succeeded` si `checkout.session.async_payment_failed`.

## Date personale

Metadata Stripe contine numai codul produsului si versiunea catalogului. Numele copilului, textul povestii si alte campuri de personalizare nu trebuie trimise in Stripe metadata.
