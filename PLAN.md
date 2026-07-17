# PLAN.md - Povestea Mea Magica

## Obiectiv

Lansare rapida a site-ului ca produs digital pre-commerce: utilizatorul poate genera continut personalizat, verifica rezultatul si descarca PDF-ul. Stripe, livrarea automata pe email si conturile de client raman ultima etapa.

## Verdict Rapid

Site-ul este aproape gata pentru o lansare controlata. Dupa executia acestui plan, partea de pre-commerce este pregatita mai bine: exista pricing, exemple reale, content extins, safety/legal si mod production separat. Nu este inca pregatit pentru trafic platit sau clienti platitori fara AI stabil si Stripe complet.

Stare recomandata pentru lansare:

- **Acum:** beta privata / soft launch catre prieteni, parinti cunoscuti, comunitati mici.
- **Dupa 2-3 zile de polish:** public launch fara plati, cu colectare lead-uri / feedback.
- **Dupa AI stabil + Stripe + email:** launch comercial.

## Implementat In Aceasta Runda

- Sectiune de preturi pe homepage.
- Sectiune cu exemple reale din PDF-uri randate.
- `NEXT_PUBLIC_SITE_MODE` folosit pentru copy demo vs production.
- Frici noi pentru Scut Magic:
  - frica de intuneric;
  - vise urate.
- Context nou pentru Trusa Magica:
  - aeroport / avion;
  - stat la coada / institutii.
- Text de siguranta pentru spray-ul simbolic.
- Microcopy pentru campurile din Story Creator.
- Pagina Politica de Rambursare.
- Pagina Siguranta si Continut AI.
- Linkuri noi in footer catre politicile relevante.
- FAQ extins pentru AI indisponibil si limitele kiturilor anti-frica.

## Ce Este Deja Bun

- Designul si pozitionarea sunt coerente pentru un produs cald, parental, in romana.
- Exista 3 produse digitale clare:
  - Poveste personalizata pentru copil.
  - Scut Magic pentru Noapte.
  - Trusa Magica de Urgenta.
- PDF-urile au fost imbunatatite: layout mai plin, pagini mai utile, descarcare mai robusta.
- Story prompt-ul este mai bun decat varianta initiala si include:
  - nume copil;
  - varsta;
  - lume;
  - lectie;
  - detalii despre copil;
  - ton;
  - fallback stabil daca AI-ul pica.
- Exista diferentiere `demo` vs `production` prin `NEXT_PUBLIC_SITE_MODE`.
- Exista `/api/health` pentru verificare de environment.
- Legal pages exista si pot fi adaptate pentru modul fara plati.

## Blocaje Inainte De Productie Reala

### 1. AI instabil

Problema cea mai importanta: cheia Gemini actuala returneaza uneori:

- `high demand`;
- quota free-tier depasita;
- model indisponibil.

Ce trebuie facut:

- Foloseste o cheie Gemini cu billing/quota activa.
- Pastreaza `GEMINI_MODEL` configurabil in Vercel.
- Testeaza minim 20 generari consecutive in productie.
- Daca Gemini ramane instabil, schimba providerul pentru text.

Decizie recomandata: **nu lansa paid traffic pana cand AI-ul real are rata de succes >95%.**

### 2. Stripe si livrare

Momentan Stripe este parcat. Pentru vanzare reala trebuie:

- checkout;
- webhook verificat;
- salvare comanda;
- email cu PDF / link de descarcare;
- pagina de success;
- pagina de retry/failure.

### 3. Continut legal final

Termenii si politica de confidentialitate sunt suficiente pentru pre-commerce, dar trebuie actualizate inainte de plati:

- operator date;
- firma/PFA/SRL;
- CUI daca exista;
- politica rambursari;
- ce se intampla cu prompturile si datele copilului;
- procesatori: Gemini, ElevenLabs, Stripe, email provider, hosting.

### 4. Rate limiting si abuz

Endpoint-ul AI poate fi chemat repetat. Inainte de public launch mai mare:

- limita per IP;
- limita per sesiune;
- captcha light sau turnstile daca apar abuzuri;
- logging de erori.

## Diferentiere Demo Vs Production

Foloseste:

```env
NEXT_PUBLIC_SITE_MODE=demo
```

pentru local/preview si:

```env
NEXT_PUBLIC_SITE_MODE=production
```

pentru site public.

In `production`, copy-ul nu mai spune "Incearca gratuit" sau "demo", ci:

- "Creeaza povestea";
- "Genereaza povestea";
- "Alege produsul";
- "Status Serviciu";
- legal wording de versiune curenta fara plati active.

## Preturi Recomandate

### Context piata

Repere gasite in piata:

- Fabrica de Povesti: PDF personalizat la **29,99 lei**, carte fizica la **49,99 lei**. Sursa: https://fabricadepovesti.ro/
- Pagini Magice: PDF de la **24,90 lei**, carte tiparita de la **79,90 lei**. Sursa: https://paginimagice.ro/preturi/
- Carte Fermecata pentru Copii: eBook la **34,99 RON**, carte cartonata la **139,90 RON**. Sursa: https://cartefermecatapentrucopii.ro/
- Amintiri de Poveste: carte premium personalizata la **349 lei**. Sursa: https://amintiridepoveste.ro/
- Etsy: PDF-uri personalizate internationale frecvent in zona **$6,99-$13,99+**, unele mai scumpe. Exemplu: https://www.etsy.com/listing/4382924890/personalized-kids-storybook-custom

### Recomandare launch

#### Produs 1: Poveste Personalizata PDF

Pret recomandat launch: **29 lei**

Motiv:

- Se incadreaza in piata locala de PDF-uri AI.
- E usor de cumparat impulsiv.
- Nu promite inca print fizic sau ilustratii multe.

Pret dupa validare: **34,90 lei**

Include:

- poveste personalizata;
- coperta ilustrata;
- PDF descarcabil;
- editare text in browser inainte de PDF.

#### Produs 2: Scut Magic pentru Noapte

Pret recomandat launch: **19 lei**

Motiv:

- Este un kit util, dar mai mic decat povestea principala.
- Are valoare emotionala puternica pentru parinti cu frici de noapte.

Pret dupa validare: **24,90 lei**

Include:

- certificat;
- reteta spray magic;
- etichete pentru flacon;
- text adaptat fricii selectate.

#### Produs 3: Trusa Magica de Urgenta

Pret recomandat launch: **19 lei**

Motiv:

- Produs rapid, practic, bun pentru restaurant/drum/doctor.
- Poate deveni entry product.

Pret dupa validare: **24,90 lei**

Include:

- 6 pagini PDF;
- radar magic;
- provocare de desen;
- rabdare/respiratie;
- inceputuri de povesti;
- adevarat/fals;
- diploma.

#### Bundle: Pachetul Parintelui Pregatit

Pret recomandat launch: **49 lei**

Include:

- 1 poveste PDF;
- 1 Scut Magic pentru Noapte;
- 1 Trusa Magica de Urgenta.

Pret dupa validare: **59-69 lei**

Acesta ar trebui sa fie oferta recomandata pe site.

#### Upsell viitor: Audio

Pret suplimentar recomandat: **+9 lei**

Doar dupa ce ElevenLabs este stabil si costurile sunt clare.

#### Upsell viitor: Carte fizica

Nu intra acum. Pentru print fizic, target minim:

- **79-99 lei** pentru carte simpla;
- **129-149 lei** pentru premium;
- **199+ lei** pentru produs complet personalizat cu revizie manuala.

## Ce Continut Mai Trebuie Definitivat

### Homepage

De definitivat:

- promisiune clara in hero: "Creezi in cateva minute materiale personalizate pentru copilul tau";
- sectiune scurta cu cele 3 produse;
- exemple reale din PDF-uri;
- explicatie sincera: generare AI + verificare de adult;
- CTA principal catre "Creeaza povestea".

### Story Creator

De definitivat:

- microcopy pentru campuri:
  - "Detalii despre lume";
  - "Cum sa apara lectia";
  - "Detalii despre copil".
- mesaj clar cand AI fallback e folosit.
- exemple de input sub campuri, ca parintele sa stie ce sa scrie.

### Scut Magic pentru Noapte

De definitivat:

- adauga 1-2 frici extra:
  - "frica de intuneric";
  - "frica de vise urate".
- text de siguranta: spray-ul e joc simbolic, preparat de adult, fara aplicare pe piele/ochi.

### Trusa Magica de Urgenta

De definitivat:

- adauga context "in avion / aeroport" daca publicul calatoreste.
- adauga context "la coada / institutii".

### Legal

Inainte de plati:

- pagina rambursari;
- date operator;
- checkbox termeni la checkout;
- politica de continut generat AI.

## Productie: Environment Necesar

In Vercel Production:

```env
NEXT_PUBLIC_SITE_MODE=production
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.0-flash
ELEVENLABS_API_KEY=...
```

Cand activezi Stripe:

```env
STRIPE_SECRET_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
STRIPE_WEBHOOK_SECRET=...
RESEND_API_KEY=...
```

Verificare:

```text
/api/health
```

Trebuie sa returneze:

```json
{
  "ready": true,
  "siteMode": "production"
}
```

## Plan Pe 7 Zile

### Ziua 1 - Production copy si QA

- Seteaza `NEXT_PUBLIC_SITE_MODE=production`.
- Verifica homepage, legal pages, FAQ, footer.
- Scoate orice wording de "demo" din productia publica.
- Genereaza cate 3 exemple pentru fiecare produs.

### Ziua 2 - AI stabil

- Activeaza billing/quota pentru Gemini.
- Testeaza 20 generari consecutive.
- Noteaza rata de succes, timp mediu si calitate.
- Decide daca ramai pe Gemini sau schimbi providerul.

### Ziua 3 - Continut si exemple

- Alege 3 exemple publice:
  - poveste;
  - scut de noapte;
  - trusa de urgenta.
- Pune screenshot-uri / mockup-uri reale pe site.
- Adauga intrebari frecvente despre AI si siguranta.

### Ziua 4 - Soft launch fara plati

- Lanseaza public fara Stripe.
- CTA: "Creeaza povestea".
- Colecteaza feedback manual.
- Cere 5-10 pareri de la parinti.

### Ziua 5 - Stripe

- Adauga checkout.
- Adauga pagina success.
- Adauga webhook verificat.
- Salveaza comanda.
- Trimite email cu link/PDF.

### Ziua 6 - Legal si operational

- Actualizeaza Termeni, Privacy, Refund Policy.
- Configureaza email support.
- Adauga logging erori.
- Adauga rate limiting.

### Ziua 7 - Paid launch light

- Lanseaza cu buget mic.
- Oferta recomandata:
  - Poveste PDF: 29 lei;
  - Scut Magic: 19 lei;
  - Trusa Urgenta: 19 lei;
  - Bundle: 49 lei.
- Masoara:
  - rata generare reusita;
  - rata descarcare PDF;
  - conversie CTA;
  - feedback calitate poveste.

## Checklist Inainte De Lansare Publica

- [ ] `NEXT_PUBLIC_SITE_MODE=production` in Vercel.
- [ ] `/api/health` este `ready: true`.
- [ ] Gemini nu mai returneaza quota/high-demand frecvent.
- [ ] 20 generari story testate.
- [ ] 10 PDF-uri descarcate fara eroare.
- [x] Legal pages nu mai spun demo in productie.
- [x] Footer nu mai spune demo in productie.
- [x] CTA principal este "Creeaza povestea".
- [x] Preturile sunt decise.
- [x] Exista pricing pe homepage.
- [x] Exista exemple reale PDF pe homepage.
- [x] Exista politica de rambursare.
- [x] Exista pagina de siguranta AI.
- [ ] Stripe este fie dezactivat complet, fie complet functional.
- [ ] Exista email de contact real.

## Decizia Recomandata

Lanseaza intai ca **pre-commerce production**:

- fara Stripe;
- cu AI stabilizat;
- cu PDF download;
- cu feedback manual;
- cu preturile comunicate intern, nu neaparat afisate.

Activeaza plata doar dupa ce ai confirmat ca:

- AI-ul raspunde stabil;
- PDF-urile arata bine;
- parintii inteleg produsul;
- ai minim 5 exemple bune generate real.
